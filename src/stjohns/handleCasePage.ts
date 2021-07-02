import { Browser, ElementHandle, Page } from "puppeteer"
import { createFolder, writeHTMLToFile } from "../lib/file"
import { waitFor, windowSet } from "../lib/utils"
import { CaseJSON } from "./handleResultsPage"
import { loginToStJohns } from "./login"

interface DocumentJSON {
  docNo: string
  downloaded: boolean
  downloadable?: boolean
  date: string
  description: string
}

const handlePopup = async (browser: Browser, fileNumber: string): Promise<Page | void> => {
  return new Promise((resolve): Page | void => {
    browser.once("targetcreated", async (target): Promise<Page> => {
      const newPage = await target.page()
      await newPage._client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: `${process.cwd()}/storage/${fileNumber}`,
      })
      return newPage
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

const handleDocketWithPublicDocs = async (cells: ElementHandle[]): Promise<DocumentJSON> => {
  await waitFor(500)

  const json: DocumentJSON = {
    docNo: await getTrimmedContent(cells[0]),
    date: await getTrimmedContent(cells[4]),
    description: await getTrimmedContent(cells[5]),
    downloaded: false,
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
const handleDocketWithoutPublicDocs = async (cells: ElementHandle[]): Promise<DocumentJSON> => {
  return {
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
    const rowData: DocumentJSON[] = []

    const rows = await table.$$("tr")
    const rowInfo = rows.map(async (tr) => {
      const cells = await tr.$$("td")
      let json: DocumentJSON
      if (cells.length === 5) {
        json = await handleDocketWithoutPublicDocs(cells)
      } else {
        json = await handleDocketWithPublicDocs(cells)
      }
      return json
    })

    const json = await Promise.all(rowInfo)

    console.log(JSON.stringify(json, null, 2))

    // log documentJSON to file
  } catch (e) {
    console.error(e)
  }
}
