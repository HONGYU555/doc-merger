# 宝塔面板部署指南（完整详细版）

> 目标：本地 push GitHub → Gitee 自动镜像 → Webhook 触发 VPS 部署 → `hongyuai.top/doc-merger` 上线

---

## 第 0 步：确认你的信息

在开始之前，先确认以下信息（截图里已经能看到大部分）：

| 项 | 值 | 在哪里看 |
|---|---|---|
| VPS 公网 IP | `？` | 阿里云轻量应用服务器控制台首页 |
| VPS 系统 | 宝塔面板已装 | `https://你的IP:8888` 能打开 |
| 域名 | `hongyuai.top` | 阿里云备案系统 |
| 备案号 | 粤ICP备2026071601号-1 | 阿里云备案系统 |
| GitHub 仓库 | `HONGYU555/doc-merger` | 已推送 |

**VPS 公网 IP 怎么查：**
1. 打开 https://home.console.aliyun.com/
2. 左侧菜单 → 轻量应用服务器 → 服务器
3. 找到你的实例，看到「公网 IP」那一列，复制 IP 地址

---

## 第 1 步：阿里云 DNS 解析（添加 A 记录）

### 1.1 打开阿里云 DNS 控制台
浏览器打开：https://dns.console.aliyun.com/

> 如果提示登录，用你的阿里云账号登录。

### 1.2 找到你的域名
- 页面上方有「域名列表」或「我的域名」
- 找到 `hongyuai.top`，点击它

### 1.3 添加 A 记录
点击「添加记录」按钮，然后填：

| 字段 | 填什么 | 说明 |
|---|---|---|
| 主机记录 | `@` | 英文输入 `@`，代表主域名 |
| 记录类型 | `A` | 下拉选 A |
| 记录值 | `你的VPS公网IP` | 比如 `47.108.xxx.xxx` |
| TTL | `10 分钟` | 下拉选 10 分钟 |

点击「确认」或「保存」。

> 等 1~2 分钟让解析生效。

### 1.4 验证解析生效
打开命令行（Windows 用 CMD 或 PowerShell），执行：
```
ping hongyuai.top
```
看到返回你的 VPS 公网 IP 就说明生效了。

---

## 第 2 步：宝塔面板操作

### 2.1 登录宝塔面板
浏览器打开：`https://你的VPS公网IP:8888`

> 第一次登录会显示宝塔的登录界面，输入你安装宝塔时设置的用户名和密码。
> 如果忘记密码，在 VPS SSH 里执行 `bt default` 查看。

### 2.2 安装 Nginx
左侧菜单 → 软件商店 → 搜索「Nginx」→ 点击「安装」
- 版本选 1.24+
- 安装方式选「编译安装」或「极速安装」都可以
- 点击「确定」开始安装（需要 1~3 分钟）

> 安装完成后，Nginx 会自动运行。

### 2.3 安装 PM2 管理器
左侧菜单 → 软件商店 → 搜索「PM2」→ 点击「安装」
- 点击「确定」

> 安装完成后，PM2 管理器会出现在已安装列表里。

### 2.4 安装 Node.js 版本管理器
左侧菜单 → 软件商店 → 搜索「Node.js」→ 点击「版本管理器」→ 安装
- 安装完成后，点击「设置」
- 选择 Node.js 20 LTS 版本，点击「安装」

> 安装完成后，SSH 里就能用 `node -v` 和 `pnpm` 了。

### 2.5 添加站点
左侧菜单 → 网站 → 点击「添加站点」按钮

填以下信息：

| 字段 | 填什么 |
|---|---|
| 域名 | `hongyuai.top` |
| 备注 | `doc-merger` |
| 根目录 | `/www/wwwroot/doc-merger` |
| 数据库 | 不创建 |
| PHP 版本 | 选择「纯静态」或「不使用」 |
| 端口 | 80（默认） |

点击「提交」。

### 2.6 申请 SSL 证书
左侧菜单 → 网站 → 找到 `hongyuai.top` 这一行 → 点击「设置」

弹出窗口，左侧点击「SSL」：

1. 选择「Let's Encrypt」标签页
2. 勾选你的域名 `hongyuai.top`
3. 点击「申请」按钮
4. 等待 10~30 秒，看到「申请成功」提示

> 申请成功后，左侧 SSL 页面会出现「开启 HTTPS」的开关，点击开启。

> 如果申请失败，检查：
> - DNS 解析是否生效（第 1 步）
> - 域名是否已备案
> - 80 端口是否被占用

### 2.7 配置反向代理
左侧菜单 → 网站 → 找到 `hongyuai.top` 这一行 → 点击「设置」

弹出窗口，左侧点击「反向代理」：

点击「添加反向代理」按钮，填：

