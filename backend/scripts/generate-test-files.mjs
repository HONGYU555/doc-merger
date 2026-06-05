// scripts/generate-test-files.mjs
// 建立測試用的 .txt 與 .docx 檔案，用於合併功能驗證
import { Document, Packer, Paragraph, TextRun } from 'docx'
import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = path.resolve('test-files')
await fs.mkdir(OUT_DIR, { recursive: true })

// 3 個 TXT
const txtContents = [
  { name: '01-intro.txt', text: '第一份文件：專案簡介\n這是 doc-merger 的介紹。\n支援 Word 與 TXT 兩種格式。' },
  { name: '02-spec.txt', text: '第二份文件：技術規格\n後端：Node.js + Express\n前端：Vue 3 + Vite' },
  { name: '03-faq.txt', text: '第三份文件：常見問題\nQ: 一次能上傳多少檔？\nA: 最多 50 個。' },
]
for (const t of txtContents) {
  await fs.writeFile(path.join(OUT_DIR, t.name), t.text, 'utf8')
  console.log('  txt:', t.name)
}

// 2 個 docx
const docxDocs = [
  {
    name: '04-overview.docx',
    paragraphs: ['第四份文件：總覽', 'doc-merger 是一個批次合併工具。', '可部署到老域名。'],
  },
  {
    name: '05-conclusion.docx',
    paragraphs: ['第五份文件：結語', '感謝使用 doc-merger。', '請支持百度聯盟廣告。'],
  },
]
for (const d of docxDocs) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: d.paragraphs.map((t) => new Paragraph({ children: [new TextRun(t)] })),
      },
    ],
  })
  const buf = await Packer.toBuffer(doc)
  await fs.writeFile(path.join(OUT_DIR, d.name), buf)
  console.log('  docx:', d.name)
}

console.log('Done. Test files at', OUT_DIR)
