/**
 * Utilities to log scraper progress
 */
import fs from "fs"

export const logToFile = async (fileNameWithoutExt: string, infoToLog: Record<string, JSON>): Promise<void> => {
  const filePath = `./logs/${fileNameWithoutExt}.json`
  // load file
  const existingJSON = await readJSONFromFile(filePath)

  const newJSON = { ...existingJSON, ...infoToLog }

  await writeJSONtoFile(filePath, newJSON)
}

export const readJSONFromFile = async (path: string): Promise<Record<string, any>> => {
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
export interface CaseJSON {
  caseId: string
  caseNo: string
  party: string
  partyType: string
  status: string
}

export const extractDataFromJSONRow = (row: string[]): CaseJSON => {
  // 0 - anchor element
  // 1 - anchor with party details and caseId
  // 2 - type of party
  // 3 - searchId
  // 4 - caseNo
  // 5 - caseStatus

  const json: CaseJSON = {
    caseId: "",
    caseNo: "",
    party: "",
    partyType: "",
    status: "",
  }

  row.forEach((item, index) => {
    if (index === 1) {
      json.caseId = item.match(/caseID\=\d{6}/)[0].replace(/caseID=/, "")
      json.party = item.match(/\>.*</)[0].replace(/\>|\</g, "").trim()
    } else if (index === 2) {
      json.partyType = item
    } else if (index === 3) {
      json.caseNo = item.match(/\>.*</)[0].replace(/\>|\</g, "").trim()
    } else if (index === 4) {
      json.status = item
    }
  })
  return json
}
