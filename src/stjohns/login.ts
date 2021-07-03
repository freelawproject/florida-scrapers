import { Page } from "puppeteer"

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
