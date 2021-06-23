import { Browser } from "puppeteer"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const page = await this._browser.newPage()
    console.log(`Navigating to ${this._url}`)
    await page.goto(this._url)

    await page.waitForSelector("body")

    const content = await page.content()
    console.log(content)
  }
}
