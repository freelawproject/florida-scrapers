import { promises as fs } from "fs"
import csv from "async-csv"

const readCSV = async (path: string): Promise<(string | number)[][]> => {
  try {
    const csvString = await fs.readFile(path, "utf-8")

    const rows = await csv.parse(csvString)
    return rows.map((row) => (row as string).split(","))
  } catch (e) {
    console.log(`Error reading csv: ${e}`)
  }
}

const writeCSV = async (path: string, rows: (string | number)[][]): Promise<void> => {
  try {
    const stringData = await csv.stringify(rows)

    await fs.writeFile(path, stringData)
  } catch (e) {
    console.log(`Error writing csv: ${e}`)
  }
}
// make a backup of current csv
// load current csv
// iterate through rows
// if case number not present, add it to the csv
// else do nothing
// close csv
export const writeRowsToCSV = async (path: string, rows: Record<string, any>[]): Promise<void> => {
  await fs.copyFile(path, `${path}_${new Date().toISOString()}.backup`)

  const data = await readCSV(path)
  const existingCaseNumbers = data.map((row) => row[0])

  rows.forEach((json) => {
    if (existingCaseNumbers.includes(json.caseNumber)) return

    // build array
    const newData = [
      json.caseNumber,
      json.caseStatus,
      json.caseDetailsUrl,
      json.partyName,
      json.partyType,
      json.partyDetailsUrl,
    ]
    data.push(newData)
  })

  await writeCSV(path, data)
}
