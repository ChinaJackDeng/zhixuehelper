<!-- src/views/knowledge/components/KnowledgeCard.vue -->
<template>
  <el-card
      class="knowledge-card"
      :class="{ 'is-selected': selected }"
      :shadow="hovering ? 'hover' : 'never'"
      :body-style="{ padding: '3.5px' }"
      @click="$emit('click')"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
  >
    <!-- 文件类型图标 -->
    <div class="file-type-icon">
      <img :src="getFileIcon(document.type)" :alt="document.type" class="file-icon" />
    </div>

    <!-- 文件信息 -->
    <div class="file-info">
      <el-tooltip 
        :content="getFullFileName()" 
        placement="top" 
        :show-after="300"
      >
        <h4 class="file-name" :class="{ 'is-expanded': hovering }">
          {{ getFullFileName() }}
        </h4>
      </el-tooltip>
      <div class="file-meta">
        <span class="meta-item">
          {{ formatDate(document.createTime) }}
        </span>
        <span class="meta-item">
          {{ formatFileSize(document.file_size) }}
        </span>
      </div>
    </div>

    <!-- 删除按钮 -->
    <el-button
        v-show="hovering"
        class="delete-button"
        type="danger"
        :icon="Close"
        circle
        size="small"
        @click.stop="$emit('delete')"
    />

    <!-- 选中标记 -->
    <div class="selection-indicator" v-if="selected">
      <el-icon color="#409EFF"><Select /></el-icon>
    </div>
  </el-card>
</template>

<script>
import { ref } from 'vue'
import {
  Select,
  Close
} from '@element-plus/icons-vue'
import textIcon from '@/assets/icons/TEXT.png'
import pdfIcon from '@/assets/icons/PDF.png'
import docxIcon from '@/assets/icons/docx.png'
import imageIcon from '@/assets/icons/image.png'

export default {
  name: 'KnowledgeCard',
  computed: {
    Close() {
      return Close
    }
  },

  props: {
    document: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },

  emits: ['click', 'delete'],

  setup(props) {
    const hovering = ref(false)

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }

    const getFileIcon = (type) => {
      const iconMap = {
        'text': textIcon,
        'pdf': pdfIcon,
        'doc': docxIcon,
        'docx': docxIcon,
        'image': imageIcon
      }
      return iconMap[type] || textIcon
    }

    const getFileExtension = (type) => {
      const extMap = {
        'text': '.txt',
        'pdf': '.pdf',
        'doc': '.doc',
        'docx': '.docx',
        'image': '.jpg'
      }
      return extMap[type] || ''
    }

    const getFullFileName = () => {
      const title = props.document.title || ''
      const ext = getFileExtension(props.document.type)
      if (title.endsWith(ext)) {
        return title
      }
      return title + ext
    }

    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    return {
      hovering,
      formatDate,
      getFileIcon,
      getFileExtension,
      getFullFileName,
      formatFileSize,
      Select
    }
  }
}
</script>

<style scoped>
.knowledge-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 150px;
  height: 180px;
  padding: 0;
  position: relative;
  overflow: visible;
  background: transparent;
  box-shadow: none;
}

.knowledge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
  border-color: #409eff;
  z-index: 100;
}

.knowledge-card.is-selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
}

.file-type-icon {
  width: 140px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.file-icon {
  width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.file-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 6px 0;
}

.file-name {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 130px;
  transition: all 0.2s ease;
  max-width: 130px;
  text-align: center;
  padding: 0 5px;
}

.file-name.is-expanded {
  white-space: normal;
  text-overflow: clip;
  overflow: visible;
  max-height: 50px;
  word-break: break-word;
  max-width: 150px;
  line-height: 1.3;
  font-size: 14px;
}

.file-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 14.5px;
  color: #666;
  width: 100%;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  width: 100%;
  justify-content: center;
}

.delete-button {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0.8;
  transition: opacity 0.2s;
  z-index: 10;
}

.delete-button:hover {
  opacity: 1;
}

.selection-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #409eff;
  background: white;
  border-radius: 50%;
  padding: 4px;
  animation: pulse 2s infinite;
  z-index: 10;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@media (max-width: 480px) {
  .knowledge-card {
    width: 120px;
    height: 150px;
  }

  .file-type-icon {
    width: 110px;
    height: 90px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 11px;
  }
}
</style>
