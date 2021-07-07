import { Page } from "puppeteer"
import { createFolder } from "../lib/file"
import { waitFor } from "../lib/utils"
import { promises as fs } from "fs"

export const handleSearchPage = async (searchId: string, page: Page): Promise<void> => {
  console.log(`Getting search results for the period: ${searchId}`)

  // inject env variables into the page

  // make the storage folder just in case
  await createFolder(`${process.cwd()}/storage/stlucie/searches`)

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
          // probate/guardianship is 8 and guardianship is option 28
          el.setAttribute("value", "8,28")
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

    await page.waitForNavigation({ waitUntil: "domcontentloaded" })

    // @ts-expect-error class method
    await page._client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: `${process.cwd()}/storage/stlucie/searches`,
    })

    const exportBtn = await page.$("#gridpager > table > tbody > tr > td:nth-child(1) > a")
    await exportBtn.click()
    console.log("Waiting for fifteen seconds for csv to download...")
    await waitFor(15000)

    const incomingFileName = "SearchResults.csv"

    const exists = await fs.stat(`${process.cwd()}/storage/stlucie/searches/${incomingFileName}`)
    if (exists) {
      console.log(`File downloaded successfully. Saving it as ${searchId}.csv`)
      await fs.rename(
        `${process.cwd()}/storage/stlucie/searches/${incomingFileName}`,
        `${process.cwd()}/storage/stlucie/searches/${searchId}.csv`
      )
    } else {
      throw new Error(`Failed to save results for ${searchId} to file`)
    }
  } catch (e) {
    console.log(e)
  } finally {
    await page.close()
  }
}