| 字段 | 填什么 |
|---|---|
| 代理名称 | `doc-merger` |
| 目标 URL | `http://127.0.0.1:3011` |
| 发送域名 | `$host` |
| 代理目录 | 留空（不要填任何东西） |

点击「提交」。

> 这一步的意思是：所有访问 `hongyuai.top` 的流量，都转发给 Node.js 的 3011 端口。

### 2.8 安装 Git（如果还没装）
SSH 登录 VPS，执行：
```bash
# Debian/Ubuntu
apt update && apt install -y git

# CentOS
yum install -y git
```

### 2.9 安装 pnpm（如果还没装）
SSH 登录 VPS，执行：
```bash
npm install -g pnpm
```

---

## 第 3 步：VPS 上配置 Gitee SSH 公钥

> 这一步是为了让 VPS 能从 Gitee 拉取代码。

### 3.1 生成 SSH 密钥
SSH 登录 VPS，执行：
```bash
ssh-keygen -t ed25519 -C "doc-merger-deploy" -f /root/.ssh/gitee_deploy
# 一路回车，不需要设置密码
```

### 3.2 复制公钥内容
```bash
cat /root/.ssh/gitee_deploy.pub
```
会显示一串以 `ssh-ed25519` 开头的文字，**整行复制**。

### 3.3 在 Gitee 添加公钥
1. 打开 https://gitee.com/
2. 登录你的 Gitee 账号（没有就注册一个）
3. 点击右上角头像 → 设置
4. 左侧菜单 → SSH 公钥
5. 在「公钥」输入框里粘贴刚才复制的整行文字
6. 标题随便填，比如 `doc-merger-deploy`
7. 点击「确定」

### 3.4 测试 SSH 连接
```bash
ssh -T -i /root/.ssh/gitee_deploy git@gitee.com
# 如果看到 "You've successfully authenticated" 就成功了
# 如果看到 "Host key verification failed"，执行：
ssh-keyscan gitee.com >> /root/.ssh/known_hosts
```

---

## 第 4 步：VPS 上部署代码

### 4.1 Clone 代码
```bash
cd /www/wwwroot
git clone https://gitee.com/HONGYU555/doc-merger.git doc-merger
cd doc-merger
git checkout main
```

### 4.2 配置环境变量
```bash
cd /www/wwwroot/doc-merger

# 前端环境变量
cp frontend/.env.example frontend/.env.production

# 后端环境变量
cp backend/.env.example backend/.env
```

### 4.3 修改后端 .env（可选）
```bash
nano backend/.env
# 按 i 进入编辑模式
# 确认 PORT=3010
# 按 ESC，输入 :wq 回车保存退出
```

### 4.4 首次部署
```bash
cd /www/wwwroot/doc-merger
chmod +x deploy/deploy.sh
./deploy/deploy.sh --force
```

> 首次部署会安装依赖、编译代码、启动 PM2，需要 2~5 分钟。
> 看到 `✅ 健康检查通过` 就成功了。

### 4.5 检查服务状态
```bash
pm2 status
```
应该看到两个进程在运行：
- `doc-merger`（主服务，端口 3011）
- `doc-merger-webhook`（Webhook 接收器，端口 9000）

### 4.6 查看日志
```bash
pm2 logs doc-merger --lines 20
```
应该看到 `listening on http://127.0.0.1:3011`。

---

## 第 5 步：验证部署成功

浏览器打开：`https://hongyuai.top/doc-merger/`

应该看到 doc-merger 的页面：
- 顶部显示「doc-merger Word/TXT 批次合并工具」
- 有上传区域
- 有 4 个广告位占位
- 底部显示「粤ICP备2026071601号-1」

**如果看到 502 错误：**
- 检查 PM2 进程是否在运行：`pm2 status`
- 检查 Nginx 反向代理配置是否正确
- 检查阿里云安全组是否放行 80/443 端口

**如果看到 404 错误：**
- 检查前端 dist 是否构建成功：`ls /www/wwwroot/doc-merger/frontend/dist/`
- 检查 Nginx 反向代理目标 URL 是否为 `http://127.0.0.1:3011`

**如果样式/图片加载失败：**
- 检查 Nginx 反向代理是否配置为全量代理（代理目录留空）

---

## 第 6 步：配置 Webhook 自动部署

### 6.1 生成 Webhook 密钥
```bash
openssl rand -hex 32
```
会输出一串 64 位的十六进制字符，**复制保存**，后面要用。

### 6.2 修改 PM2 配置
```bash
nano /www/wwwroot/doc-merger/deploy/ecosystem.config.js
```

找到两处 `WEBHOOK_TOKEN`，把 `replace-with-random-string` 替换成 6.1 生成的密钥：

```
WEBHOOK_TOKEN: 'replace-with-random-string',
```
改成：
```
WEBHOOK_TOKEN: '你生成的密钥',
```

