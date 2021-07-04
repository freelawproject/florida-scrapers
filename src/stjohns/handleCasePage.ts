import { Browser, ElementHandle, Page } from "puppeteer"
import { createFolder, writeBlobToDisk, writeHTMLToFile } from "../lib/file"
import { waitFor, windowSet } from "../lib/utils"
import fetch from "cross-fetch"
import { CaseJSON, writeJSONtoFile } from "../lib/logs"

interface DocumentJSON {
  docNo: string
  downloaded: boolean
  downloadable?: boolean
  date: string
  description: string
  row?: number
}

const STORAGE_PREFIX = `${process.cwd()}/storage/stjohns/files`

const handlePopup = async (
  browser: Browser,
  fileNumber: string,
  j: DocumentJSON
): Promise<{ json: DocumentJSON; page: Page }> => {
  return new Promise((resolve, reject): void => {
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

          //@ts-expect-error calling from class
          const res = await fetch(req._url, options)
          await waitFor(150)
          console.log(`Status: ${res.statusText}`)
          if (res.ok) {
            const blob = await res.blob()
            const fileName = `${j.docNo}-case-${fileNumber}.pdf`
            console.log(`Saving file ${fileName} to folder ${fileNumber}`)
            const success = await writeBlobToDisk(blob, `${STORAGE_PREFIX}/${fileNumber}/${fileName}`)
            const response = {
              json: { ...j, downloaded: success },
              page: newPage as Page,
            }
            resolve(response)
          } else {
            reject(res.statusText)
          }
        }
      })
    })
  })
}

// There are two variants of Docket Results
// A. One with publicly avaialble dockets (six cells)
// 0 - Document Seq No.
// 1 - Viewer
// 2 - Document Action Link (Request or Download)
// 3 - Document Identification Number (Same as 0)
// 4 - Date
// 5 - Entry Description

export const getTrimmedContent = async (el: ElementHandle): Promise<string | undefined> => {
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
const handleDocketWithoutPublicDocs = async (cells: ElementHandle[], row: number): Promise<DocumentJSON> => {
  return {
    row: row,
    downloaded: false,
    docNo: await getTrimmedContent(cells[0]),
    date: await getTrimmedContent(cells[3]),
    description: await getTrimmedContent(cells[4]),
  }
}

export const handleCasePage = async (page: Page, browser: Browser, caseNo: string): Promise<void> => {
  await windowSet(page, "caseNo", caseNo)
  try {
    // wait for the  caseSearch to be present
    await page.waitForSelector('input[type="radio"][searchtype="CaseNumber"]')
    await page.$('input[type="radio"][searchtype="CaseNumber"]')
    console.log(`Searching for Case No. ${caseNo}`)

    await page.waitForSelector('input[id="caseNumber"]')

    await page.$eval('input[id="caseNumber"]', (node) => node.setAttribute("value", window.caseNo))

    await page.waitForSelector("button#searchButton")
    const searchBtn = await page.$("button#searchButton")
    await searchBtn.click()
    await page.waitForNavigation()

    const filename = await page.title()
    const fileNumber = filename.split(" - ")[0]
    const pageHTML = await page.content()

    console.log("Creating Folder and Saving Docket HTML")
    await createFolder(`${STORAGE_PREFIX}/${fileNumber}`)
    await writeHTMLToFile(`${STORAGE_PREFIX}/${fileNumber}/${filename}.html`, pageHTML)

    // find document table
    const table = await page.$("table#gridDockets")

    console.log(`Extracting document information for case ${caseNo}`)
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

    const json: DocumentJSON[] = await Promise.all(rowInfo)

    console.log(`Found ${json.length} documents. Checking for availability ...`)

    const downloadedJsonInfo = []

    for (let i = 0; i < json.length; i++) {
      const j = json[i]
      if (j.downloadable) {
        const row = rows[j.row]
        const cells = await row.$$("td")
        const anchorCell = cells[2]
        const anchor = await anchorCell.$("a")
        const newPagePromise = handlePopup(browser, fileNumber, j)
        console.log(`Document ${j.docNo} is downloadable. Attempting to fetch it ...`)
        await anchor.click()
        const { page: newPage, json } = await newPagePromise
        downloadedJsonInfo.push(json)
        await newPage.close()
      } else {
        downloadedJsonInfo.push(j)
      }
    }

    const resolvedJsonInfo = await Promise.all(downloadedJsonInfo)

    console.log(`Writing log for case ${caseNo} to file`)
    await writeJSONtoFile(`${STORAGE_PREFIX}/${caseNo}/log.json`, resolvedJsonInfo)
  } catch (e) {
    console.log(`Error processing case ${caseNo}: ${e}`)
  } finally {
    browser.close()
  }
}
