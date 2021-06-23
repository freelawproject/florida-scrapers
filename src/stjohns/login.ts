import { Page } from "puppeteer"
import { waitFor } from "../lib/utils"

export const loginToStJohns = async (page: Page): Promise<void> => {
  const isLoggedIn = await checkAuthStatus(page)
  // check to see if logged in
  if (isLoggedIn) return
  // if not, login

  console.log("Not logged in. Logging in with user: ", process.env.LOGIN_USERNAME)
  await login(page)
}

const login = async (page: Page): Promise<void> => {
  await waitFor(500)
  // find the login form
  const loginForm = await page.$("div#logonForm")
  // fill out the fields
  await loginForm.$$eval("input", (els) => {
    // map through the returned elements
    const newEls = els.map((el) => {
      // get input id
      const id = el.getAttribute("id")

      // set the username and password
      if (id === "txtUsername") {
        el.setAttribute("value", window.username)
      } else if (id === "txtPassword") {
        el.setAttribute("value", window.password)
      }
    })
    return newEls
  })
  // click the rememberMe checkbox
  const rememberMeCheckbox = await loginForm.$("input#cbxRememberMe")
  await rememberMeCheckbox.click()
  // click submit
  const submitButton = await loginForm.$("a#btnLogin")
  await submitButton.click()

  // delay until the logout button shows
  await page.waitForSelector("a#btnLogout")
}

const checkAuthStatus = async (page: Page): Promise<boolean> => {
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
