<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import Uploader from './components/Uploader.vue'
import FileListView from './components/FileListView.vue'
import MergeOptions from './components/MergeOptions.vue'
import ResultCard from './components/ResultCard.vue'
import AdSlot from './components/AdSlot.vue'
import { mergeFiles, type MergeResponse } from './api/merge'

interface FileItem {
  id: string
  file: File
  name: string
  ext: string
  size: number
}

const files = ref<FileItem[]>([])
const separator = ref<'newline' | 'page' | 'custom'>('newline')
const customSeparator = ref('')
const outputFormat = ref<'docx' | 'txt'>('docx')
const isMerging = ref(false)
const result = ref<MergeResponse | null>(null)

const MAX_FILES = 50
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXTS = ['.docx', '.txt']

const fileCount = computed(() => files.value.length)
const canMerge = computed(() => files.value.length > 0 && !isMerging.value)

// 站点配置
const ICP_NO = '粤ICP备2026071601号-1'
const ICP_LINK = 'https://beian.miit.gov.cn/'
const SITE_NAME = 'doc-merger'
const SITE_DOMAIN = 'doc.hongyuai.top'

function handleAdd(newFiles: File[]) {
  const remaining = MAX_FILES - files.value.length
  if (remaining <= 0) {
    ElMessage.warning(`最多只能上传 ${MAX_FILES} 个档案`)
    return
  }
  let added = 0
  let skipped = 0
  for (const f of newFiles) {
    if (added >= remaining) break
    const e = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!ACCEPTED_EXTS.includes(e)) {
      skipped++
      continue
    }
    if (f.size > MAX_FILE_SIZE) {
      ElMessage.warning(`档案 ${f.name} 超过 10MB 上限`)
      continue
    }
    files.value.push({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      ext: e,
      size: f.size,
    })
    added++
  }
  if (skipped > 0) {
    ElMessage.warning(`已跳过 ${skipped} 个不支援的档案（仅接受 .docx / .txt）`)
  }
}

function handleRemove(id: string) {
  files.value = files.value.filter((f) => f.id !== id)
}

function handleClearAll() {
  files.value = []
  result.value = null
}

function handleReorder(orderedIds: string[]) {
  files.value = orderedIds
    .map((id) => files.value.find((f) => f.id === id))
    .filter((f): f is FileItem => !!f)
}

async function handleMerge() {
  if (!canMerge.value) return
  isMerging.value = true
  result.value = null
  try {
    const fd = new FormData()
    files.value.forEach((f) => fd.append('files', f.file))
    fd.append('separator', separator.value)
    if (separator.value === 'custom') fd.append('customSeparator', customSeparator.value)
    fd.append('outputFormat', outputFormat.value)
    const res = await mergeFiles(fd)
    result.value = res
    ElNotification.success(`合并完成：${res.filename}`)
  } catch (err: any) {
    ElMessage.error(`合并失败：${err?.message || '未知错误'}`)
  } finally {
    isMerging.value = false
  }
}
</script>

<template>
  <!-- 广告位 #1：顶部 banner -->
  <AdSlot position="top-banner" slot-id="top-banner" />

  <header class="app-header">
    <div class="brand">
      <span class="brand-logo">📄</span>
      <div>
        <h1>{{ SITE_NAME }}</h1>
        <p class="brand-sub">Word / TXT 批次合并工具</p>
      </div>
    </div>
    <div class="header-stats">
      <span class="stat-pill">
        <span class="stat-num">{{ fileCount }}</span> / {{ MAX_FILES }} 个档案
      </span>
    </div>
  </header>

  <main class="app-main">
    <section class="workspace">
      <!-- 广告位 #2：侧栏 -->
      <AdSlot position="sidebar" slot-id="sidebar" />

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <span>① 上传档案</span>
            <small class="hint">支援 <code>.docx</code> 与 <code>.txt</code> 混合上传</small>
          </div>
        </template>
        <Uploader
          :disabled="fileCount >= MAX_FILES"
          :count="fileCount"
          :max="MAX_FILES"
          @add="handleAdd"
        />
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <span>② 排序档案（合并顺序）</span>
            <el-button
              v-if="files.length > 0"
              link
              type="primary"
              @click="handleClearAll"
            >清空全部</el-button>
          </div>
        </template>
        <FileListView
          :files="files"
          @remove="handleRemove"
          @reorder="handleReorder"
        />
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <span>③ 合并选项</span>
          </div>
        </template>
        <MergeOptions
          v-model:separator="separator"
          v-model:custom-separator="customSeparator"
          v-model:output-format="outputFormat"
        />
      </el-card>

      <div class="merge-zone">
        <el-button
          type="primary"
          size="large"
          :loading="isMerging"
          :disabled="!canMerge"
          @click="handleMerge"
          class="primary-btn"
        >
          {{ isMerging ? '合并中…' : '合并档案' }}
        </el-button>
        <p class="muted" v-if="files.length === 0">请先上传至少一个档案</p>
        <p class="muted" v-else>准备合并 {{ files.length }} 个档案</p>
      </div>

      <!-- 广告位 #3：合并按钮下方 -->
      <AdSlot position="action-below" slot-id="action-below" />

      <ResultCard v-if="result" :result="result" />
    </section>
  </main>

  <!-- 广告位 #4：页面底部 -->
  <AdSlot position="footer" slot-id="footer" />

  <footer class="app-footer">
    <p class="footer-line">
      <a :href="ICP_LINK" target="_blank" rel="noopener noreferrer">{{ ICP_NO }}</a>
    </p>
    <p class="footer-line">{{ SITE_NAME }} · 部署于 {{ SITE_DOMAIN }} · 广告由百度联盟提供</p>
  </footer>
</template>

<style scoped>
.section-card { margin-bottom: 24px; border-radius: var(--radius-lg); }
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.hint { font-size: 13px; color: var(--color-text-muted); font-weight: 400; }
.hint code {
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-primary);
}
.merge-zone { display: flex; flex-direction: column; align-items: center; margin: 32px 0; }
.primary-btn { min-width: 200px; }
.app-footer { text-align: center; padding: 24px 16px; color: #666; font-size: 13px; }
.footer-line { margin: 4px 0; }
.app-footer a { color: #666; text-decoration: none; }
.app-footer a:hover { color: #333; text-decoration: underline; }
</style>
