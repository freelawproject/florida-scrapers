import { Page } from "puppeteer"
import { createFolder } from "../lib/file"
import { writeJSONtoFile } from "../lib/logs"
import { waitFor } from "../lib/utils"

export const handleSearchPage = async (searchId: string, page: Page): Promise<void> => {
  console.log(`Getting search results for the period: ${searchId}`)

  // inject env variables into the page

  // make the storage folder just in case
  await createFolder(`${process.cwd()}/storage/osceola/searches`)

  try {
    // set the timeout
    page.setDefaultNavigationTimeout(120000)

    // wait for the searchrorm to resolve before starting
    await page.waitForSelector("form.searchform")
    const form = await page.$("form.searchform")
    await waitFor(1000)

    await form.$$eval("input", (els) => {
      const newEls = els.map((el) => {
        const name = el.getAttribute("name")
        if (name === "courtTypes") {
          // probate is 13 and guardianship is option 20
          el.setAttribute("value", "13,20")
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

    await page.waitForNavigation()

    page.on("response", async (res) => {
      if (!res.url().match(/CaseSearch$/)) {
        return res
      }
      try {
        const results = await res.json()
        await writeJSONtoFile(`${process.cwd()}/storage/osceola/searches/${searchId}.json`, results)
        console.log(`Successfully saved search results for searchId ${searchId} to file`)
      } catch (e) {
        console.log(`Error saving search results for searchId ${searchId} to file`)
      }
    })

    const formButtons = await page.$$("form > button")
    const exportBtn = formButtons.find(async (btn) => {
      const text = await btn.evaluate((el) => el.textContent)
      return text === "Export Search Results"
    })

    await exportBtn.click()
  } catch (e) {
    console.log(e)
  } finally {
    await waitFor(1500)
    await page.close()
  }
}
