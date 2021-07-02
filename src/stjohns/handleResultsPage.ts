import { Page } from "puppeteer"
import { writeRowsToCSV } from "../lib/csv"
import { promises as fs } from "fs"
import { writeJSONtoFile } from "../lib/logs"

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
  page.on("response", async (res) => {
    if (res.ok) {
      try {
        const results = await res.json()
        await writeJSONtoFile(`${process.cwd()}/storage/stjohns/searches/${searchId}.csv`, results)
        console.log(`Successfully saved search results for searchId ${searchId} to file`)
      } catch (e) {
        console.log(`Error saving search results for searchId ${searchId} to file`)
      }
    }
    return res
  })
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