> 注意：ecosystem.config.js 里有两处 WEBHOOK_TOKEN（env 和 env_production），都要改。

按 ESC，输入 `:wq` 回车保存退出。

### 6.3 重启 webhook 接收器
```bash
cd /www/wwwroot/doc-merger/deploy
pm2 delete doc-merger-webhook
pm2 start ecosystem.config.js --env production
pm2 save
```

### 6.4 检查 webhook 接收器
```bash
pm2 logs doc-merger-webhook --lines 10
```
应该看到 `webhook-server listening on http://0.0.0.0:9000/webhook`。

### 6.5 阿里云安全组放行 9000 端口
1. 打开阿里云控制台：https://ecs.console.aliyun.com/
2. 左侧菜单 → 轻量应用服务器 → 服务器
3. 点击你的实例 → 防火墙
4. 点击「添加规则」按钮
5. 端口范围填 `9000/9000`，协议选 TCP，备注填 `webhook`
6. 点击「确定」

### 6.6 测试 Webhook 连接
```bash
curl -X POST http://127.0.0.1:9000/webhook -H "Content-Type: application/json" -d '{"password":"你生成的密钥"}'
```
应该返回 `{"ok":true,"message":"deploy started"}`。

### 6.7 在 Gitee 配置 Webhook
1. 打开 https://gitee.com/HONGYU555/doc-merger
2. 点击「管理」标签
3. 左侧菜单 → Webhooks
4. 点击「添加」
5. URL 填：`http://你的VPS公网IP:9000/webhook`
6. 密码填：6.1 生成的密钥
7. 点击「提交」

> 如果 9000 端口被防火墙拦了，会返回 404 或超时。检查第 6.5 步。

---

## 第 7 步：配置 GitHub → Gitee 自动镜像

### 方式 A：Gitee 自动同步（推荐，最简单）
1. 打开 https://gitee.com/HONGYU555/doc-merger
2. 点击「管理」标签
3. 左侧菜单 → 同步设置
4. 勾选「启用同步」
5. 同步源：`https://github.com/HONGYU555/doc-merger.git`
6. 同步方向：GitHub → Gitee
7. 点击「保存」

### 方式 B：手动同步（如果方式 A 不可用）
每次在 GitHub push 后，手动执行：
```bash
# 在本地电脑上
cd /path/to/doc-merger
git push gitee main
```

---

## 第 8 步：验证完整流程

### 8.1 在本地修改代码
```bash
# 在本地电脑上
cd /path/to/doc-merger
# 修改任意文件
echo "// test" >> README.md
git add -A
git commit -m "test: 验证自动部署"
git push origin main
```

### 8.2 等待自动部署
- GitHub → Gitee 自动同步：1~2 分钟
- Gitee Webhook → VPS 部署：30 秒~1 分钟

### 8.3 检查部署结果
```bash
# 在 VPS 上
pm2 logs doc-merger --lines 10
# 应该看到最新的部署日志
```

### 8.4 访问网站
浏览器打开：`https://hongyuai.top/doc-merger/`
应该看到最新的代码效果。

---

## 常见问题

### Q: DNS 解析不生效？
- 检查阿里云 DNS 控制台是否添加了 A 记录
- 等待 5~10 分钟
- 用 `ping hongyuai.top` 测试

### Q: SSL 申请失败？
- 检查 DNS 解析是否生效
- 检查 80 端口是否开放
- 检查域名是否已备案

### Q: Nginx 反向代理 502？
- 检查 PM2 进程是否运行：`pm2 status`
- 检查目标 URL 是否为 `http://127.0.0.1:3011`
- 检查后端日志：`pm2 logs doc-merger`

### Q: Webhook 返回 401？
- 检查密码是否正确：`ecosystem.config.js` 的 `WEBHOOK_TOKEN`
- 检查 Gitee Webhook 的密码是否一致

### Q: Webhook 返回 500？
- 检查 webhook 接收器日志：`pm2 logs doc-merger-webhook`
- 检查 deploy.sh 是否有执行权限：`chmod +x deploy/deploy.sh`

### Q: 页面样式/图片加载失败？
- 检查 Nginx 反向代理是否配置为全量代理
- 检查前端 dist 目录：`ls /www/wwwroot/doc-merger/frontend/dist/`

---

## 你还需要做的

- [ ] 第 1 步：阿里云 DNS 解析
- [ ] 第 2 步：宝塔面板操作
- [ ] 第 3 步：配置 Gitee SSH 公钥
- [ ] 第 4 步：VPS 上部署代码
- [ ] 第 5 步：验证部署成功
- [ ] 第 6 步：配置 Webhook 自动部署
- [ ] 第 7 步：配置 GitHub → Gitee 自动镜像
- [ ] 第 8 步：验证完整流程
