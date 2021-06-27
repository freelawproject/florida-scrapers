/**
 * Script for nodemon to close the browser instance on restart
 */
import { getBrowser } from './browser'

const browser = getBrowser()

if (browser) {
  browser.close()
}
