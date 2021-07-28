import fetch from "cross-fetch"
import { Browser, ElementHandle, Page } from "puppeteer"
import { initBrowser } from "../lib/browser"
import { createFolder, writeBlobToDisk, writeHTMLToFile } from "../lib/file"
import { readJSONFromFile, writeJSONtoFile } from "../lib/logs"
import { waitFor, windowSet } from "../lib/utils"
import { login } from "./login"

const DEBUG = false

const PICK_UP_FROM = "2016GA000072"

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

const STORAGE_PREFIX = `${process.cwd()}/storage/stlucie`

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
      caseNo: "2021CP000909",
    },
  ],
}
const downloadAllCaseInformation = async (): Promise<void> => {
  const json = await readJSONFromFile(`${STORAGE_PREFIX}/combined-search-results.json`)
  let data = json.data
  if (PICK_UP_FROM) {
    const startIndex = data.findIndex((docket) => {
      return docket.caseNo === PICK_UP_FROM
    })
    console.log(startIndex)
    if (startIndex) {
      // increment by one to get past 2012CP0000005
      data = data.slice(startIndex + 1)
    }
  }
  if (DEBUG) {
    data = testJson.data
  }

  console.log(`Beginning download of files for ${data.length} cases. Chomp chomp.`)
  const browser = await initBrowser()

  for (let i = 0; i < data.length; i++) {
    const docket = data[i]

    await createFolder(`${STORAGE_PREFIX}/files/${docket.caseNo}`)

    const page = await browser.newPage()
    // up timeout to 60 seconds
    page.setDefaultTimeout(60000)
    page.on("console", (msg) => console.log(`CLIENT: `, msg.text()))
    await windowSet(page, "caseNo", docket.caseNo)

    await login(page)

    // await page.setRequestInterception(true)
    // const caseNumberToggle = await page.$('input[type="radio"][searchtype="CaseNumber"]')
    // await caseNumberToggle.click()
    console.log(`Searching for Case No. ${docket.caseNo}`)

    await page.waitForSelector("form.searchform")
    const form = await page.$("form.searchform")
    await waitFor(1000)
    await form.$$eval("input", (els) => [
      els.forEach((el) => {
        const name = el.getAttribute("name")
        if (name === "type") {
          el.setAttribute("value", "CaseNumber")
        } else if (name === "search") {
          el.setAttribute("value", window.caseNo)
        }
      }),
    ])
    await waitFor(1500)
    await form.evaluate((f) => (f as HTMLFormElement).submit())

    // await page.waitForSelector('input[id="caseNumber"]')
    // await waitFor(100)
    // await page.$eval('input[id="caseNumber"]', (node) => node.setAttribute("value", window.caseNo))
    // await waitFor(1000)
    // const searchBtn = await page.$("button#searchButton")
    // await searchBtn.click()
    await page.waitForNavigation({ waitUntil: "domcontentloaded" })
    console.log("Waiting for document table to load")
    await page.waitForSelector("table#gridDockets", { timeout: 60000 })
    const table = await page.$("table#gridDockets")

    const filename = await page.title()
    const pageHTML = await page.content()

    await writeHTMLToFile(`${STORAGE_PREFIX}/files/${docket.caseNo}/${filename}.html`, pageHTML)

    console.log(`Extracting document information for case ${docket.caseNo}`)

    const rows = await table.$$("tr")

    const processed = rows.map(async (tr, idx) => {
      const cells = await tr.$$("td")

      // There is one variant of Docket Results
      // A. Four cells
      let isDownloadable = false

      const dateCell = cells[3]
      const descriptionCell = cells[4]

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

    const finalJsonData = resolved

    // for (let docIndex = 0; docIndex < resolved.length; docIndex++) {
    //   const doc = resolved[docIndex]
    //   if (!doc.downloadable) {
    //     finalJsonData.push(doc)
    //   } else {
    //     await waitFor(500)
    //     console.log(`Document ${doc.docNo} is downloadable. Attempting to fetch it ...`)
    //     const row = rows[doc.row]
    //     const cells = await row.$$("td")
    //     const anchor = await cells[1].$("a")

    //     const popupPromise = getPopupPage(browser)
    //     await anchor.click()
    //     const popupPage = await popupPromise
    //     popupPage.on("request", async (req) => {
    //       //@ts-expect-error calling from class
    //       const { _url, _method, _postData, _headers } = req
    //       const isPdfUrl = _url.match(/GetPDF\?/)

    //       if (!isPdfUrl) {
    //         req.continue()
    //       } else {
    //         try {
    //           const cookies = await popupPage.cookies()
    //           const res = await fetch(_url, {
    //             method: _method,
    //             body: _postData,
    //             headers: {
    //               ..._headers,
    //               Cookie: cookies.map((c) => `${c.name}=${c.value}`).join(";"),
    //             },
    //           })
    //           console.log(`Fetch returned status: ${res.statusText}`)
    //           if (res.ok) {
    //             const blob = await res.blob()
    //             const fileName = `${doc.docNo}-case-${docket.caseNo}.pdf`
    //             console.log(`Saving file ${fileName} to folder ${docket.caseNo}`)
    //             await writeBlobToDisk(blob, `${STORAGE_PREFIX}/files/${docket.caseNo}/${fileName}`)
    //           }
    //           finalJsonData.push({ ...doc, downloaded: true })
    //         } catch (e) {
    //           console.log(`Failed to download document No ${doc.docNo} for case No ${docket.caseNo}`)
    //           finalJsonData.push(doc)
    //         } finally {
    //           req.continue()
    //         }
    //       }
    //     })

    //     console.log("waiting for response to finish ...")
    //     await page.waitForResponse((response) => {
    //       return !!response.url().match(/GetPDF\?/)
    //     })

    //     // console.log("waiting twenty seconds between requests")
    //     // await waitFor(20000)
    //     // turn off the popup listener so it can be reset
    //     browser.removeAllListeners("targetcreated")
    //     await popupPage.close()
    //   }
    // }

    console.log(`Writing log for case ${docket.caseNo} to file`)
    const finalFinalJsonData = await Promise.all(finalJsonData)
    await writeJSONtoFile(`${STORAGE_PREFIX}/files/${docket.caseNo}/log.json`, finalFinalJsonData)
    await page.close()
  }
  await browser.close()
}

const DOWNLOAD_BOOKMARK = "2018GA000015"

const downloadAllDocuments = async (): Promise<void> => {
  let data = await readJSONFromFile(`${STORAGE_PREFIX}/searches/cases-with-docs.json`)

  if (DOWNLOAD_BOOKMARK) {
    const index = data.findIndex((d) => d === DOWNLOAD_BOOKMARK)
    if (index > -1) {
      data = data.slice(index + 1)
    }
  }

  console.log(`Beginning download of documents from ${data.length} cases. Chomp chomp.`)

  const browser = await initBrowser()

  for (let i = 0; i < data.length; i++) {
    const docket = data[i]

    const page = await browser.newPage()
    // up timeout to 60 seconds
    page.setDefaultTimeout(60000)
    page.on("console", (msg) => console.log(`CLIENT: `, msg.text()))
    await windowSet(page, "caseNo", docket)

    await login(page)

    console.log(`Searching for Case No. ${docket}`)

    await page.waitForSelector("form.searchform")
    const form = await page.$("form.searchform")
    await waitFor(1000)
    await form.$$eval("input", (els) => [
      els.forEach((el) => {
        const name = el.getAttribute("name")
        if (name === "type") {
          el.setAttribute("value", "CaseNumber")
        } else if (name === "search") {
          el.setAttribute("value", window.caseNo)
        }
      }),
    ])
    await waitFor(1500)
    await form.evaluate((f) => (f as HTMLFormElement).submit())

    await page.waitForNavigation({ waitUntil: "domcontentloaded" })
    console.log("Waiting for document table to load")
    await page.waitForSelector("table#gridDockets", { timeout: 60000 })
    const table = await page.$("table#gridDockets")

    console.log(`Extracting document information for case ${docket}`)

    const rows = await table.$$("tr")

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const tr = rows[rowIndex]
      const cells = await tr.$$("td")
      const docNo = await getTrimmedContent(cells[0])
      if (cells[1]) {
        const anchor = await cells[1].$("a")
        if (anchor) {
          await waitFor(500)

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
              try {
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
                  const fileName = `${docNo}-case-${docket}.pdf`
                  console.log(`Saving file ${fileName} to folder ${docket}`)
                  await writeBlobToDisk(blob, `${STORAGE_PREFIX}/files/${docket}/${fileName}`)
                }
              } catch (e) {
                console.log(`Failed to download document No ${docNo} for case No ${docket}`)
              }
            }
          })
          console.log("waiting five seconds for response to finish ...")
          await waitFor(5000)

          browser.removeAllListeners("targetcreated")
          await popupPage.close()
        }
      }
    }

    await page.close()
  }
  await browser.close()
}

downloadAllDocuments()
