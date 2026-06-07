#!/bin/bash
# doc-merger 远程服务器一键部署脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/HONGYU555/doc-merger/main/deploy/remote-setup.sh | sudo bash

set -euo pipefail

REPO_URL="git@gitee.com:hongyu000555/doc-merger.git"
APP_DIR="/www/wwwroot/doc-merger"
PORT=3011
WEBHOOK_PORT=9000
WEBHOOK_TOKEN="iM9ICX64YKstv1BN0er32Z7OjxobQz5p"

echo "=== doc-merger 远程一键部署 ==="

# 1. 确保目录可写（宝塔 .user.ini 有 immutable 属性，需先移除）
if [ -d "$APP_DIR" ]; then
  echo "[1/8] 清理旧目录..."
  chattr -i "$APP_DIR/.user.ini" 2>/dev/null || true
  rm -rf "$APP_DIR"
fi

# 2. Clone 代码
echo "[2/8] 从 Gitee 拉取代码..."
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# 3. 安装依赖
echo "[3/8] 安装前端依赖..."
cd frontend
pnpm install --frozen-lockfile

echo "[4/8] 安装后端依赖..."
cd ../backend
pnpm install --frozen-lockfile

# 4. 配置环境变量
echo "[5/8] 配置环境变量..."
cd "$APP_DIR"
cp frontend/.env.example frontend/.env.production 2>/dev/null || true
cp backend/.env.example backend/.env 2>/dev/null || true

# 5. 构建
echo "[6/8] 构建前端..."
cd frontend
pnpm build

echo "[7/8] 构建后端..."
cd ../backend
pnpm exec tsc

# 6. 启动 PM2
echo "[8/8] 启动 PM2..."
cd "$APP_DIR/deploy"
if pm2 list | grep -q "doc-merger"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

# 7. 健康检查
echo "=== 健康检查 ==="
sleep 2
HEALTH=$(curl -fsS http://127.0.0.1:$PORT/api/health || echo "FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ 部署完成！访问 https://hongyuai.top/doc-merger/"
else
  echo "❌ 健康检查失败: $HEALTH"
  exit 1
fi
