/**
 * General utilities
 */

import { Page } from "puppeteer"

// promise that delays execution by X ms
export const waitFor = (delay: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

// set window properties - used to stash env vars
export const windowSet = async (page: Page, name: string, value: string): Promise<void> => {
  page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })
  `)
}
