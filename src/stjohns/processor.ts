import { extractDataFromJSONRow, readJSONFromFile } from "../lib/logs"

   export const dedupeJSONResult = async (inputFileName: string): Promise<void> {
    const filePath = `${process.cwd()}/storage/stjohns/searches/${inputFileName}`
    const jsonData = await readJSONFromFile(filePath)
    try {
      if (jsonData) {
        const { recordsTotal, data } = jsonData
        console.log(`Processing ${recordsTotal} from file ${inputFileName}`)
        const extractedData = extractDataFromJSONRow(data[0])
        console.log(extractedData)
      } else {
        throw new Error(`Unable to load JSON Data for File: ${inputFileName}`)
      }
    } catch (e) {
      console.log(e)
    }
  }
