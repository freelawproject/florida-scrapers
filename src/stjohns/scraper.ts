import { Browser, Page } from "puppeteer"
import { handleCasePage } from "./handleCasePage"

const mockCaseInfo = {
  partyName: "JANESK, KENNETH J",
  partyType: "JUDGE",
  partyDetailsUrl: "",
  caseDetailsUrl: "https://apps.stjohnsclerk.com/Benchmark/CourtCase.aspx/Details/1043137?digest=c6ICTChFmZ%2BTQ4VOQAvu4Q",
  caseNumber: "GA21-0101",
  caseStatus: "OPEN"
}

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    await handleCasePage(this._browser, mockCaseInfo, this._url)
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
