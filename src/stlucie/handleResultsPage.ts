import { Page } from "puppeteer"
import { writeJSONtoFile } from "../lib/logs"

/**
 * HandleResultsPage
 * Function that extracts the table rows from the Search Results Page
 * and stores the case details data into a json
 */

export const handleAllResults = async (page: Page, searchId: string): Promise<void> => {
  await page.setRequestInterception(true)
  console.log(`Form returned successfully. Attempting to download results for ${searchId} ...`)
  page.on("response", async (res) => {
    console.log(res)
    if (res.ok) {
      try {
        const results = await res.json()
        console.log(results)
        await writeJSONtoFile(`${process.cwd()}/storage/stlucie/searches/${searchId}.json`, results)
        console.log(`Successfully saved search results for searchId ${searchId} to file`)
      } catch (e) {
        console.log(`Error saving search results for searchId ${searchId} to file`)
      }
    }
    return res
  })
  await page.waitForNavigation()
}
