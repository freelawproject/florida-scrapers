import { Page } from "puppeteer"
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

const handleDownloadLink = async (anchor: HTMLAnchorElement): Promise<boolean> => {
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
const handleDocketWithPublicDocs = async (cells: HTMLTableDataCellElement[], page: Page): Promise<DocumentJSON> => {
  const json = getEmptydocJson()
  cells.forEach((td, index) => {
    switch (index) {
      case 0: {
        // get the docNo from the DIN in 2
        return
      }
      case 1: {
        return
      }
      case 2: {
        // try and download and store
        // if successful, set json[downloaded] = true
      }
      case 3: {
        json.docNo = td.textContent
        return
      }
      case 4: {
        json.date = td.textContent
        return
      }
      case 5: {
        json.description = td.textContent
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
const handleDocketWithoutPublicDocs = async (cells: HTMLTableDataCellElement[], page: Page): Promise<DocumentJSON> => {
  const json = getEmptydocJson()

  cells.forEach((td, index) => {
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
        json.docNo = td.textContent
        return
      }
      case 3: {
        json.date = td.textContent
        return
      }
      case 4: {
        json.description = td.textContent
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
export const handleCasePage = async (page: Page, url: string): Promise<void> => {
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
    await table.$$eval("tr", (els) => {
      els.forEach(async (element) => {
        // each row has five / six? tds
        // 0 - Document Seq No.
        // 1 - Document Action Link (Request or Download) // Viewer
        // 2 - Document Identification Number (Same as 0) // Image
        // 3 - Date
        // 4 - Entry Description
        const cells = Array.from(element.querySelectorAll("td"))
        let json: DocumentJSON
        if (cells.length === 5) {
          json = await handleDocketWithoutPublicDocs(cells, page)
        } else if (cells.length === 6) {
          json = await handleDocketWithPublicDocs(cells, page)
        }
      })
    })
    // log documentJSON to file
  } catch (e) {}
}
