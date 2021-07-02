import { Browser, Page } from "puppeteer"
import { createFolder } from "../lib/file"
import { waitFor, windowSet } from "../lib/utils"
import { handleAllResults } from "./handleResultsPage"
import { loginToStJohns } from "./login"

export const handleSearchPage = async (
  browser: Browser,
  url: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const page = await browser.newPage()

  page.on("console", (msg) => console.log(`PAGE LOG: `, msg.text()))
  // inject env variables into the page
  await windowSet(page, "username", process.env.LOGIN_USERNAME)
  await windowSet(page, "password", process.env.LOGIN_PASSWORD)

  await windowSet(page, "startDate", startDate)
  await windowSet(page, "endDate", endDate)

  console.log(`Navigating to ${url}`)
  await page.goto(url)

  try {
    // login if not already
    await loginToStJohns(page)

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
    await page.$eval("form.searchform", (form) => (form as HTMLFormElement).submit())

    await page.waitForNavigation()

    const searchId = `${startDate}-${endDate}`.replace(/\//g, ".")

    // make the storage folder just in case
    await createFolder(`${process.cwd()}/storage/stjohns/searches`)

    await handleAllResults(page, searchId)
  } catch (e) {
    console.log(e)
  } finally {
    await waitFor(1500)
    await page.close()
  }
}
