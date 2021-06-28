import fs from 'fs/promises'

export const createFolder = async (path: string): Promise<void> => {
  const exists = await fs.stat(path)
  if (exists) {
    throw new Error('Folder exists')
  }
  await fs.mkdir(path)
}

export const writeHTMLToFile = async (filePath: string, content: string): Promise<void> => {
  await fs.writeFile(filePath, content)
}