import { promises as fs } from "fs"
import { readCSV } from "../lib/csv"
import { CaseJSON, extractDataFromJSONRow, readJSONFromFile, writeJSONtoFile } from "../lib/logs"

const returnUniques = (data: CaseJSON[]): CaseJSON[] => {
  const uniques: CaseJSON[] = []
  const uniqueIds: string[] = []
  data.forEach((json) => {
    const exists = uniqueIds.includes(json.caseNo)
    if (!exists) {
      uniqueIds.push(json.caseNo)
      uniques.push(json)
    }
  })
  return uniques
}
const dedupeJSONResult = async (fileName: string): Promise<CaseJSON[]> => {
  const filePath = `${process.cwd()}/storage/stlucie/searches/${fileName}`

  const csvData = await readCSV(filePath)

  if (csvData) {
    console.log(`Processing ${csvData.length} from file ${fileName}`)

    const mapped = csvData.map((row: string[]) => ({
      caseId: "",
      caseNo: row[2],
      party: row[0],
      partyType: row[1],
      status: row[3],
    }))

    const newData = returnUniques(mapped)

    console.log(`Removed ${csvData.length - newData.length} duplicates`)

    return newData
  } else {
    throw new Error(`Unable to load JSON Data for File: ${fileName}`)
  }
}

const processAllResults = async () => {
  const files = await fs.readdir(`${process.cwd()}/storage/stlucie/searches`)
  const reduced = files.map(async (file) => {
    const results = await dedupeJSONResult(file)
    return results
  })

  const allResults = await Promise.all(reduced)

  const allFlatResults = allResults.flat()
  const uniqueJson = returnUniques(allFlatResults)

  console.log(`Removed Another ${allFlatResults.length - uniqueJson.length} duplicates`)
  console.log(`Total cases: ${uniqueJson.length}`)
  await writeJSONtoFile(`${process.cwd()}/storage/stlucie/combined-search-results.json`, {
    count: uniqueJson.length,
    data: uniqueJson,
  })
}

processAllResults()
