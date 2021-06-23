import { Browser, Page } from "puppeteer"
import { loginToStJohns } from "./login"
import { waitFor, windowSet } from "../lib/utils"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const page = await this._browser.newPage()

    // inject env variables into the page
    await windowSet(page, "username", process.env.LOGIN_USERNAME)
    await windowSet(page, "password", process.env.LOGIN_PASSWORD)

    console.log(`Navigating to ${this._url}`)
    await page.goto(this._url)

    try {
      // login if not already
      await loginToStJohns(page)

      // wait for the searchrorm to resolve before starting
      await page.waitForSelector("form.searchform")

      // narrow the search to the form
      const form = await page.$("form.searchform")
      // set the search form values
      await form.$$eval("input", (els) => {
        const newEls = els.map((el) => {
          const name = el.getAttribute("name")
          if (name === "courtTypes") {
            // Probate is option "4"
            // Guardianship is option "6"
            el.setAttribute("value", "4,6")
          } else if (name === "openedFrom") {
            // TODO: add date
            el.setAttribute("value", "")
          } else if (name === "openedTo") {
            // TODO: add date
            el.setAttribute("value", "")
          }
          return el
        })
        return newEls
      })
      await clickSubmit(page)
    } catch (e) {
      console.log(e)
    }
  }
}

const clickSubmit = async (page: Page): Promise<void> => {
  const submitButton = await page.$("button#searchButton")

  await waitFor(500)

  await submitButton.click()
}
