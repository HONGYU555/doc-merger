import fs from 'node:fs/promises'
import { UPLOADS_DIR, OUTPUTS_DIR } from './paths.js'

const MAX_AGE_MS = 60 * 60 * 1000 // 1 小時

export async function cleanupUploads() {
  await Promise.all([cleanDir(UPLOADS_DIR), cleanDir(OUTPUTS_DIR)])
}

async function cleanDir(dir: string) {
  try {
    const files = await fs.readdir(dir)
    const now = Date.now()
    await Promise.all(
      files.map(async (f) => {
        const p = `${dir}/${f}`
        try {
          const stat = await fs.stat(p)
          if (now - stat.mtimeMs > MAX_AGE_MS) {
            await fs.unlink(p)
            console.log(`[cleanup] removed ${p}`)
          }
        } catch (e) {
          // 忽略單一檔案錯誤
        }
      })
    )
  } catch (e) {
    // 目錄可能不存在，忽略
  }
}
