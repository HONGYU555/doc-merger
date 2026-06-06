<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  position: 'top-banner' | 'sidebar' | 'action-below' | 'footer'
  slotId?: string
}

const props = withDefaults(defineProps<Props>(), {
  slotId: '',
})

declare const __BAIDU_UNION_CPROID__: string

const cproid = __BAIDU_UNION_CPROID__
const enabled = computed(() => !!cproid && !!props.slotId)

const labels: Record<string, string> = {
  'top-banner': '顶部 banner',
  'sidebar': '侧栏',
  'action-below': '合并按钮下方',
  'footer': '页面底部',
}
const slotNumber: Record<string, number> = {
  'top-banner': 1,
  'sidebar': 2,
  'action-below': 3,
  'footer': 4,
}
</script>

<template>
  <div class="ad-slot" :class="`ad-${position}`" :data-position="position" :data-slot-id="slotId">
    <!--
      生产环境接线说明（已配置 cproid 时）：
      1. index.html 的 <head> 加载 c.js：<script src="//cpro.baidustatic.com/cpro/ui/c.js"></script>
      2. 把下面 v-if="!enabled" 那行换成：
         <div :id="`ad-real-${slotId}`" class="ad-real"></div>
      3. 在 main.ts 调用 BAIDU_CLB_fillSlot(`ad-real-${slotId}`) 渲染
    -->
    <span v-if="!enabled" class="ad-label">广告位 #{{ slotNumber[position] }} · {{ labels[position] }}</span>
    <div v-else class="ad-real" :id="`ad-real-${slotId}`"></div>
  </div>
</template>

<style scoped>
.ad-slot {
  background: #f0f0f0;
  border: 1px dashed #ccc;
  border-radius: 6px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  margin: 12px 0;
}
.ad-top-banner { min-height: 90px; }
.ad-sidebar { min-height: 250px; }
.ad-footer { min-height: 60px; }
.ad-real { width: 100%; min-height: inherit; }
</style>
