#!/usr/bin/env bash
# doc-merger 一键部署脚本
# 用法: ./deploy.sh [--force]
#   --force  跳过 git pull（用于首次部署 / 故障恢复）
#
# 前置:
#   - 已 git clone https://gitee.com/HONGYU555/doc-merger.git /www/wwwroot/doc-merger
#   - Node.js 20+ 与 pnpm 已安装
#   - PM2 已安装 (npm i -g pm2)
#   - backend/.env 与 frontend/.env.production 已配置（参考 .env.example）

set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/doc-merger}"
BRANCH="${BRANCH:-main}"
LOG_FILE="${LOG_FILE:-/var/log/doc-merger-deploy.log}"
LOCK_FILE="${LOCK_FILE:-/tmp/doc-merger-deploy.lock}"
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *) echo "[deploy] unknown arg: $arg" >&2; exit 1 ;;
  esac
done

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%F %T')] $*"; }

# 防止并发执行
if [ -e "$LOCK_FILE" ]; then
  log "ERROR: deploy lock exists ($LOCK_FILE), another deploy is running"
  exit 1
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

cd "$APP_DIR" || { log "ERROR: APP_DIR $APP_DIR not found"; exit 1; }

# 1. 拉取代码（从 Gitee 镜像）
if [ "$FORCE" -eq 1 ]; then
  log "STEP 1/6: --force 跳过 git pull"
else
  log "STEP 1/6: git fetch & reset to origin/$BRANCH"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  log "  HEAD: $(git rev-parse --short HEAD) ($(git log -1 --pretty=%s))"
fi

# 2. 检查 Node.js / pnpm
log "STEP 2/6: 检查环境"
command -v node >/dev/null || { log "ERROR: node not found"; exit 1; }
command -v pnpm >/dev/null || { log "ERROR: pnpm not found"; exit 1; }
log "  node: $(node -v)  pnpm: $(pnpm -v)"

# 3. 后端：装依赖 → 类型检查 → tsc 编译
log "STEP 3/6: backend install & build"
cd "$APP_DIR/backend"
pnpm install --frozen-lockfile --prod=false
pnpm exec tsc
log "  backend/dist 已生成"

# 4. 前端：装依赖 → 构建（带 .env.production）
log "STEP 4/6: frontend install & build"
cd "$APP_DIR/frontend"
[ -f .env.production ] || { log "WARN: frontend/.env.production 不存在，使用 .env.example 默认值"; cp .env.example .env.production; }
pnpm install --frozen-lockfile
pnpm build
log "  frontend/dist 已生成"

# 5. 启动 / 重启 PM2
log "STEP 5/6: pm2 reload"
cd "$APP_DIR/deploy"
if pm2 list | grep -q "doc-merger"; then
  pm2 reload ecosystem.config.cjs --env production
  log "  pm2 reload 完成"
else
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  log "  pm2 首次启动完成，已保存进程列表"
fi

# 6. 健康检查
log "STEP 6/6: 健康检查"
sleep 2
HEALTH=$(curl -fsS http://127.0.0.1:3011/api/health || echo "FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "  ✅ 健康检查通过: $HEALTH"
else
  log "  ❌ 健康检查失败: $HEALTH"
  exit 1
fi

log "==== 部署完成 ===="
