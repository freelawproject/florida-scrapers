import { Page } from "puppeteer"
import { waitFor, windowSet } from "../lib/utils"

const STJOHNS_LOGIN_URL = "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search"

const STLUCIE_LOGIN_URL = "https://courtcasesearch.stlucieclerk.com/BenchmarkWebExternal/Home.aspx/Search"

export const checkAuthStatus = async (page: Page): Promise<boolean> => {
  let authStatus = false
  // check to see if the Logout button is present
  try {
    const logoutButton = await page.$("a#btnLogout")
    authStatus = !!logoutButton
  } catch (e) {
    console.log("No logout button found")
    authStatus = false
  }

  return authStatus
}

export const login = async (page: Page): Promise<void> => {
  await windowSet(page, "username", process.env.LOGIN_USERNAME)
  await windowSet(page, "password", process.env.LOGIN_PASSWORD)

  await waitFor(500)

  await page.goto(STLUCIE_LOGIN_URL, { waitUntil: "domcontentloaded" })

  console.log("-----------------------------------------------")
  console.log("Checking Auth Status...")
  const isLoggedIn = await checkAuthStatus(page)

  if (isLoggedIn) return

  console.log("Not logged in. Logging in with user: ", process.env.LOGIN_USERNAME)

  await waitFor(500)
  await page.$("div#logonForm")

  await page.$eval("input#txtUsername", (el) => el.setAttribute("value", window.username))
  await waitFor(250)

  await page.$eval("input#txtPassword", (el) => el.setAttribute("value", window.password))
  await waitFor(250)

  await page.$eval("input#cbxRememberMe", (el) => el.setAttribute("checked", "1"))
  await waitFor(250)

  const loginButton = await page.$("a#btnLogin")
  if (loginButton) {
    await loginButton.click()
    await page.waitForSelector("a#btnLogout")
    console.log("Log in successful.")
  } else {
    console.error("Login button not found!")
  }
}
