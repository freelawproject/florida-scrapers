import { Page } from "puppeteer"
import { createFolder, writeHTMLToFile } from "../lib/file"
import { windowSet } from "../lib/utils"

interface DocumentJSON {
  docNo: string,
  downloaded: boolean
  date: string
  description: string
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
    const fileNumber = filename.split(' - ')[0]
    const pageHTML = await page.content()

    await createFolder(`storage/${fileNumber}`)
    await writeHTMLToFile(`storage/${fileNumber}/${filename}`, pageHTML)

    // find document table
    const table = await page.$('table#gridDockets')
    // iterate over the rows
    await table.$$eval('tr', (els) => {
      els.forEach(element => {
        // each row has five tds
        // 0 - Document Seq No.
        // 1 - Document Action Link (Request or Download)
        // 2 - Document Identification Number (Same as 0)
        // 3 - Date
        // 4 - Entry Description
        const json: DocumentJSON = {
          docNo: "",
          downloaded: false,
          date: "",
          description: ""
        }
        const cells = Array.from(element.querySelectorAll('td'))
        cells.forEach((td, index) => {
          switch(index){
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
      })
    })

    // log documentJSON to file

  } catch (e) {

  }
}