// scripts/test-merge.mjs
// 端到端測試：上傳檔案 → 合併 → 下載 → 驗證內容
import fs from 'node:fs/promises'
import path from 'node:path'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import mammoth from 'mammoth'

const API = 'http://127.0.0.1:3010'
const TEST_FILES = path.resolve('test-files')

async function callMerge(files, { separator = 'newline', customSeparator = '', outputFormat = 'docx' } = {}) {
  const fd = new FormData()
  for (const f of files) {
    const buf = await fs.readFile(f)
    const blob = new Blob([buf])
    fd.append('files', blob, path.basename(f))
  }
  fd.append('separator', separator)
  if (customSeparator) fd.append('customSeparator', customSeparator)
  fd.append('outputFormat', outputFormat)

  const r = await fetch(`${API}/api/merge`, { method: 'POST', body: fd })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`HTTP ${r.status}: ${text}`)
  }
  return r.json()
}

async function downloadFile(id) {
  const r = await fetch(`${API}/api/download/${id}`)
  if (!r.ok) throw new Error(`Download failed: ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  return buf
}

async function testCase(name, files, opts) {
  console.log(`\n=== ${name} ===`)
  try {
    const meta = await callMerge(files, opts)
    console.log('  meta:', meta)
    const buf = await downloadFile(meta.id)
    const outPath = path.resolve(`test-output/${meta.filename}`)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, buf)
    console.log('  saved:', outPath, `(${buf.length} bytes)`)

    // 驗證內容
    if (meta.filename.endsWith('.txt')) {
      const text = buf.toString('utf8')
      console.log('  --- content (first 300 chars) ---')
      console.log(text.slice(0, 300))
      console.log('  --- end ---')
    } else {
      const result = await mammoth.extractRawText({ buffer: buf })
      console.log('  --- docx text (first 300 chars) ---')
      console.log(result.value.slice(0, 300))
      console.log('  --- end ---')
    }
    return { ok: true, meta }
  } catch (err) {
    console.error('  FAILED:', err.message)
    return { ok: false, err }
  }
}

const allFiles = ['01-intro.txt', '02-spec.txt', '03-faq.txt', '04-overview.docx', '05-conclusion.docx']
  .map((n) => path.join(TEST_FILES, n))

// 測試 1：全部 5 個檔案合併為 docx（兩個換行）
const r1 = await testCase('test1: 全部 5 檔 → docx (newline)', allFiles, { separator: 'newline', outputFormat: 'docx' })

// 測試 2：全部 5 個檔案合併為 txt（兩個換行）
const r2 = await testCase('test2: 全部 5 檔 → txt (newline)', allFiles, { separator: 'newline', outputFormat: 'txt' })

// 測試 3：分頁符
const r3 = await testCase('test3: 全部 5 檔 → docx (page)', allFiles, { separator: 'page', outputFormat: 'docx' })

// 測試 4：自訂分隔符
const r4 = await testCase('test4: 全部 5 檔 → txt (custom ===END===)', allFiles, { separator: 'custom', customSeparator: '===END===\n', outputFormat: 'txt' })

// 測試 5：只有 docx
const r5 = await testCase('test5: 2 個 docx → docx', [path.join(TEST_FILES, '04-overview.docx'), path.join(TEST_FILES, '05-conclusion.docx')], { outputFormat: 'docx' })

// 測試 6：只有 txt
const r6 = await testCase('test6: 3 個 txt → txt', ['01-intro.txt', '02-spec.txt', '03-faq.txt'].map((n) => path.join(TEST_FILES, n)), { outputFormat: 'txt' })

// 測試 7：超限（51 個）應該失敗
try {
  const tooMany = Array(51).fill(path.join(TEST_FILES, '01-intro.txt'))
  await testCase('test7: 51 個檔（應失敗）', tooMany, { outputFormat: 'txt' })
} catch (e) {
  console.log('\n=== test7 51 個檔（應失敗）===')
  console.log('  ✓ 正確失敗:', e.message.slice(0, 100))
}

console.log('\n========================================')
const all = [r1, r2, r3, r4, r5, r6]
const passed = all.filter((r) => r.ok).length
console.log(`總計: ${passed}/${all.length} 通過`)
if (passed < all.length) process.exit(1)
