import { Browser } from "puppeteer"
import puppeteer from "puppeteer-extra"
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

let browser: Browser

export const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    try {
      // enable the stealth plugin
      puppeteer.use(StealthPlugin())
      // enable the captcha plugin
      puppeteer.use(
        RecaptchaPlugin({
          provider: {
            id: "2captcha",
            token: "XXXXXXXX", // REPLACE WITH OWN 2CAPTCHA API KEY
          },
          visualFeedback: true,
        })
      )

      browser = await puppeteer.launch({
        //@ts-expect-error incorrect types when using puppeteer-extra
        headless: false,
        args: ["--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
      })
    } catch (err) {
      console.log("Could not create browser instance => : ", err)
    }
  }

  return browser
}
