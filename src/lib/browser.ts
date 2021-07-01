import { Browser } from "puppeteer"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

let browser: Browser

export const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    try {
      // enable the stealth plugin
      puppeteer.use(StealthPlugin())
      browser = await puppeteer.launch({
        //@ts-expect-error incorrect types when using puppeteer-extra
        headless: false,
        args: ["--disable-setuid-sandbox", "--window-size=1600,1200"],
        ignoreHTTPSErrors: true,
      })
    } catch (err) {
      console.log("Could not create browser instance => : ", err)
    }
  }

  return browser
}

export const getBrowser = (): Browser | null => browser
