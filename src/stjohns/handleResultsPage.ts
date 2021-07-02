import { Page } from "puppeteer"
import { writeJSONtoFile } from "../lib/logs"

/**
 * HandleResultsPage
 * Function that extracts the table rows from the Search Results Page
 * and stores the case details data into a json
 */

export const handleAllResults = async (page: Page, searchId: string): Promise<void> => {
  console.log(`Downloading csv from results page for searchId: ${searchId}`)
  await page.setRequestInterception(true)
  page.on("response", async (res) => {
    if (res.ok) {
      try {
        const results = await res.json()
        await writeJSONtoFile(`${process.cwd()}/storage/stjohns/searches/${searchId}.json`, results)
        console.log(`Successfully saved search results for searchId ${searchId} to file`)
      } catch (e) {
        console.log(`Error saving search results for searchId ${searchId} to file`)
      }
    }
    return res
  })
}
