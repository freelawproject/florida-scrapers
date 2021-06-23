/**
 * Functions to extract data from the St. Johns County Website
 * https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search
 */
import { JSDOM } from "jsdom"

/**
 * Get the page as html string and turn it into a DOM
 */
const fetchSearchPageHTML = async (): Promise<JSDOM> => {
  try {
    const res = await fetch("https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search")
    if (!res.ok) throw new Error(res.statusText)
    const html = await res.text()
    const dom = new JSDOM(html)
    return dom
  } catch (err) {
    console.error(err)
  }
}

/**
 * Finds the "Causes of Action / Case Types" button
 * And deselects everything that is not a guardianship case
 */
const findAndDeselectCaseTypes = () => {}
