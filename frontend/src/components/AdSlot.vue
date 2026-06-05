<script setup lang="ts">
defineProps<{ position: 'top-banner' | 'sidebar' | 'action-below' | 'footer' }>()

const labels: Record<string, string> = {
  'top-banner': '頂部 banner',
  'sidebar': '側欄',
  'action-below': '合併按鈕下方',
  'footer': '頁面底部',
}
const slotNumber: Record<string, number> = {
  'top-banner': 1,
  'sidebar': 2,
  'action-below': 3,
  'footer': 4,
}
</script>

<template>
  <div class="ad-slot" :class="`ad-${position}`" :data-position="position">
    <span class="ad-label">廣告位 #{{ slotNumber[position] }} · {{ labels[position] }}</span>
    <!-- 部署時替換為百度聯盟 script：
         <script src="//cpro.baidustatic.com/cpro/ui/cm.js" type="text/javascript"></script>
    -->
  </div>
</template>
