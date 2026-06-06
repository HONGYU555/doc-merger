import fs from 'node:fs/promises'
import path from 'node:path'
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx'
import mammoth from 'mammoth'

export interface MergeInput {
  filePath: string
  originalName: string
}

export interface MergeOptions {
  separator: 'newline' | 'page' | 'custom'
  customSeparator: string
  outputFormat: 'docx' | 'txt'
}

interface ExtractedText {
  text: string
  source: 'txt' | 'docx'
}

async function readAsText(input: MergeInput): Promise<ExtractedText> {
  const ext = path.extname(input.originalName).toLowerCase()
  if (ext === '.txt') {
    const buf = await fs.readFile(input.filePath)
    return { text: decodeText(buf), source: 'txt' }
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: input.filePath })
    return { text: result.value.trim(), source: 'docx' }
  }
  throw new Error(`不支援的副檔名: ${ext}`)
}

function decodeText(buf: Buffer): string {
  // 簡單啟發式：嘗試 UTF-8，若有大量 replacement char 視為無效
  const utf8 = buf.toString('utf8')
  const replacementCount = (utf8.match(/\uFFFD/g) || []).length
  if (replacementCount / utf8.length < 0.01) return utf8
  // fallback: GBK（Node.js 標準庫不支援 gbk encoding，用 iconv-lite 風格的 Buffer 轉換）
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (buf as any).toString('gbk') as string
  } catch {
    return utf8
  }
}

function buildSeparator(opts: MergeOptions): string {
  if (opts.separator === 'page') return '\f\u0001PG\u0001' // 與純文字相容的分頁符
  if (opts.separator === 'custom') return opts.customSeparator
  return '\n\n' // 兩個換行
}

function getPageBreakParagraph(): Paragraph[] {
  return [new Paragraph({ children: [new PageBreak()] })]
}

function getSeparatorParagraphs(sep: string, format: 'docx' | 'txt'): Paragraph[] {
  if (sep.startsWith('\f')) {
    return format === 'docx' ? getPageBreakParagraph() : [new Paragraph({ children: [new TextRun('\f')] })]
  }
  // 自訂或換行
  return sep.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, break: 0 })],
      })
  )
}

/**
 * 合併檔案並輸出 Buffer
 */
export async function mergeFilesToBuffer(
  inputs: MergeInput[],
  options: MergeOptions
): Promise<{ buffer: Buffer; filename: string; ext: string }> {
  if (inputs.length === 0) throw new Error('至少需要一個檔案')
  const sep = buildSeparator(options)

  // 1) 將所有輸入抽成純文字
  const extracted = await Promise.all(inputs.map(readAsText))

  if (options.outputFormat === 'txt') {
    // 純文字輸出：分頁符用 \f 連接，其他用 sep
    const isPage = sep.startsWith('\f')
    const sepClean = isPage ? '\f' : sep
    const body = extracted.map((e) => e.text).join(sepClean)
    const buffer = Buffer.from(body, 'utf8')
    return { buffer, filename: 'merged.txt', ext: '.txt' }
  }

  // docx 輸出
  const children: Paragraph[] = []
  for (let i = 0; i < extracted.length; i++) {
    const t = extracted[i].text
    if (i > 0) {
      children.push(...getSeparatorParagraphs(sep, 'docx'))
    }
    for (const line of t.split('\n')) {
      children.push(new Paragraph({ children: [new TextRun(line)] }))
    }
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  const buffer = await Packer.toBuffer(doc)
  return { buffer, filename: 'merged.docx', ext: '.docx' }
}
