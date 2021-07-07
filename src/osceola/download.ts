import fetch from "cross-fetch"
import { Browser, ElementHandle, Page } from "puppeteer"
import { initBrowser } from "../lib/browser"
import { createFolder, writeBlobToDisk, writeHTMLToFile } from "../lib/file"
import { readJSONFromFile, writeJSONtoFile } from "../lib/logs"
import { waitFor, windowSet } from "../lib/utils"
import { login } from "./login"

const DEBUG = false

export const getTrimmedContent = async (el: ElementHandle): Promise<string | undefined> => {
  if (el) {
    const text = await el.evaluate((node) => node.textContent)
    return text.replace(/\B\s+|\s+\B/g, "")
  }
  return
}
declare global {
  interface Window {
    username: string
    password: string
    caseNo?: string
    startDate?: string
    endDate?: string
  }
}

const STORAGE_PREFIX = `${process.cwd()}/storage/osceola`

export const getPopupPage = async (browser: Browser): Promise<Page> => {
  return new Promise((resolve) => {
    browser.once("targetcreated", async (target) => {
      const page = (await target.page({ waitFor: 500 })) as Page
      page.on("console", (msg) => console.log(`POPUP: ${msg.text()}`))
      await page.setRequestInterception(true)

      resolve(page)
    })
  })
}

const testJson = {
  count: 1,
  data: [
    {
      caseNo: "2021 CP 000475 PR",
    },
  ],
}
const downloadAllDocuments = async (): Promise<void> => {
  const json = DEBUG ? testJson : await readJSONFromFile(`${STORAGE_PREFIX}/combined-search-results.json`)

  const { data, count } = json
  console.log(`Beginning download of files for ${count} cases. Chomp chomp.`)
  const browser = await initBrowser()

  for (let i = 0; i < data.length; i++) {
    const docket = data[i]

    await createFolder(`${STORAGE_PREFIX}/files/${docket.caseNo}`)

    const page = await browser.newPage()
    page.on("console", (msg) => console.log(`CLIENT: `, msg.text()))

    await windowSet(page, "caseNo", docket.caseNo)

    await login(page)

    const caseNumberToggle = await page.$('input[type="radio"][searchtype="CaseNumber"]')
    await caseNumberToggle.click()
    console.log(`Searching for Case No. ${docket.caseNo}`)

    await page.waitForSelector('input[id="caseNumber"]')
    await waitFor(100)
    await page.$eval('input[id="caseNumber"]', (node) => node.setAttribute("value", window.caseNo))
    const searchBtn = await page.$("button#searchButton")
    await waitFor(1000)
    await searchBtn.click()
    await page.waitForNavigation()

    const filename = await page.title()
    const pageHTML = await page.content()
    await writeHTMLToFile(`${STORAGE_PREFIX}/files/${docket.caseNo}/${filename}.html`, pageHTML)

    await page.waitForSelector("table#gridDockets", { timeout: 30000 })
    console.log(`Extracting document information for case ${docket.caseNo}`)
    const table = await page.$("table#gridDockets")

    console.log("Waiting five seconds for document table to load")
    await waitFor(5000)

    const rows = await table.$$("tr")

    const processed = rows.map(async (tr, idx) => {
      const cells = await tr.$$("td")

      // There is one variant of Docket Results
      // A. Four cells
      let isDownloadable = false

      const dateCell = cells[2]
      const descriptionCell = cells[3]

      if (cells[1]) {
        const anchor = await cells[1].$("a")
        if (anchor) {
          isDownloadable = true
        }
      }

      return {
        row: idx,
        dowloaded: false,
        docNo: await getTrimmedContent(cells[0]),
        date: await getTrimmedContent(dateCell),
        description: await getTrimmedContent(descriptionCell),
        downloadable: isDownloadable,
      }
    })

    const resolved = await Promise.all(processed)
    console.log(`Found ${resolved.length} documents.`)

    const finalJsonData = []

    for (let docIndex = 0; docIndex < resolved.length; docIndex++) {
      const doc = resolved[docIndex]
      if (!doc.downloadable) {
        finalJsonData.push(doc)
      } else {
        await waitFor(500)
        console.log(`Document ${doc.docNo} is downloadable. Attempting to fetch it ...`)
        const row = rows[doc.row]
        const cells = await row.$$("td")
        const anchor = await cells[1].$("a")

        const popupPromise = getPopupPage(browser)
        await anchor.click()
        const popupPage = await popupPromise
        popupPage.on("request", async (req) => {
          //@ts-expect-error calling from class
          const { _url, _method, _postData, _headers } = req
          const isPdfUrl = _url.match(/GetPDF\?/)

          if (!isPdfUrl) {
            req.continue()
          } else {
            req.abort()

            const cookies = await popupPage.cookies()
            const res = await fetch(_url, {
              method: _method,
              body: _postData,
              headers: {
                ..._headers,
                Cookie: cookies.map((c) => `${c.name}=${c.value}`).join(";"),
              },
            })
            console.log(`Fetch returned status: ${res.statusText}`)
            if (res.ok) {
              const blob = await res.blob()
              const fileName = `${doc.docNo}-case-${docket.caseNo}.pdf`
              console.log(`Saving file ${fileName} to folder ${docket.caseNo}`)
              await writeBlobToDisk(blob, `${STORAGE_PREFIX}/files/${docket.caseNo}/${fileName}`)
            }
            finalJsonData.push({ ...doc, downloaded: true })
          }
        })

        console.log("waiting five seconds between requests")
        await waitFor(5000)
        // turn off the popup listener so it can be reset
        browser.removeAllListeners("targetcreated")
        await popupPage.close()
      }
    }

    console.log(`Writing log for case ${docket.caseNo} to file`)
    const finalFinalJsonData = await Promise.all(finalJsonData)
    await writeJSONtoFile(`${STORAGE_PREFIX}/files/${docket.caseNo}/log.json`, finalFinalJsonData)
    await page.close()
  }
  await browser.close()
}

downloadAllDocuments()
