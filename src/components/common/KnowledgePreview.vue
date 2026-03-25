<template>
  <div class="knowledge-preview">
    <div class="preview-header">
      <h3 class="preview-title">
        <el-icon><Document /></el-icon>
        {{ doc.name }}
      </h3>
      <div class="preview-tags">
        <el-tag
            v-for="tag in doc.tags"
            :key="tag"
            size="small"
            :style="getTagStyle(tag)"
            class="preview-tag"
        >
          {{ tag }}
          <el-icon
              class="tag-remove"
              @click.stop="emit('tag-remove', tag)"
          >
            <Close />
          </el-icon>
        </el-tag>
      </div>
    </div>

    <el-scrollbar class="preview-content">
      <div v-for="(chunk, idx) in doc.chunks" :key="chunk.id" class="chunk-block">
        <div class="chunk-index">#{{ idx + 1 }}</div>
        <p class="chunk-text">{{ chunk.content }}</p>
      </div>
    </el-scrollbar>

    <div class="preview-footer">
      <el-tag size="small" type="info">
        共 {{ doc.chunks?.length || 0 }} 个文本块 · 只读模式
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { useTagColor } from '@/composables/useTagColor'
import {Document} from "@element-plus/icons-vue";

// const props = defineProps({
//   doc: {
//     type: Object,
//     required: true
//     // { id, name, tags: [], chunks: [{id, content}] }
//   }
// })

const emit = defineEmits(['tag-remove'])

const { getTagColor } = useTagColor()

const getTagStyle = (tagName) => {
  const color = getTagColor(tagName)
  return {
    backgroundColor: color + '15',
    color: color,
    borderColor: color + '40'
  }
}
</script>

<style scoped>
.knowledge-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.preview-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color-light);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-tag {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-remove {
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  margin-left: 2px;
}

.tag-remove:hover {
  opacity: 1;
  color: var(--color-danger);
}

.preview-content {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  overflow-y: auto;
}

.chunk-block {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px dashed var(--border-color-light);
}

.chunk-block:last-child {
  border-bottom: none;
}

.chunk-index {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xxs);
}

.chunk-text {
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-regular);
  white-space: pre-wrap;
  margin: 0;
}

.preview-footer {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-hover);
}
</style>