import { Browser, ElementHandle, Page } from "puppeteer"
import { createFolder, writeHTMLToFile } from "../lib/file"
import { waitFor, windowSet } from "../lib/utils"
import { CaseJSON } from "./handleResultsPage"
import { loginToStJohns } from "./login"

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
const handleDocketWithPublicDocs = async (cells: ElementHandle[], browser: Browser, fileNumber: string): Promise<DocumentJSON> => {
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
        if (!anchor) {
          console.log('no anchor found')
          return
        }
        await anchor.click()
        const pagePromise = new Promise((x) => browser.once("targetcreated", (target) => x(target.page())))
        const popupPage = await pagePromise
        // save the file
        // @ts-expect-error popupPage is of class page
        await (popupPage as Page)._client.send('Page.setDownloadBehavior', { 
          behavior: 'allow',
          downloadPath: `./storage${fileNumber}`
        })
        // find the download button in the pdfViewer toolbar and click it




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
 * Locate the search by case Number input
 * format the case number and enter it
 * submit the form and wait for the page change
 */
const searchByCaseNumber = async (page: Page) => {
  const caseNumberSelectInput = await page.$('input[type="radio"][searchtype="CaseNumber"]')
  await caseNumberSelectInput.click()

  await page.waitForSelector('input[id="caseNumber"]');

  await waitFor(500)

  await page.$eval('input[id="caseNumber"', (el) => {
    el.setAttribute('value', window.caseNo)
  })
  
  await waitFor(500)

  const searchButton = await page.$('button#searchButton')
  await searchButton.click()
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

  // give it three seconds for the tableGrid to appear
  await waitFor(3000)


  try {

    const filename = await page.title()
    const fileNumber = filename.split(" - ")[0]
    const pageHTML = await page.content()

    await createFolder(`${process.cwd()}/storage/${fileNumber}`)
    await writeHTMLToFile(`${process.cwd()}/storage/${fileNumber}/${filename}.html`, pageHTML)

    await page.waitForSelector('div#caseDocketsAccordion')
    const docketAccordion = await page.$('div#caseDocketsAccordion')

    if (!docketAccordion) {
      throw new Error('No docketAccordion found. Try increasing the timeout')
    }
    // find document table
    await page.waitForSelector("table#gridDockets")
    const table = await docketAccordion.$("table#gridDockets")
    console.log(table)
    // iterate over the rows
    const rows = await table.$$("tr")
    console.log(rows)

    const rowInfo = rows.map(async (tr) => {
      const cells = await tr.$$("td")
      let json: DocumentJSON
      if (cells.length === 5) {
        json = await handleDocketWithoutPublicDocs(cells)
      } else {
        json = await handleDocketWithPublicDocs(cells, browser, fileNumber)
      }
    })

    console.log(rowInfo)
    // log documentJSON to file
  } catch (e) {
    console.error(e)
  }
}
