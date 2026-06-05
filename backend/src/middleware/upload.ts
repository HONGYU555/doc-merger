import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { UPLOADS_DIR } from '../utils/paths.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 50,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.docx' && ext !== '.txt') {
      return cb(new Error(`不支援的檔案類型: ${ext}（僅接受 .docx / .txt）`))
    }
    cb(null, true)
  },
})
