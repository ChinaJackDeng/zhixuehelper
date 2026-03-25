<template>
  <div class="tag-cloud">
    <div class="tag-list">
      <el-tag
          v-for="tag in tags"
          :key="tag.name"
          :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
          :effect="isSelected(tag.name) ? 'dark' : 'plain'"
          size="small"
          class="tag-item"
          @click="toggleSelect(tag.name)"
      >
        {{ tag.name }}
        <el-icon
            v-if="tag.editable && isSelected(tag.name)"
            class="tag-close"
            @click.stop="removeTag(tag.name)"
        >
          <Close />
        </el-icon>
      </el-tag>

      <!-- 添加标签按钮 -->
      <el-tag
          v-if="allowCreate"
          class="tag-add"
          size="small"
          @click="showCreateDialog = true"
      >
        <el-icon><Plus /></el-icon> 添加
      </el-tag>
    </div>

    <!-- 创建标签对话框 -->
    <el-dialog
        v-model="showCreateDialog"
        title="创建新标签"
        width="400px"
        append-to-body
    >
      <el-form :model="newTag" label-position="top">
        <el-form-item label="标签名称">
          <el-input v-model="newTag.name" placeholder="输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="newTag.color" :predefine="colorPresets" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
    // { name: string, color: string, editable: boolean }
  },
  selected: {
    type: Array,
    default: () => []
  },
  allowCreate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:selected', 'tag-create', 'tag-remove', 'tag-click'])

const showCreateDialog = ref(false)
const newTag = ref({ name: '', color: '#1a73e8' })
const colorPresets = [
  '#1a73e8', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
  '#409eff', '#626aef', '#8d90f5', '#b3b6f9', '#d9dbfc'
]

const isSelected = (tagName) => props.selected.includes(tagName)

const toggleSelect = (tagName) => {
  const newSelected = isSelected(tagName)
      ? props.selected.filter(t => t !== tagName)
      : [...props.selected, tagName]
  emit('update:selected', newSelected)
  emit('tag-click', tagName)
}

const removeTag = (tagName) => {
  emit('tag-remove', tagName)
  ElMessage.success(`已移除标签: ${tagName}`)
}

const confirmCreate = () => {
  if (!newTag.value.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  emit('tag-create', { ...newTag.value })
  showCreateDialog.value = false
  newTag.value = { name: '', color: '#1a73e8' }
  ElMessage.success('标签创建成功')
}
</script>

<style scoped>
.tag-cloud {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  align-items: center;
}

.tag-item {
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.tag-close {
  font-size: 12px;
  margin-left: 2px;
  cursor: pointer;
  opacity: 0.7;
}

.tag-close:hover {
  opacity: 1;
  color: var(--color-danger);
}

.tag-add {
  cursor: pointer;
  border-style: dashed !important;
}

.tag-add:hover {
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
}
</style>