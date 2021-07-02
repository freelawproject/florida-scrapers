import { Browser, Page } from "puppeteer"
import { handleCasePage } from "./handleCasePage"
import { handleSearchPage } from "./handleSearchPage"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    // await handleCasePage(this._browser, mockCaseInfo, this._url)
    await handleSearchPage(this._browser, this._url)
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
