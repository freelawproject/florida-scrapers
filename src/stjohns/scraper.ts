import { Browser, Page } from "puppeteer"
import { loginToStJohns } from "./login"
import { waitFor, windowSet } from "../lib/utils"
import { handleSearchPage } from "./handleSearchPage"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const page = await this._browser.newPage()
    await handleSearchPage(page, this._url)
  }
}
