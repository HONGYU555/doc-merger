// PM2 进程配置（CommonJS 语法，文件后缀 .cjs）
// 启动:  pm2 start ecosystem.config.cjs --env production
// 状态:  pm2 status
// 日志:  pm2 logs doc-merger
// 重启:  pm2 reload doc-merger
//
// 注意：webhook-server.js 已在 .js 改为 CommonJS（require）语法，
// PM2 对 ESM 支持有限（需 --esm 实验性 flag），故全栈使用 CJS。

module.exports = {
  apps: [
    {
      name: 'doc-merger',
      script: '../backend/dist/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
      error_file: '/var/log/pm2/doc-merger-error.log',
      out_file: '/var/log/pm2/doc-merger-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'doc-merger-webhook',
      script: './webhook-server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
        WEBHOOK_TOKEN: 'iM9ICX64YKstv1BN0er32Z7OjxobQz5p',
        DEPLOY_SCRIPT: '/www/wwwroot/doc-merger/deploy/deploy.sh',
        REPO_FILTER: 'doc-merger',
        BRANCH: 'main',
      },
      env_production: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
        WEBHOOK_TOKEN: 'iM9ICX64YKstv1BN0er32Z7OjxobQz5p',
        DEPLOY_SCRIPT: '/www/wwwroot/doc-merger/deploy/deploy.sh',
        REPO_FILTER: 'doc-merger',
        BRANCH: 'main',
      },
      error_file: '/var/log/pm2/doc-merger-webhook-error.log',
      out_file: '/var/log/pm2/doc-merger-webhook-out.log',
      merge_logs: true,
      time: true,
    },
  ],
}
