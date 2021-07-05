import { initBrowser } from "../lib/browser"
import { OsceolaScraper } from "./scraper"

declare global {
  interface Window {
    username: string
    password: string
    caseNo?: string
    startDate?: string
    endDate?: string
  }
}

const scrapeOsceola = async (): Promise<void> => {
  const browser = await initBrowser()
  const scraper = new OsceolaScraper(browser)
  scraper.scrape()
}

scrapeOsceola()
