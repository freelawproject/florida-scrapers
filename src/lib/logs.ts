/**
 * Utilities to log scraper progress
 */
import fs from "fs"

export const logToFile = async (fileNameWithoutExt: string, infoToLog: Record<string, JSON>): Promise<void> => {
  const filePath = `./logs/${fileNameWithoutExt}.json`
  // load file
  const existingJSON = await asyncReadJSONFile(filePath)

  const newJSON = { ...existingJSON, ...infoToLog }

  await writeJSONtoFile(filePath, newJSON)
}

const asyncReadJSONFile = async (path: string): Promise<JSON> => {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(path, (err, data) => {
        if (!data) {
          reject(err)
        } else {
          resolve(JSON.parse(data.toString()))
        }
      })
    } catch (e) {
      reject(`Could not read file: ${e} `)
    }
  })
}

export const writeJSONtoFile = async (path: string, json: Record<string, any>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile(path, JSON.stringify(json), (err) => {
        if (err) {
          throw err
        } else {
          resolve()
        }
      })
    } catch (e) {
      reject(`Could not write file: ${e}`)
    }
  })
}
