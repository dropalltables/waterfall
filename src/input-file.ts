import { resolve } from "node:path"
import type { InputFile } from "./types"

export async function readInputFile(inputPath: string): Promise<InputFile> {
  const absolutePath = resolve(inputPath)
  const file = Bun.file(absolutePath)
  if (!(await file.exists())) {
    throw new Error(`File not found: ${inputPath}`)
  }

  const bytes = await file.bytes()
  if (bytes.length === 0) {
    throw new Error("File is empty.")
  }

  return { bytes, absolutePath }
}
