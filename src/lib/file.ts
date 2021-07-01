import fs from 'fs/promises'

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