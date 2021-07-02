import fs from "fs/promises"

export const createFolder = async (path: string): Promise<void> => {
  let exists = false
  try {
    const dir = await fs.stat(path)
    if (dir) {
      exists = true
    }
  } catch (e) {
    // silently fail
  }

  if (exists) {
    return
  }
  await fs.mkdir(path, { recursive: true })
}

export const writeHTMLToFile = async (filePath: string, content: string): Promise<void> => {
  await fs.writeFile(filePath, content)
}

export const writeBlobToDisk = async (blob: Blob, filePath: string): Promise<boolean> => {
  const ab = await blob.arrayBuffer()
  const buffer = Buffer.from(ab)
  try {
    await fs.writeFile(filePath, buffer)
    return true
  } catch (e) {
    console.log(`Error saving file at path ${filePath}`)
    return false
  }
}
