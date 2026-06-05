import { Router, Request, Response } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { OUTPUTS_DIR } from '../utils/paths.js'
import { errorHandler, HttpError } from '../middleware/errorHandler.js'

export const downloadRouter = Router()

downloadRouter.get('/download/:id', (req: Request, res: Response, next) => {
  try {
    const id = req.params.id
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, '無效的 id')
    // 找 .docx 或 .txt
    const docxPath = path.join(OUTPUTS_DIR, `${id}.docx`)
    const txtPath = path.join(OUTPUTS_DIR, `${id}.txt`)
    let filePath: string
    let filename: string
    if (fs.existsSync(docxPath)) {
      filePath = docxPath
      filename = 'merged.docx'
    } else if (fs.existsSync(txtPath)) {
      filePath = txtPath
      filename = 'merged.txt'
    } else {
      throw new HttpError(404, '找不到檔案（可能已過期被清理）')
    }
    res.download(filePath, filename, (err) => {
      if (err) console.error('[download error]', err)
      // 下載完成後刪除
      fs.unlink(filePath, () => {})
    })
  } catch (err) {
    next(err)
  }
})

downloadRouter.use(errorHandler)
