import { initBrowser } from "./lib/initBrowser"
import { StJohnsScraper } from "./stjohns/scraper"

declare global {
  interface Window {
    username: string
    password: string
  }
}

const scrapeStJohns = async (): Promise<void> => {
  const browser = await initBrowser()
  const scraper = new StJohnsScraper(browser)
  scraper.scrape()
}

scrapeStJohns()
