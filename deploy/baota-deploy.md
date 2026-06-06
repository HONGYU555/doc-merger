# 宝塔面板部署指南（doc-merger → doc.hongyuai.top）

> 目标：本地 push GitHub → Gitee 自动镜像 → Webhook 触发 VPS 部署 → `doc.hongyuai.top` 上线

---

## 0. 前提

- 阿里云 ECS（已备案 IP）
- 宝塔面板已安装（`https://your-server-ip:8888`）
- 域名 `hongyuai.top` 在阿里云 / 腾讯云 / Cloudflare 等 DNS 服务商

## 1. DNS 解析

在 DNS 服务商添加：

| 主机记录 | 记录类型 | 记录值 |
|---|---|---|
| `@` | A | `<你的 ECS 公网 IP>` |
| `doc` | A | `<你的 ECS 公网 IP>` |

> 第一阶段只建 `doc.hongyuai.top`，先不加泛解析。

## 2. 宝塔面板一次性配置

### 2.1 安装基础环境
宝塔面板 → 软件商店 → 安装：
- **Nginx** 1.24+
- **PM2 管理器** 5.x（宝塔自带）
- **Node.js 版本管理器** → 安装 Node.js 20 LTS

### 2.2 创建站点
宝塔面板 → 网站 → 添加站点：
- 域名：`doc.hongyuai.top`
- 备注：doc-merger
- 根目录：`/www/wwwroot/doc.hongyuai.top`（先建着，后面用 Node 接管）
- 数据库：不创建
- PHP：纯静态
- SSL：稍后申请 Let's Encrypt
- 站点状态：启用

### 2.3 申请 SSL
宝塔面板 → 网站 → `doc.hongyuai.top` → 设置 → SSL：
- 选 **Let's Encrypt** → 申请
- 申请成功后开启 **强制 HTTPS**

### 2.4 修改 Nginx 配置
宝塔面板 → 网站 → `doc.hongyuai.top` → 设置 → 反向代理：
- 代理名称：doc-merger
- 目标 URL：`http://127.0.0.1:3010`
- 发送域名：`$host`
- 代理目录：留空

> 宝塔会自动写好 Nginx 配置文件。无需手动改 conf。

## 3. 部署代码

### 3.1 在阿里云配置 Gitee SSH 公钥
ECS 上执行：
```bash
ssh-keygen -t ed25519 -C "doc-merger-deploy" -f /root/.ssh/gitee_deploy
cat /root/.ssh/gitee_deploy.pub
# 复制输出，粘贴到 Gitee 账号 → 设置 → SSH公钥
ssh -T -i /root/.ssh/gitee_deploy git@gitee.com
# 看到 "You've successfully authenticated" 即可
```

### 3.2 clone 代码（从 Gitee 镜像）
```bash
mkdir -p /www/wwwroot
cd /www/wwwroot
git clone https://gitee.com/HONGYU555/doc-merger.git doc-merger
cd doc-merger
git checkout main
```

### 3.3 配置环境变量
```bash
cd /www/wwwroot/doc-merger

# 后端
cp backend/.env.example backend/.env
nano backend/.env  # 改 PORT=3010 即可，其他默认

# 前端（暂时不填百度统计/联盟 ID）
cp frontend/.env.example frontend/.env.production
nano frontend/.env.production
```

### 3.4 首次部署
```bash
cd /www/wwwroot/doc-merger
chmod +x deploy/deploy.sh
./deploy/deploy.sh --force
```

完成后访问 `http://doc.hongyuai.top` 即可看到页面。

## 4. Webhook 自动部署

### 4.1 生成 Webhook 密钥
```bash
openssl rand -hex 32
# 复制输出，作为 WEBHOOK_TOKEN
```

### 4.2 更新 PM2 配置
```bash
cd /www/wwwroot/doc-merger/deploy
nano ecosystem.config.js
# 把两处 WEBHOOK_TOKEN 都改成 4.1 生成的密钥
```

### 4.3 修改 deploy.sh 中的端口（如果改了）
默认 9000 端口，如被占用需在 `deploy.sh` 与 `ecosystem.config.js` 同步修改。

### 4.4 重启 webhook 接收器
```bash
pm2 reload doc-merger-webhook
pm2 logs doc-merger-webhook
```

### 4.5 阿里云安全组放行 9000 端口
阿里云控制台 → ECS → 安全组 → 入方向：
- 端口范围：`9000/9000`
- 协议：TCP
- 授权对象：`0.0.0.0/0`（Gitee 出口 IP 可限制：`36.110.0.0/16` 等，但 IP 段经常变，建议先全开）

### 4.6 配置 Gitee Webhook
Gitee 仓库 `HONGYU555/doc-merger` → 管理 → Webhooks → 添加：
- URL：`http://doc.hongyuai.top:9000/webhook`
- 密码：填 4.1 生成的密钥
- 事件：Push

测试：点「测试」按钮 → 应返回 `{"ok":true,"message":"deploy started"}`

## 5. GitHub → Gitee 自动镜像

### 方式 A：Gitee 自动同步（推荐，最简单）
Gitee 仓库 → 管理 → 仓库设置 → 同步设置：
- 勾选「启用同步」
- 同步源：`https://github.com/HONGYU555/doc-merger.git`
- 同步方向：GitHub → Gitee
- 同步触发：Push 事件

### 方式 B：GitHub Actions（如果方式 A 不可用）
在 `.github/workflows/mirror-to-gitee.yml` 已配置好，需要在 GitHub repo 设置 Secrets：
- `GITEE_PRIVATE_KEY`：Gitee 账号 SSH 私钥

## 6. 日常操作

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs doc-merger --lines 100

# 手动重新部署
cd /www/wwwroot/doc-merger && ./deploy/deploy.sh

# 回滚到上一版
cd /www/wwwroot/doc-merger
git log --oneline -5
git reset --hard <commit-hash>
./deploy/deploy.sh --force
```

## 7. 故障排查

| 现象 | 排查 |
|---|---|
| Webhook 返回 401 | 密码不匹配，检查 `ecosystem.config.js` 的 `WEBHOOK_TOKEN` 与 Gitee 后台是否一致 |
| 部署成功但页面 502 | Nginx 反代没生效，宝塔面板 → 网站 → 反向代理 检查 |
| 9000 端口连不上 | 阿里云安全组未放行 |
| Gitee clone 失败 | SSH 公钥未配，或 DNS 解析未生效 |
| pm2 命令找不到 | 宝塔 Node.js 版本管理器安装后未激活环境，重连 SSH 即可 |

## 8. 安全提醒

- `WEBHOOK_TOKEN` 用 `openssl rand -hex 32` 生成，不要用默认 `replace-with-random-string`
- `.env` / `.env.production` 不要提交到 Git（已在 `.gitignore`）
- 宝塔面板不要用默认端口 8888，改一个不常见端口
- 阿里云安全组 SSH 22 端口改非标（如 50222），禁用密码登录，只用密钥
