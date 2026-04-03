<!-- src/views/knowledge/components/KnowledgeCard.vue -->
<template>
  <el-card
      class="knowledge-card"
      :class="{ 'is-selected': selected }"
      :shadow="hovering ? 'hover' : 'never'"
      :body-style="{ padding: '0px' }"
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
      <el-tooltip :content="getFullFileName()" placement="top" :show-after="300">
        <h4 class="file-name">
          {{ getTruncatedFileName() }}
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

    const getTruncatedFileName = () => {
      const fileName = getFullFileName()
      if (fileName.length <= 8) {
        return fileName
      }
      return fileName.substring(0, 8) + '...'
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
      getTruncatedFileName,
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
  border: 1px solid #e4ebf5;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 130px;
  padding: 4px 2px;
  position: relative;
  overflow: hidden;
  background: transparent;
  box-shadow: none;
  margin: 0;
}

.knowledge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(44, 77, 132, 0.14) !important;
  border-color: #409eff;
  z-index: 100;
}

.knowledge-card.is-selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
}

.file-type-icon {
  width: 74px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
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
  gap: 0px;
  text-align: center;
  padding: 0px;
}

.file-name {
  margin: 0;
  color: #333;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  transition: all 0.2s ease;
  max-width: 96px;
  text-align: center;
  padding: 0 2px;
}

.file-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  font-size: 11px;
  color: #556277;
  width: 100%;
  line-height: 1.2;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0px;
  white-space: nowrap;
  width: 100%;
  justify-content: center;
}

.delete-button {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0.95;
  transition: all 0.2s ease;
  z-index: 10;
  background: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
  box-shadow: 0 3px 8px rgba(245, 108, 108, 0.45);
}

.delete-button:hover {
  opacity: 1;
  transform: scale(1.08);
  background: #ef4444;
  border-color: #ef4444;
}

.selection-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  color: #409eff;
  background: white;
  border-radius: 50%;
  padding: 3px;
  animation: pulse 2s infinite;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@media (max-width: 480px) {
  .knowledge-card {
    min-height: 120px;
  }

  .file-type-icon {
    width: 64px;
    height: 58px;
  }

  .file-name {
    font-size: 11px;
  }

  .file-meta {
    font-size: 11px;
  }
}
</style>
