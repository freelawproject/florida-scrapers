import { Browser, ElementHandle, Frame, Page } from "puppeteer"
import { createFolder, writeHTMLToFile } from "../lib/file"
import { waitFor, windowSet } from "../lib/utils"
import { CaseJSON } from "./handleResultsPage"
import { loginToStJohns } from "./login"
import fetch from "cross-fetch"

interface DocumentJSON {
  docNo: string
  downloaded: boolean
  downloadable?: boolean
  date: string
  description: string
  row?: number
}

const handlePopup = async (browser: Browser, fileNumber: string): Promise<Page | void> => {
  return new Promise((resolve): Page | void => {
    browser.once("targetcreated", async (target): Promise<void> => {
      const newPage = await target.page({ waitFor: 200 })
      ;(newPage as Page).on("console", (msg) => console.log(`PAGE LOG: `, msg.text()))

      await (newPage as Page).setRequestInterception(true)
      ;(newPage as Page).on("request", async (req) => {
        //@ts-expect-error calling from class
        const url = req._url
        if (!url.match(/GetPDF\?/)) {
          req.continue()
        } else {
          req.abort()

          const options = {
            encoding: null,
            //@ts-expect-error calling from class
            method: req._method,
            //@ts-expect-error calling from class
            body: req._postData,
            //@ts-expect-error calling from class
            headers: req._headers,
          }

          const cookies = await (newPage as Page).cookies()

          options.headers.Cookie = cookies.map((ck) => `${ck.name}=${ck.value}`).join(";")

          console.log(options)
          //@ts-expect-error calling from class
          const res = await fetch(req._url, options)
          await waitFor(150)
          console.log(`Status: ${res.statusText}`)
          console.log(`Response Headers: ${JSON.stringify(res.headers, null, 2)}`)
          if (res.ok) {
            const blob = await res.blob()
            console.log(blob.type, blob.size)
          }
        }
      })
      resolve(newPage)
    })
  })
}

const waitForFrame = async (page: Page, frameId: string) => {
  const checkFrame = () => {
    const frame = page.frames().find((f) => {
      return f.name() === frameId
    })
    if (frame) {
      fulfill(frame)
    } else {
      page.once("frameattached", checkFrame)
    }
  }
  let fulfill: (value: unknown) => void
  const promise = new Promise((resolve) => (fulfill = resolve))
  checkFrame()
  return promise
}

// There are two variants of Docket Results
// A. One with publicly avaialble dockets (six cells)
// 0 - Document Seq No.
// 1 - Viewer
// 2 - Document Action Link (Request or Download)
// 3 - Document Identification Number (Same as 0)
// 4 - Date
// 5 - Entry Description

const getTrimmedContent = async (el: ElementHandle): Promise<string | undefined> => {
  if (el) {
    const text = await el.evaluate((node) => node.textContent)
    return text.replace(/\B\s+|\s+\B/g, "")
  }
  return
}

const handleDocketWithPublicDocs = async (cells: ElementHandle[], row: number): Promise<DocumentJSON> => {
  await waitFor(500)

  const json: DocumentJSON = {
    docNo: await getTrimmedContent(cells[0]),
    date: await getTrimmedContent(cells[4]),
    description: await getTrimmedContent(cells[5]),
    downloaded: false,
    row: row,
  }

  const anchorCell = cells[2]
  if (anchorCell) {
    const anchor = await anchorCell.$("a")
    if (anchor) {
      json.downloadable = true
    }
  }

  return json
}

// B.  One Without Publicly avaiable Documents (five cells)
// 0 - Document Seq No.
// 1 - Document Action Link (Request or Download)
// 2 - Document Identification Number (Same as 0)
// 3 - Date
// 4 - Entry Description
const handleDocketWithoutPublicDocs = async (cells: ElementHandle[], row): Promise<DocumentJSON> => {
  return {
    row: row,
    downloaded: false,
    docNo: await getTrimmedContent(cells[0]),
    date: await getTrimmedContent(cells[3]),
    description: await getTrimmedContent(cells[4]),
  }
}

/**
 * Locate the search by case Number input
 * format the case number and enter it
 * submit the form and wait for the page change
 */
const searchByCaseNumber = async (page: Page) => {
  const caseNumberSelectInput = await page.$('input[type="radio"][searchtype="CaseNumber"]')
  await caseNumberSelectInput.click()

  await page.waitForSelector('input[id="caseNumber"]')

  await waitFor(500)

  await page.$eval('input[id="caseNumber"', (el) => {
    el.setAttribute("value", window.caseNo)
  })

  await waitFor(500)

  const searchButton = await page.$("button#searchButton")
  await searchButton.click()
  await page.waitForNavigation()
}

/**
 * HandleCasePage
 * Function that saves the html to file
 * and downloads each public document
 */
export const handleCasePage = async (browser: Browser, caseInfo: CaseJSON, url: string): Promise<void> => {
  const page = await browser.newPage()

  await windowSet(page, "username", process.env.LOGIN_USERNAME)
  await windowSet(page, "password", process.env.LOGIN_PASSWORD)
  await windowSet(page, "caseNo", caseInfo.caseNumber)

  await page.goto(url)
  console.log(`Logging in through ${url}`)
  await loginToStJohns(page)

  await waitFor(200)

  // search for the case through the online form
  console.log(`Searching for case number ${caseInfo.caseNumber}`)
  await searchByCaseNumber(page)

  // give it 1500 ms for the tableGrid to appear
  await waitFor(1500)

  try {
    const filename = await page.title()
    const fileNumber = filename.split(" - ")[0]
    const pageHTML = await page.content()

    await createFolder(`${process.cwd()}/storage/${fileNumber}`)
    await writeHTMLToFile(`${process.cwd()}/storage/${fileNumber}/${filename}.html`, pageHTML)
    // find document table
    await page.waitForSelector("table#gridDockets")
    const table = await page.$("table#gridDockets")

    if (!table) {
      throw new Error("No grid docket table found. Try increasing the timeout")
    }

    const rows = await table.$$("tr")
    const rowInfo = rows.map(async (tr, row) => {
      const cells = await tr.$$("td")
      let json: DocumentJSON
      if (cells.length === 5) {
        json = await handleDocketWithoutPublicDocs(cells, row)
      } else {
        json = await handleDocketWithPublicDocs(cells, row)
      }
      return json
    })

    const json = await Promise.all(rowInfo)

    const firstDownloadable = json.find((j) => j.downloadable)

    const row = rows[firstDownloadable.row]

    const cells = await row.$$("td")

    const anchorCell = cells[2]
    const anchor = await anchorCell.$("a")
    const newPagePromise = handlePopup(browser, fileNumber)
    await anchor.click()
    const newPage = await newPagePromise

    // request to intercept?
    // https://apps.stjohnsclerk.com/Benchmark/ImageAsync.aspx/GetPDF?guid=bfe05552-b767-4158-988b-141a6c9c5081

    // const frame = await waitForFrame(newPage as Page, "frm_pdf")

    // const src = (frame as Frame).url()
    // await windowSet(newPage as Page, "pdfUrl", src)

    // await (newPage as Page).evaluate(() => {
    //   fetch(`${window.location}`)
    //     .then((res) => res)
    //     .then((res2) => {
    //       return res2.json()
    //     })
    //     .then((res3) => console.log(res3))
    // })

    // await (newPage as Page).type('')

    // log documentJSON to file
  } catch (e) {
    console.error(e)
  }
}
