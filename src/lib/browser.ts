import { Browser } from "puppeteer"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

let browser: Browser

export const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    try {
      puppeteer.use(StealthPlugin())

      browser = await puppeteer.launch({
        // @ts-expect-error wtf
        headless: false,
        args: [
          "--disable-setuid-sandbox",
          "--window-size=1600,1200",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
        ignoreHTTPSErrors: true,
      })

      console.log(`Browser instance created`)
    } catch (err) {
      console.log("Could not create browser instance => : ", err)
    }
  }

  return browser
}

export const getBrowser = (): Browser | null => browser
