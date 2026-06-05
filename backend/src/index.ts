import express from 'express'
import cors from 'cors'
import { mergeRouter } from './routes/merge.js'
import { downloadRouter } from './routes/download.js'
import { cleanupUploads } from './utils/cleanup.js'

const app = express()
const PORT = Number(process.env.PORT) || 3010

app.use(cors())
app.use(express.json())
app.use('/api', mergeRouter)
app.use('/api', downloadRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// 啟動時清理舊檔，每 30 分鐘跑一次
cleanupUploads()
setInterval(cleanupUploads, 30 * 60 * 1000)

app.listen(PORT, () => {
  console.log(`[doc-merger backend] listening on http://127.0.0.1:${PORT}`)
})
