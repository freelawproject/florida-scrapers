import { Browser, Page } from "puppeteer"
import { waitFor, windowSet } from "../lib/utils"
import { handleAllresults } from "./handleResultsPage"
import { loginToStJohns } from "./login"

export const handleSearchPage = async (browser: Browser, url: string): Promise<void> => {
  const page = await browser.newPage()

  page.on("console", (msg) => console.log(`PAGE LOG: `, msg.text()))
  // inject env variables into the page
  await windowSet(page, "username", process.env.LOGIN_USERNAME)
  await windowSet(page, "password", process.env.LOGIN_PASSWORD)

  console.log(`Navigating to ${url}`)
  await page.goto(url)

  try {
    // login if not already
    await loginToStJohns(page)

    // wait for the searchrorm to resolve before starting
    await page.waitForSelector("form.searchform")
    const form = await page.$("form.searchform")

    const startDate = "06/01/2021"
    const endDate = "06/30/2021"

    await windowSet(page, "startDate", startDate)
    await windowSet(page, "endDate", endDate)

    await waitFor(1000)

    await form.$$eval("input", (els) => {
      const newEls = els.map((el) => {
        const name = el.getAttribute("name")
        if (name === "courtTypes") {
          // probate is option 4 and guardianship is option 6
          el.setAttribute("value", "4,6")
        } else if (name === "openedFrom") {
          el.setAttribute("value", "06/01/2021")
        } else if (name === "openedTo") {
          el.setAttribute("value", "06/30/2021")
        }
        return el
      })
      return newEls
    })

    await waitFor(2500)
    await page.$eval("form.searchform", (form) => (form as HTMLFormElement).submit())

    await page.waitForNavigation()

    await handleAllresults(page, `${startDate}-${endDate}`)
  } catch (e) {
    console.log(e)
  }
}

const clickSubmit = async (page: Page): Promise<void> => {
  const submitButton = await page.$("button#searchButton")

  await waitFor(500)

  await submitButton.click()
}
