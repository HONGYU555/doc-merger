import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const ROOT_DIR = path.resolve(__dirname, '..', '..')
export const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads')
export const OUTPUTS_DIR = path.join(ROOT_DIR, 'outputs')

// 確保目錄存在
for (const dir of [UPLOADS_DIR, OUTPUTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`[init] created dir: ${dir}`)
  }
}
