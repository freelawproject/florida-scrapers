import { initBrowser } from "./lib/initBrowser"
import { StJohnsScraper } from "./stjohns/scraper"

const scrapeStJohns = async (): Promise<void> => {
  const browser = await initBrowser()
  const scraper = new StJohnsScraper(browser)
  scraper.scrape()
}

scrapeStJohns()
