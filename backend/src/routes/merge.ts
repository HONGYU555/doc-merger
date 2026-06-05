import { Router, Request, Response } from 'express'
import path from 'node:path'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { upload } from '../middleware/upload.js'
import { errorHandler, HttpError } from '../middleware/errorHandler.js'
import { mergeFilesToBuffer, type MergeInput, type MergeOptions } from '../services/merger.js'
import { OUTPUTS_DIR } from '../utils/paths.js'

export const mergeRouter = Router()

mergeRouter.post(
  '/merge',
  upload.array('files', 50),
  async (req: Request, res: Response, next) => {
    try {
      const files = (req.files as Express.Multer.File[]) || []
      if (files.length === 0) throw new HttpError(400, '未上傳任何檔案')
      if (files.length > 50) throw new HttpError(400, '檔案數量超過 50')

      const separator = (req.body?.separator || 'newline') as MergeOptions['separator']
      const customSeparator = (req.body?.customSeparator || '') as string
      const outputFormat = (req.body?.outputFormat || 'docx') as MergeOptions['outputFormat']

      if (!['newline', 'page', 'custom'].includes(separator)) {
        throw new HttpError(400, '無效的分隔符設定')
      }
      if (!['docx', 'txt'].includes(outputFormat)) {
        throw new HttpError(400, '無效的輸出格式')
      }
      if (separator === 'custom' && !customSeparator) {
        throw new HttpError(400, '自訂分隔符不可為空')
      }

      const inputs: MergeInput[] = files.map((f) => ({
        filePath: f.path,
        originalName: f.originalname,
      }))

      const { buffer, filename } = await mergeFilesToBuffer(inputs, {
        separator,
        customSeparator,
        outputFormat,
      })

      const id = randomUUID()
      const ext = path.extname(filename)
      const outPath = path.join(OUTPUTS_DIR, `${id}${ext}`)
      await fs.writeFile(outPath, buffer)

      // 刪除上傳暫存
      await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})))

      res.json({
        id,
        filename,
        size: buffer.length,
        fileCount: files.length,
        format: ext.slice(1),
      })
    } catch (err) {
      next(err)
    }
  }
)

mergeRouter.use(errorHandler)
