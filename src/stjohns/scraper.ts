import { Browser, Page } from "puppeteer"
import { handleSearchPage } from "./handleSearchPage"
import { eachMonthOfInterval, endOfMonth, format, isAfter } from "date-fns"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const today = new Date()
    const result = eachMonthOfInterval({
      start: new Date(2010, 1, 1),
      end: today,
    })
    const formattedDates = result.map((startDate) => {
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
    for (let i = 0; i < formattedDates.length; i++) {
      const dates = formattedDates[i]
      await handleSearchPage(this._browser, this._url, dates.startDate, dates.endDate)
      console.log(dates)
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
