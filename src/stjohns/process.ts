import { promises as fs } from "fs"
import { createFolder } from "../lib/file"
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
  const filePath = `${process.cwd()}/storage/stjohns/searches/${fileName}`
  const jsonData = await readJSONFromFile(filePath)
  if (jsonData) {
    const { recordsTotal, data } = jsonData
    console.log(`Processing ${recordsTotal} from file ${fileName}`)
    const mapped = data.map((row: string[]) => extractDataFromJSONRow(row))

    const newData = returnUniques(mapped)

    console.log(`Removed ${data.length - newData.length} duplicates`)

    return newData
  } else {
    throw new Error(`Unable to load JSON Data for File: ${fileName}`)
  }
}

const processAllResults = async () => {
  const files = await fs.readdir(`${process.cwd()}/storage/stjohns/searches`)
  const reduced = files.map(async (file) => {
    const results = await dedupeJSONResult(file)
    return results
  })

  const allResults = await Promise.all(reduced)

  const allFlatResults = allResults.flat()
  const uniqueJson = returnUniques(allFlatResults)

  console.log(`Removed Another ${allFlatResults.length - uniqueJson.length} duplicates`)
  console.log(`Total cases: ${uniqueJson.length}`)
  await writeJSONtoFile(`${process.cwd()}/storage/stjohns/combined-search-results.json`, {
    count: uniqueJson.length,
    data: uniqueJson,
  })
}

processAllResults()
