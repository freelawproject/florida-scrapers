import { Browser, Page } from "puppeteer"
import { handleSearchPage } from "./handleSearchPage"
import { eachMonthOfInterval, endOfMonth, format, isAfter } from "date-fns"
import { login } from "./login"
import { waitFor, windowSet } from "../lib/utils"
import { readJSONFromFile } from "../lib/logs"
import { initBrowser } from "../lib/browser"

const STJOHNS_URL = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"

const STLUCIE_URL = "https://courtcasesearch.stlucieclerk.com/BenchmarkWebExternal/Home.aspx/Search"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = STLUCIE_URL
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    await this.getSearchResults()
  }

  public async getSearchResults(): Promise<void> {
    const formattedDates = this._getDatesArray()
    for (let i = 0; i < formattedDates.length; i++) {
      const dates = formattedDates[i]
      const searchId = `${dates.startDate}-${dates.endDate}`.replace(/\//g, ".")

      const page = await this._browser.newPage()
      page.on("console", (msg) => console.log(`PAGE LOG: `, msg.text()))

      await windowSet(page, "startDate", dates.startDate)
      await windowSet(page, "endDate", dates.endDate)

      await login(page)

      await handleSearchPage(searchId, page)
    }
  }

  private _getDatesArray(): { startDate: string; endDate: string }[] {
    const today = new Date()
    const result = eachMonthOfInterval({
      start: new Date(2009, 12, 31),
      end: today,
    })
    return result.map((startDate) => {
      // only go to end of the current period or the form will err
      let endDate = endOfMonth(startDate)
      if (isAfter(endDate, today)) {
        endDate = today
      }
      return {
        startDate: format(startDate, "MM/dd/yyyy"),
        endDate: format(endDate, "MM/dd/yyyy"),
      }
    })
  }
}

export const setupLoggingOfNetworkData = async (page: Page): Promise<Record<string, any>> => {
  const cdpSession = await page.target().createCDPSession()
  await cdpSession.send("Network.enable")
  const cdpRequestDataRaw = {}
  const addCDPRequestDataListener = (eventName) => {
    cdpSession.on(eventName, (request) => {
      cdpRequestDataRaw[request.requestId] = cdpRequestDataRaw[request.requestId] || {}
      Object.assign(cdpRequestDataRaw[request.requestId], { [eventName]: request })
    })
  }
  addCDPRequestDataListener("Network.requestWillBeSent")
  addCDPRequestDataListener("Network.requestWillBeSentExtraInfo")
  addCDPRequestDataListener("Network.responseReceived")
  addCDPRequestDataListener("Network.responseReceivedExtraInfo")
  return cdpRequestDataRaw
}
