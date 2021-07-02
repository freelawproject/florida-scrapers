import { Page } from "puppeteer"
import { writeRowsToCSV } from "../lib/csv"
import { writeBlobToDisk } from "../lib/file"
import { waitFor } from "../lib/utils"
import fetch from "cross-fetch"

const SEARCH_PAGE_URL = "https://apps.stjohnsclerk.com/Benchmark//CourtCase.aspx/CaseSearch"

export interface CaseJSON {
  partyName: string
  partyDetailsUrl: string
  partyType: string
  caseDetailsUrl: string
  caseNumber: string
  caseStatus: string
}

/**
 * HandleResultsPage
 * Function that extracts the table rows from the Search Results Page
 * and stores the case details data into a csv
 */

export const handleAllresults = async (page: Page, searchId: string): Promise<void> => {
  console.log(`Downloading csv from results page for searchId: ${searchId}`)
  await page.setRequestInterception(true)
  page.on("request", async (req) => {
    //@ts-expect-error calling from class
    const url = req._url
    if (!url.match(/ExportResults\?/)) {
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
      const cookies = await page.cookies()
      options.headers.Cookie = cookies.map((ck) => `${ck.name}=${ck.value}`).join(";")
      await waitFor(150)
      const res = await fetch(url, options)
      console.log(`Status: ${res.statusText}`)
      let success: boolean
      try {
        if (res.ok) {
          const blob = await res.blob()
          const fileName = `${searchId}.csv`
          console.log(`Saving ${fileName}`)
          success = await writeBlobToDisk(blob, `${process.cwd()}/storage/stjohns/csv/${fileName}`)
          if (success) {
            console.log("Successfully saved file.")
          } else {
            throw new Error(`Failed to save results for ${searchId} to file`)
          }
        }
      } catch (e) {
        console.log(`Failed to save results for ${searchId} to file: ${e}`)
      }
    }
  })

  await page.waitForSelector("div#gridpager")

  const anchor = await page.$("div#gridpager > a")
  await anchor.click()

  // if the too many results warning appears, throw error
  // get total number of pages
  // for each page, store datatable
}

export const handleResultsPage = async (page: Page, searchId: string, pageNumber: string): Promise<CaseJSON[]> => {
  // find the table with cases
  const dataTable = await page.$("table#gridSearchResults")

  const rows = []

  await dataTable.$$eval("tbody > tr", (els) => {
    els.forEach((el) => {
      const json: CaseJSON = {
        caseNumber: "",
        caseStatus: "",
        caseDetailsUrl: "",
        partyName: "",
        partyType: "",
        partyDetailsUrl: "",
      }

      // each row has 5 tds to grab
      // 0 - case details url
      // 1 - party name and details
      // 2 - party type
      // 3 - case number
      // 4 - status
      const children = Array.from(el.children)
      children.forEach((child, index) => {
        if (index === 0) {
          const detailsAnchor = child.querySelector('a[title="Case Details"]')
          json.caseDetailsUrl = detailsAnchor.getAttribute("href")
        } else if (index === 1) {
          const detailsAnchor = child.querySelector("a")
          json.partyName = detailsAnchor.textContent
          json.partyDetailsUrl = detailsAnchor.getAttribute("href")
        } else if (index === 2) {
          json.partyType = child.textContent
        } else if (index === 3) {
          const detailsAnchor = child.querySelector("a")
          json.caseNumber = detailsAnchor.textContent
        } else if (index === 4) {
          json.caseStatus = child.textContent
        }
      })

      rows.push(json)
    })
  })

  const fileName = `${searchId}-${pageNumber}.csv`
  await writeRowsToCSV(`${process.cwd()}/storage/stjohns/${fileName}`, rows)

  return rows
}
