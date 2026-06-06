# doc-merger

Word(.docx) 与 TXT 文件批次合并工具，单次最多 50 个文件，内建百度联盟广告位，部署于阿里云 + 宝塔面板 + ICP 备案域名 `doc.hongyuai.top`。

## 站点信息

| 项 | 值 |
|---|---|
| 域名 | `doc.hongyuai.top` |
| 备案号 | 粤ICP备2026071601号-1 |
| 站点类型 | 个人轻量工具站 |
| 服务器 | 阿里云 ECS + 宝塔面板 |
| 进程守护 | PM2 |
| 部署方式 | GitHub push → Gitee 自动镜像 → Webhook 触发 VPS 自动部署 |

## 核心功能

- 拖曳上传 / 点击选择，单次最多 50 个文件
- 自动识别文件类型（.docx / .txt），混合合并
- 可自定义合并顺序（拖曳排序）
- 可选分隔符（两个换行 / 分页符 / 自定义字符串）
- 输出格式：Word (.docx) / TXT (.txt)
- 广告位：顶部 banner、侧栏、合并按钮下方、底部 footer
- ICP 备案号自动展示在 footer

## 文件夹结构

```
doc-merger/
├── AGENTS.md                # 给 AI Agent 的项目说明
├── README.md                # 本文件
├── .gitignore
├── doc-merger-standalone.html   # 单文件 HTML 版本（双击即用）
├── frontend/                # Vue 3 + Vite 前端
│   ├── src/
│   │   ├── components/      # Uploader / FileList / AdSlot 等组件
│   │   ├── api/             # 调用后端接口
│   │   └── styles/
│   ├── index.html           # 百度统计脚本注入点
│   └── package.json
├── backend/                 # Node + Express 后端
│   ├── src/
│   │   ├── routes/          # /api/merge, /api/download
│   │   ├── services/        # merger.ts (mammoth + docx)
│   │   ├── middleware/      # multer + errorHandler
│   │   └── utils/           # 临时文件管理
│   ├── scripts/             # 端到端测试脚本
│   └── package.json
├── deploy/                  # 部署文件
│   ├── deploy.sh            # 一键部署脚本
│   ├── webhook-server.js    # Gitee Webhook 接收器（PM2 守护）
│   ├── ecosystem.config.js  # PM2 配置（主服务 + webhook 接收器）
│   └── baota-deploy.md      # 宝塔面板部署指南
├── .github/
│   └── workflows/
│       └── mirror-to-gitee.yml  # GitHub → Gitee 自动镜像
└── design-output/           # UI 设计原型（旧版）
```

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 | ^3.5 |
| 构建工具 | Vite | ^5 |
| UI 组件库 | Element Plus | ^2.8 |
| HTTP | axios | ^1.7 |
| 后端 | Node.js | 20+ / 24 |
| 后端框架 | Express | ^4.21 |
| 文件上传 | Multer | ^1.4 |
| Word 读取 | mammoth | ^1.8 |
| Word 写入 | docx | ^9 |
| 进程守护 | PM2 | 5.x |
| 包管理 | pnpm | 10.33+ |
| 语言 | TypeScript | ^5.6 |

## 快速开始（本地开发）

```bash
# 后端（port 3010）
cd backend
pnpm install
pnpm dev

# 前端（port 5173，新终端）
cd frontend
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173` 开始使用。

## 部署到生产环境

参见 [deploy/baota-deploy.md](deploy/baota-deploy.md)，完整步骤涵盖：

1. DNS 解析
2. 宝塔面板添加站点
3. SSL 申请（Let's Encrypt）
4. Nginx 反向代理配置
5. Gitee SSH 公钥配置
6. clone 代码到 `/www/wwwroot/doc-merger`
7. 首次手动部署
8. 配置 Webhook 接收器
9. 配置 Gitee → GitHub 自动镜像

部署后访问 `https://doc.hongyuai.top`。

## 部署架构

```
开发者 push 到 GitHub
    ↓ (Gitee 自动镜像 / GitHub Action)
Gitee 仓库收到 push
    ↓ (Gitee Webhook POST http://doc.hongyuai.top:9000/webhook)
VPS 上的 webhook-server.js 验签
    ↓ 调 bash
deploy.sh 执行：
  - git pull from gitee mirror
  - pnpm install
  - pnpm build (frontend + backend)
  - pm2 reload
  - /api/health 检查
```

全流程约 30 秒。

## 测试

```bash
# 后端：端到端合并测试（6 案例 + 1 拒绝测试）
cd backend
node scripts/test-merge.mjs

# 验证下载文件内容（13/13 字符串匹配）
node scripts/verify-download.mjs

# 生成测试文件
node scripts/generate-test-files.mjs
```

## 百度联盟 / 百度统计接入

| 项 | 状态 | 说明 |
|---|---|---|
| 百度统计 ID | 待申请 | 配置到 `frontend/.env.production` 的 `VITE_BAIDU_TONGJI_ID` |
| 百度联盟 cproid | 待申请 | 配置到 `frontend/.env.production` 的 `VITE_BAIDU_UNION_CPROID`，并按 `frontend/src/components/AdSlot.vue` 注释中的步骤接线 c.js |
| 公网安备号 | 可选 | 取得后加到 `frontend/src/App.vue` 的 footer |

## 许可证

MIT
