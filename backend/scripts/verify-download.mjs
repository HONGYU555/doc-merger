// 驗證下載的 docx 內容
import mammoth from 'mammoth'
import fs from 'node:fs/promises'

const buf = await fs.readFile('test-output/downloaded.docx')
const result = await mammoth.extractRawText({ buffer: buf })
console.log('=== 下載的 docx 完整內容 ===')
console.log(result.value)
console.log('=== 結束 ===')
console.log('總字元數:', result.value.length)
console.log('預期包含:')
const expectations = [
  '第一份文件：專案簡介',
  'doc-merger 的介紹',
  '第二份文件：技術規格',
  'Node.js + Express',
  'Vue 3 + Vite',
  '第三份文件：常見問題',
  '一次能上傳多少檔',
  '最多 50 個',
  '第四份文件：總覽',
  '批次合併工具',
  '第五份文件：結語',
  '感謝使用 doc-merger',
  '百度聯盟',
]
let passed = 0
for (const e of expectations) {
  const ok = result.value.includes(e)
  console.log(`  ${ok ? '✓' : '✗'} "${e}"`)
  if (ok) passed++
}
console.log(`\n通過: ${passed}/${expectations.length}`)
process.exit(passed === expectations.length ? 0 : 1)
