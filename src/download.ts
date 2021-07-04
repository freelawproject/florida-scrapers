import { initBrowser } from "./lib/browser"
import { StJohnsScraper } from "./stjohns/scraper"
declare global {
  interface Window {
    username: string
    password: string
    caseNo?: string
    startDate?: string
    endDate?: string
  }
}

const scrapeStJohns = async (): Promise<void> => {
  const browser = await initBrowser()
  const scraper = new StJohnsScraper(browser)
  scraper.downloadDocuments()
}

scrapeStJohns()