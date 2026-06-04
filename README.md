# doc-merger

Word(.docx) 與 TXT 檔案批次合併工具，支援單次匯入 ≤50 個檔案，內建百度聯盟廣告位。

## 專案簡介

提供 Web UI 讓使用者上傳多個 Word 或 TXT 文件，後端合併成單一檔案（Word/TXT/PDF 三選一輸出）。
頁面預留多個廣告位整合百度聯盟，可投放到通過 ICP 備案的老域名。

## 核心功能

- 拖曳上傳 / 點擊選擇，單次最多 50 個檔案
- 自動識別檔案類型（.docx / .txt），混合合併
- 可自訂合併順序（拖曳排序）
- 可選分隔符（換行 / 分頁符 / 自訂文字）
- 輸出格式：Word、TXT
- 廣告位：頂部 banner、側欄、合併按鈕下方、底部 footer

## 資料夾結構

```
doc-merger/
├── AGENTS.md              # 給 AI Agent 的專案說明（必讀）
├── README.md              # 本檔案
├── .gitignore
├── frontend/              # Vue3 + Vite 前端
│   ├── src/
│   │   ├── components/    # Uploader / FileList / AdSlot 等元件
│   │   ├── views/
│   │   └── api/           # 呼叫後端介面
│   ├── public/
│   ├── index.html         # 預留百度聯盟廣告 script 注入點
│   └── package.json
├── backend/               # Node + Express 後端
│   ├── src/
│   │   ├── routes/        # /api/merge, /api/upload
│   │   ├── services/      # docx-merge.js, txt-merge.js
│   │   └── utils/
│   ├── uploads/           # 暫存上傳檔案（gitignore）
│   ├── outputs/           # 暫存輸出結果（gitignore）
│   └── package.json
└── start-design.bat       # 啟動 OpenDesign 進行 UI 設計
```

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3 + Vite + Element Plus |
| 上傳元件 | vue-upload-component / element-plus 自帶 |
| 後端 | Node.js + Express + Multer |
| Word 處理 | `docx` (write) + `mammoth` (read) |
| TXT 處理 | Node fs 原生 |
| 開發語言 | TypeScript（前後端統一） |

## 部署目標

- 部署到中國大陸境內伺服器 + ICP 備案老域名（百度聯盟硬性要求）
- Web Server：Nginx 反向代理
- Node 服務：PM2 常駐
- 靜態檔案：Nginx 直接服務 frontend/dist

## 快速開始

```bash
# 前端
cd frontend
pnpm install
pnpm dev

# 後端（新終端）
cd backend
pnpm install
pnpm dev
```
