<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ disabled: boolean; count: number; max: number }>()
const emit = defineEmits<{ add: [files: File[]] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function pick() {
  if (fileInput.value) fileInput.value.click()
}

function onChange(e: Event) {
  const t = e.target as HTMLInputElement
  if (!t.files) return
  emit('add', Array.from(t.files))
  t.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (!e.dataTransfer) return
  emit('add', Array.from(e.dataTransfer.files))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'is-dragging': isDragging, 'is-disabled': disabled }"
    @click="pick"
    @drop.prevent="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <div class="dropzone-icon">⬆</div>
    <div class="dropzone-text">
      <strong>{{ disabled ? `已達 ${max} 個上限` : '拖拽檔案到此處' }}</strong>
      <span v-if="!disabled">或 <u>點擊選擇檔案</u></span>
    </div>
    <small>單次最多 {{ max }} 個檔案，每檔 ≤ 10MB</small>
    <input
      ref="fileInput"
      type="file"
      accept=".docx,.txt"
      multiple
      hidden
      @change="onChange"
    />
  </div>
</template>
