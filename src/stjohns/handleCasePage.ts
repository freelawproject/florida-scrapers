import { Browser, ElementHandle, Page } from "puppeteer"
import { createFolder, writeHTMLToFile } from "../lib/file"
import { windowSet } from "../lib/utils"

interface DocumentJSON {
  docNo: string
  downloaded: boolean
  date: string
  description: string
}

const getEmptydocJson = (): DocumentJSON => ({
  docNo: "",
  downloaded: false,
  date: "",
  description: "",
})

const handleDownloadLink = async (anchor: ElementHandle, page: Page): Promise<boolean> => {
  let success = false
  try {
  } catch (e) {
    // delete the saved info
    // set the success var to false
    success = false
  }
  return success
}

// There are two variants of Docket Results
// A. One with publicly avaialble dockets (six cells)
// 0 - Document Seq No.
// 1 - Viewer
// 2 - Document Action Link (Request or Download)
// 3 - Document Identification Number (Same as 0)
// 4 - Date
// 5 - Entry Description
const handleDocketWithPublicDocs = async (cells: ElementHandle[], browser: Browser): Promise<DocumentJSON> => {
  const json = getEmptydocJson()
  cells.forEach(async (td, index) => {
    switch (index) {
      case 0: {
        // get the docNo from the DIN in 2
        return
      }
      case 1: {
        return
      }
      case 2: {
        // click on anchor
        const anchor = await td.$("a")
        const anchorInfo = {
          id: anchor.getProperty("id"),
          digest: anchor.getProperty("digest"),
          rel: anchor.getProperty("rel"),
        }
        await anchor.click()
        const pagePromise = new Promise((x) => browser.once("targetcreated", (target) => x(target.page())))
        const popup = await pagePromise
        console.log(popup)
        await popup.waitForSelector('frameset[title="PDF Viewer"]')
        // save the file

        // if successful, set json[downloaded] = true
      }
      case 3: {
        const docNo = await td.evaluate((node) => node.textContent)
        json.docNo = docNo
        return
      }
      case 4: {
        const date = await td.evaluate((node) => node.textContent)
        json.date = date
        return
      }
      case 5: {
        const description = await td.evaluate((node) => node.textContent)
        json.description = description
        return
      }
      default: {
        return
      }
    }
  })
  return json
}

// B.  One Without Publicly avaiable Documents (five cells)
// 0 - Document Seq No.
// 1 - Document Action Link (Request or Download)
// 2 - Document Identification Number (Same as 0)
// 3 - Date
// 4 - Entry Description
const handleDocketWithoutPublicDocs = async (cells: ElementHandle[]): Promise<DocumentJSON> => {
  const json = getEmptydocJson()

  cells.forEach(async (td, index) => {
    switch (index) {
      case 0: {
        // get the docNo from the DIN in 2
        return
      }
      case 1: {
        // try and download and store

        // if successful, set json[downloaded] = true
        return
      }
      case 2: {
        const docNo = await td.evaluate((node) => node.textContent)
        json.docNo = docNo
        return
      }
      case 3: {
        const date = await td.evaluate((node) => node.textContent)
        json.date = date
        return
      }
      case 4: {
        const description = await td.evaluate((node) => node.textContent)
        json.description = description
        return
      }
      default: {
        return
      }
    }
  })
  return json
}

/**
 * HandleCasePage
 * Function that saves the html to file
 * and downloads each public document
 */
export const handleCasePage = async (browser: Browser, url: string): Promise<void> => {
  const page = await browser.newPage()

  await windowSet(page, "username", process.env.LOGIN_USERNAME)
  await windowSet(page, "password", process.env.LOGIN_PASSWORD)

  console.log(`Navigating to ${url}`)
  await page.goto(url)

  try {
    const filename = await page.title()
    const fileNumber = filename.split(" - ")[0]
    const pageHTML = await page.content()

    await createFolder(`storage/${fileNumber}`)
    await writeHTMLToFile(`storage/${fileNumber}/${filename}`, pageHTML)

    // find document table
    const table = await page.$("table#gridDockets")
    // iterate over the rows
    const rows = await table.$$("tr")

    rows.forEach(async (tr) => {
      const cells = await tr.$$("td")
      let json: DocumentJSON
      if (cells.length === 5) {
        json = await handleDocketWithoutPublicDocs(cells)
      } else {
        json = await handleDocketWithPublicDocs(cells, browser)
      }
    })

    console.log(rows)
    // log documentJSON to file
  } catch (e) {}
}
