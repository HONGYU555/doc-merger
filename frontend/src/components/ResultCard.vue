<script setup lang="ts">
import { computed } from 'vue'
import type { MergeResponse } from '../api/merge'

const props = defineProps<{ result: MergeResponse }>()

const downloadUrl = computed(() => `/api/download/${props.result.id}`)
const fmtSize = (b: number) => {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}
</script>

<template>
  <el-card class="section-card result-card" shadow="never">
    <template #header>
      <div class="section-header">
        <span>④ 下載結果</span>
        <el-tag type="success" size="small">完成</el-tag>
      </div>
    </template>
    <p>合併完成，共 {{ result.fileCount }} 個檔案，輸出大小：<strong>{{ fmtSize(result.size) }}</strong></p>
    <a :href="downloadUrl" :download="result.filename" class="download-btn">
      <el-button type="primary" size="large">
        ⬇ 下載 {{ result.filename }}
      </el-button>
    </a>
  </el-card>
</template>

<style scoped>
.section-card { margin-bottom: 24px; border-radius: var(--radius-lg); }
.section-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
.result-card { border: 2px solid var(--color-success); }
.download-btn { text-decoration: none; }
</style>
