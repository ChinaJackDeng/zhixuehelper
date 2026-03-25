<template>
  <div class="search-toolbar">
    <div class="toolbar-left">
      <el-input
          v-model="keyword"
          placeholder="搜索知识库..."
          class="search-input"
          :prefix-icon="Search"
          clearable
          @keyup.enter="emit('search', keyword)"
      />
    </div>

    <div class="toolbar-right">
      <el-upload
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".txt,.md,.pdf,.doc,.docx"
      >
        <el-button :icon="Upload">上传文件</el-button>
      </el-upload>

      <el-button type="success" :icon="DocumentAdd" @click="emit('paste')">
        粘贴文本
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {DocumentAdd, Search, Upload} from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'upload', 'paste'])

const keyword = ref(props.modelValue)

const handleFileChange = (file) => {
  emit('upload', file)
  ElMessage.info(`准备上传: ${file.name}`)
}
</script>

<style scoped>
.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-md);
}

.toolbar-left {
  flex: 1;
  max-width: 500px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.toolbar-right {
  display: flex;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-md);
}

@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  .toolbar-right {
    margin-left: 0;
    justify-content: center;
  }
}
</style>