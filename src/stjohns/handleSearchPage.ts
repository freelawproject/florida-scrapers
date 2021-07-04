import { Page } from "puppeteer"
import { createFolder } from "../lib/file"
import { waitFor } from "../lib/utils"
import { handleAllResults } from "./handleResultsPage"

export const handleSearchPage = async (searchId: string, page: Page): Promise<void> => {
  console.log(`Getting search results for the period: ${searchId}`)

  // inject env variables into the page

  // make the storage folder just in case
  await createFolder(`${process.cwd()}/storage/stlucie/searches`)

  try {
    // wait for the searchrorm to resolve before starting
    await page.waitForSelector("form.searchform")
    const form = await page.$("form.searchform")
    await waitFor(1000)

    await form.$$eval("input", (els) => {
      const newEls = els.map((el) => {
        const name = el.getAttribute("name")
        if (name === "courtTypes") {
          // probate is option 4 and guardianship is option 6
          el.setAttribute("value", "4,6")
        } else if (name === "openedFrom") {
          el.setAttribute("value", window.startDate)
        } else if (name === "openedTo") {
          el.setAttribute("value", window.endDate)
        }
        return el
      })
      return newEls
    })

    await waitFor(2500)

    await form.evaluate((f) => (f as HTMLFormElement).submit())

    await handleAllResults(page, searchId)
  } catch (e) {
    console.log(e)
  } finally {
    await waitFor(1500)
    await page.close()
  }
}
