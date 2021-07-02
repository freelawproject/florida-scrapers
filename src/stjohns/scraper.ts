import { Browser, Page } from "puppeteer"
import { handleSearchPage } from "./handleSearchPage"
import { eachMonthOfInterval, endOfMonth, format } from "date-fns"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const result = eachMonthOfInterval({
      start: new Date(2010, 1, 1),
      end: new Date(),
    })
    const formattedDates = result.map((startDate) => {
      const endDate = endOfMonth(startDate)
      return {
        startDate: format(startDate, "MM/dd/yyyy"),
        endDate: format(endDate, "MM/dd/yyyy"),
      }
    })
    for (let i = 0; i < formattedDates.length; i++) {
      const dates = formattedDates[i]
      await handleSearchPage(this._browser, this._url, dates.startDate, dates.endDate)
    }
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
