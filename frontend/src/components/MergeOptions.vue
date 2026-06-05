<script setup lang="ts">
const separator = defineModel<'newline' | 'page' | 'custom'>('separator', { required: true })
const customSeparator = defineModel<string>('customSeparator', { required: true })
const outputFormat = defineModel<'docx' | 'txt'>('outputFormat', { required: true })
</script>

<template>
  <el-form label-position="top">
    <el-form-item label="分隔符">
      <el-radio-group v-model="separator">
        <el-radio-button value="newline">兩個換行</el-radio-button>
        <el-radio-button value="page">分頁符</el-radio-button>
        <el-radio-button value="custom">自訂字串</el-radio-button>
      </el-radio-group>
      <el-input
        v-if="separator === 'custom'"
        v-model="customSeparator"
        placeholder="輸入自訂分隔字串…"
        style="margin-top: 12px"
        clearable
      />
    </el-form-item>
    <el-form-item label="輸出格式">
      <el-radio-group v-model="outputFormat">
        <el-radio-button value="docx">Word (.docx)</el-radio-button>
        <el-radio-button value="txt">TXT (.txt)</el-radio-button>
      </el-radio-group>
    </el-form-item>
  </el-form>
</template>
