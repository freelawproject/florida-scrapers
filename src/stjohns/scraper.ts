import { Browser, ElementHandle, Page } from "puppeteer"

export class StJohnsScraper {
  _url: string
  _browser: Browser

  public constructor(browser: Browser) {
    this._url = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"
    this._browser = browser
  }

  public async scrape(): Promise<void> {
    const page = await this._browser.newPage()
    console.log(`Navigating to ${this._url}`)
    await page.goto(this._url)

    try {
      await page.waitForSelector("form.searchform")

      // show dropdown
      // const dropdownToggler = await findDropdownToggle(page)
      // dropdownToggler.click()

      // select probate and guardianship
      // await selectRelevantCourts(page)

      // hide dropdown
      // dropdownToggler.click()

      // click captcha
      // await clickCaptcha(page)

      // click submit
      // await clickSubmit(page)

      const form = await page.$("form.searchform")

      // set the input value to be 4,6
      await form.$$eval("input", (els) => {
        const newEls = els.map((el) => {
          // @ts-expect-error no element properties?
          if (el.name === "courtTypes") {
            //@ts-expect-error no element properties?
            el.value = "4,6"
            //@ts-expect-error no element properties?
          } else if (el.name === "openedFrom") {
            //@ts-expect-error no element properties?
          } else if (el.name === "openedTo") {
          }
          return el
        })
        return newEls
      })
      await clickSubmit(page)
    } catch (e) {
      console.log(e)
    }
  }
}

const waitFor = (delay: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

const findDropdownToggle = async (page: Page): Promise<ElementHandle<Element>> => {
  const el = await page.$("button#courTypesButton")
  return el
}

const selectRelevantCourts = async (page: Page): Promise<void> => {
  await waitFor(500)
  // find the select dropdown
  const dropdown = await page.$("div#courTypesMultiSelect")

  // find the ul options
  const options = await dropdown.$("ul.dropdown-menu")

  // find the selectAll option and click it to reset selections
  const selectAllOption = await options.$('a > label.checkbox > input[value="multiselect-all"]')
  await selectAllOption.click()

  await waitFor(500)
  // select probate --> option "4"
  const probateOption = await options.$('a > label.checkbox > input[value="4"]')
  probateOption.click()

  await waitFor(500)
  // select guardianship --> option "6"
  const guardianshipOption = await options.$('a > label.checkbox > input[value="6"]')
  console.log("got guardianship option")
  guardianshipOption.click()
}

const clickCaptcha = async (page: Page): Promise<void> => {
  const captchaSpan = await page.$("span.recaptcha-checkbox")
  await new Promise((resolve) => {
    setTimeout(resolve, 2600)
  })
  await captchaSpan.click()
}

const clickSubmit = async (page: Page): Promise<void> => {
  const submitButton = await page.$("button#searchButton")
  await new Promise((resolve) => {
    setTimeout(resolve, 1600)
  })
  await submitButton.click()
}
