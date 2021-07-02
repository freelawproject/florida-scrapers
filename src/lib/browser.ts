import { Browser } from "puppeteer"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import DevToolsPlugin from "puppeteer-extra-plugin-devtools"

let browser: Browser

export const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    try {
      // enable the stealth plugin
      puppeteer.use(StealthPlugin())
      // enable the dev tools plugin
      const devtools = DevToolsPlugin()
      puppeteer.use(devtools)
      // enable the downloader
      // puppeteer.use(
      //   UserPreferencesPlugin({
      //     userPrefs: {
      //       download: {
      //         prompt_for_download: false,
      //         directory_upgrade: true,
      //         default_directory: path.join(`${process.cwd()}`, "storage"),
      //         extensions_to_open: 'application/pdf',
      //       },
      //       plugins: {
      //         always_open_pdf_externally: true,
      //         plugins_disabled: ["Chrome PDF Viewer"]
      //       }
      //     },
      //   })
      // )

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

      const tunnel = await devtools.createTunnel(browser)
      console.log(`Browser devtools can be found at: ${tunnel.url}`)
    } catch (err) {
      console.log("Could not create browser instance => : ", err)
    }
  }

  return browser
}

export const getBrowser = (): Browser | null => browser
