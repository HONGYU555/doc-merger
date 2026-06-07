// Gitee Webhook 接收器
// 监听 :9000，验签后调 deploy.sh
// 启动: pm2 start ecosystem.config.cjs
//
// 使用 CommonJS 语法以兼容 PM2（PM2 对 ESM 支持有限）

const http = require('node:http')
const { spawn } = require('node:child_process')
const crypto = require('node:crypto')

const PORT = Number(process.env.WEBHOOK_PORT) || 9000
const TOKEN = process.env.WEBHOOK_TOKEN || 'replace-with-random-string'
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/www/wwwroot/doc-merger/deploy/deploy.sh'
const REPO_FILTER = process.env.REPO_FILTER || '' // 空 = 不过滤；填 'doc-merger' 只接受该仓库
const BRANCH = process.env.BRANCH || 'main'

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

function verifyGiteeSignature(body, password) {
  // Gitee Webhook 不发送 HMAC 头，只在 payload 里带 'password' 字段
  // 用户在 Gitee 仓库管理里设置的密钥
  try {
    const data = JSON.parse(body)
    return data.password === password
  } catch {
    return false
  }
}

function runDeploy() {
  return new Promise((resolve) => {
    log('starting deploy.sh ...')
    const child = spawn('bash', [DEPLOY_SCRIPT], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      log(`deploy.sh exited with code ${code}`)
      if (stdout) log('STDOUT: ' + stdout.trim().split('\n').slice(-5).join('\n'))
      if (stderr) log('STDERR: ' + stderr.trim().split('\n').slice(-5).join('\n'))
      resolve({ code, stdout, stderr })
    })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404)
    res.end('Not Found')
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', async () => {
    // 1. 验签
    if (!verifyGiteeSignature(body, TOKEN)) {
      log('REJECT: 密码不匹配')
      res.writeHead(401)
      res.end('Unauthorized')
      return
    }

    // 2. 仓库过滤
    let data
    try { data = JSON.parse(body) } catch { res.writeHead(400); res.end('Bad JSON'); return }
    if (REPO_FILTER && data.repository?.name !== REPO_FILTER) {
      log(`SKIP: repo ${data.repository?.name} 不匹配过滤条件 ${REPO_FILTER}`)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, skipped: true }))
      return
    }

    // 3. 只接受 push 事件 + 主分支
    if (data.ref && !data.ref.endsWith('/' + BRANCH)) {
      log(`SKIP: branch ${data.ref} 非主分支 (${BRANCH})`)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, skipped: true }))
      return
    }

    log(`ACCEPT: push from ${data.repository?.name}@${data.ref} by ${data.user_name || 'unknown'}`)

    // 4. 立即响应 200，再异步执行部署（Gitee webhook 超时 5s）
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, message: 'deploy started' }))

    // 5. 异步执行
    runDeploy().catch((err) => log('DEPLOY ERROR: ' + err.message))
  })
})

server.listen(PORT, '0.0.0.0', () => {
  log(`webhook-server listening on http://0.0.0.0:${PORT}/webhook`)
})
