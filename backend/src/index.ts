import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { mergeRouter } from './routes/merge.js'
import { downloadRouter } from './routes/download.js'
import { cleanupUploads } from './utils/cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = Number(process.env.PORT) || 3010

app.use(cors())
app.use(express.json())
app.use('/api', mergeRouter)
app.use('/api', downloadRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'doc-merger',
    timestamp: new Date().toISOString(),
  })
})

// 生产环境托管前端 dist（开发时不存在，不影响）
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
if (existsSync(frontendDist)) {
  app.use('/doc-merger', express.static(frontendDist, { maxAge: '1h', index: 'index.html' }))
  // SPA fallback：/doc-merger/* 返回 index.html，其他走根路径首页
  app.get('/doc-merger/*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
  console.log(`[doc-merger] serving frontend from ${frontendDist}`)
}

// 启动时清理旧檔，每 30 分钟跑一次
cleanupUploads()
setInterval(cleanupUploads, 30 * 60 * 1000)

app.listen(PORT, () => {
  console.log(`[doc-merger backend] listening on http://127.0.0.1:${PORT}`)
})
