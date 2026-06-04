# AGENTS.md

> 此檔案為給 AI Agent（OpenCode / Claude Code / Cursor 等）的專案說明文件。
> 開始任何工作前請先閱讀本檔案。

## 專案名稱

**doc-merger** — Word/TXT 批次合併工具（含百度聯盟廣告位）

## 簡介

Web 應用程式，讓使用者一次上傳最多 50 個 .docx 或 .txt 檔案，
後端依使用者指定順序合併輸出單一 Word 或 TXT 檔。
頁面預留廣告位整合百度聯盟，部署於 ICP 備案的中國大陸老域名。

## 資料夾結構

```
doc-merger/
├── AGENTS.md              # 本檔案
├── README.md              # 使用者文件
├── .gitignore
├── frontend/              # Vue 3 + Vite
│   ├── src/
│   │   ├── components/    # Uploader / FileList / AdSlot
│   │   ├── views/
│   │   └── api/
│   ├── public/
│   ├── index.html
│   └── package.json
├── backend/               # Node + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── uploads/           # 暫存（gitignore）
│   ├── outputs/           # 暫存（gitignore）
│   └── package.json
└── start-design.bat       # OpenDesign 快捷
```

## 技術棧

| 層 | 技術 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 | ^3.4 |
| 建構工具 | Vite | ^5 |
| UI 元件庫 | Element Plus | ^2 |
| 後端 | Node.js + Express | Node 24, Express ^4 |
| 檔案上傳 | Multer | ^1.4 |
| Word 讀取 | mammoth | ^1.8 |
| Word 寫入 | docx | ^9 |
| 套件管理 | pnpm | 10.33.x |
| 語言 | TypeScript | ^5 |

## 核心需求清單

1. **批次上傳** — 單次最多 **50 個檔案**，前端需做數量校驗
2. **檔案類型** — `.docx`、`.txt`（混合上傳合法）
3. **排序** — 上傳後可拖曳調整合併順序
4. **分隔符** — 預設兩個換行、可選分頁符、可自訂字串
5. **輸出格式** — Word（.docx）或 TXT（.txt）二擇一
6. **廣告位** — 預留 4 個固定插槽：
   - `<AdSlot position="top-banner" />`
   - `<AdSlot position="sidebar" />`
   - `<AdSlot position="action-below" />`
   - `<AdSlot position="footer" />`
   廣告位元件接受 `slotId`，內部注入百度聯盟提供的 `<script>`
7. **部署** — Nginx + PM2，部署到 ICP 備案老域名

## 百度聯盟整合說明

> ⚠️ 百度聯盟（百度网盟推广 / 百度联盟）審核硬性要求：
> 1. 網站必須有 **ICP 備案**（指向中國大陸境內伺服器的域名）
> 2. 網站內容健康、有實質功能（本工具符合）
> 3. 不可放在無內容的純廣告頁
>
> 整合流程：
> 1. 申請百度聯盟帳號 → 通過審核 → 拿到 `cproid` / `adId`
> 2. `AdSlot.vue` 元件根據 `slotId` 載入對應 `<script src="//cpro.baidustatic.com/cpro/ui/cm.js">`
> 3. 開發階段用 placeholder div 占位（`background: #f0f0f0; text: 廣告位 #1`）

## 同步對照表

| 位置 | 路徑 |
|------|------|
| 程式碼 | https://github.com/HONGYU555/doc-merger |
| 工作筆記 | `C:\Users\lyj14\Documents\Obsidian\创作库\doc-merger\` |
| 設定檔 | `opencode.json` |
| 設計產出 | `C:\Users\lyj14\Desktop\opencode\opendesign\artifacts\` |
| OpenDesign 啟動 | `start-design.bat`（專案根目錄） |
| 本地專案目錄 | `C:\Users\lyj14\Desktop\opencode\word--\txt-merge\`（資料夾名仍為 txt-merge，repo 名為 doc-merger） |

## 開發指令

```bash
# 前端
cd frontend
pnpm install
pnpm dev            # 開發伺服器，預設 http://localhost:5173
pnpm build          # 產出到 frontend/dist

# 後端
cd backend
pnpm install
pnpm dev            # nodemon 啟動，預設 http://localhost:3000
pnpm start          # 正式環境
```

## 開發注意事項

1. **檔案大小限制** — 後端 Multer 設定每檔 ≤10MB，總請求 ≤300MB
2. **暫存清理** — `uploads/` 與 `outputs/` 內檔案處理完後立即刪除，定時 cron 清舊檔
3. **Word 編碼** — TXT 統一以 UTF-8 讀寫；遇到 BIG5 / GBK 需自動偵測
4. **安全性** — 過濾上傳檔副檔名與 MIME，防止任意檔案上傳
5. **廣告位** — 不可影響核心功能，所有 `AdSlot` 元件需可降級為占位 div

## OpenDesign 用途

UI 設計時呼叫 OpenDesign 生成 Element Plus 主題、上傳介面、合併按鈕等元件原型。
雙擊專案根目錄 `start-design.bat` 即可啟動。

## Lint / Typecheck

```bash
# 前端
cd frontend && pnpm lint && pnpm typecheck

# 後端
cd backend && pnpm lint && pnpm typecheck
```

完成任何修改後必須執行以上指令。
