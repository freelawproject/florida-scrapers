import { initBrowser } from "./lib/browser"
import { StJohnsScraper } from "./stjohns/scraper"

const scrapeStJohns = async (): Promise<void> => {
  const browser = await initBrowser()
  const scraper = new StJohnsScraper(browser)
  scraper.downloadDocuments()
}

scrapeStJohns()
