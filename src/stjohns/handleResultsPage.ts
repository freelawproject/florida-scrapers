import { Page } from "puppeteer"

const SEARCH_PAGE_URL = "https://apps.stjohnsclerk.com/Benchmark//CourtCase.aspx/CaseSearch"

interface CaseJSON {
  partyName: string
  partyDetailsUrl: string
  partyType: string
  caseDetailsUrl: string
  caseNumber: string
  caseStatus: string
}

export const handleResultsPage = async (page: Page): Promise<CaseJSON[]> => {
  // find the table with cases
  const dataTable = await page.$("table#gridSearchResults")

  const rows = []

  await dataTable.$$eval("tbody > tr", (els) => {
    els.forEach((el) => {
      const json: CaseJSON = {
        partyName: "",
        partyDetailsUrl: "",
        partyType: "",
        caseDetailsUrl: "",
        caseNumber: "",
        caseStatus: "",
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

  return rows
}
