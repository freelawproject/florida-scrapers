import puppeteer, { Browser } from "puppeteer"

let browser: Browser

export const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
      })
    } catch (err) {
      console.log("Could not create browser instance => : ", err)
    }
  }

  return browser
}
