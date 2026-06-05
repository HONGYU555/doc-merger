<script setup lang="ts">
interface FileItem {
  id: string
  file: File
  name: string
  ext: string
  size: number
}

const props = defineProps<{ files: FileItem[] }>()
const emit = defineEmits<{ remove: [id: string]; reorder: [orderedIds: string[]] }>()

const fmtSize = (b: number) => {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}
const icon = (e: string) => (e === '.docx' ? '📘' : '📄')

let dragSrcId: string | null = null

function onDragStart(e: DragEvent, id: string) {
  dragSrcId = id
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  ;(e.currentTarget as HTMLElement).classList.add('is-dragging')
}

function onDragEnd(e: DragEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('is-dragging')
  dragSrcId = null
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!dragSrcId) return
  const target = (e.currentTarget as HTMLElement).closest('.file-item') as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  const after = e.clientY > rect.top + rect.height / 2
  const srcEl = document.querySelector(`[data-id="${dragSrcId}"]`) as HTMLElement | null
  if (!srcEl) return
  if (after) target.parentElement?.insertBefore(srcEl, target.nextSibling)
  else target.parentElement?.insertBefore(srcEl, target)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!dragSrcId) return
  const ids = Array.from(document.querySelectorAll('.file-item')).map((el) => (el as HTMLElement).dataset.id!)
  emit('reorder', ids)
  dragSrcId = null
}
</script>

<template>
  <ul v-if="files.length > 0" class="file-list">
    <li
      v-for="(f, idx) in files"
      :key="f.id"
      class="file-item"
      :data-id="f.id"
      draggable="true"
      @dragstart="(e) => onDragStart(e, f.id)"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <span class="drag-handle" title="拖曳排序">⋮⋮</span>
      <span class="file-icon">{{ icon(f.ext) }}</span>
      <div class="file-info">
        <div class="file-name">{{ idx + 1 }}. {{ f.name }}</div>
        <div class="file-meta">{{ f.ext.toUpperCase() }} · {{ fmtSize(f.size) }}</div>
      </div>
      <button class="remove-btn" :data-id="f.id" title="移除" @click.stop="emit('remove', f.id)">✕</button>
    </li>
  </ul>
  <div v-else class="empty-state">
    <p>尚未選擇任何檔案</p>
  </div>
</template>
