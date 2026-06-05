import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err)
  // Multer 錯誤統一回傳 400
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? '單檔超過 10MB 上限'
        : err.code === 'LIMIT_FILE_COUNT'
        ? '檔案數量超過 50'
        : err.message
    return res.status(400).json({ error: msg, code: err.code })
  }
  const status = err?.status || 500
  const message = err?.message || 'Internal Server Error'
  res.status(status).json({ error: message })
}
