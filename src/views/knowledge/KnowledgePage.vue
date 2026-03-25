<!-- KnowledgeBase.vue -->
<template>
  <div class="knowledge-base-page">
    <!-- 顶部操作栏 -->
    <div class="top-action-bar">
      <!-- 搜索区域 -->
      <div class="search-section">
        <el-select v-model="searchType" placeholder="搜索类型" size="default" style="width: 240px;">
          <el-option label="混合搜索" value="hybrid" />
          <el-option label="关键词搜索" value="keyword" />
          <el-option label="语义搜索" value="vector" />
        </el-select>
        <el-input
            v-model="searchKeyword"
            placeholder="搜索知识内容..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <el-upload
            class="upload-btn"
            action="#"
            :show-file-list="false"
            :http-request="handleFileUpload"
            :before-upload="beforeFileUpload"
            accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
        >
          <el-button type="primary" icon="Upload">上传文件</el-button>
        </el-upload>

        <el-button
            type="success"
            icon="DocumentAdd"
            @click="showPasteDialog = true"
        >
          粘贴文本
        </el-button>
      </div>
    </div>

    <!-- 标签筛选栏 -->
    <div class="tag-filter-section">
      <div class="section-header">
        <h4>知识标签</h4>
        <el-button
            type="primary"
            plain
            size="small"
            @click="showAddTagDialog = true"
        >
          + 新建标签
        </el-button>
      </div>

      <div class="tag-cloud">
        <el-scrollbar>
          <div class="tag-list">
            <el-tag
                v-for="tag in allTags"
                :key="tag.id"
                :type="getTagType(tag.id)"
                :closable="tag.createdBy === currentUser"
                :style="{
                backgroundColor: tag.color,
                color: getTextColor(tag.color)
              }"
                class="tag-item"
                @click="toggleTagSelection(tag.id)"
                @close="handleDeleteTag(tag.id)"
            >
              {{ tag.name }}
              <el-badge
                  v-if="tag.docCount"
                  :value="tag.docCount"
                  class="badge"
              />
            </el-tag>

            <!-- 全选/取消按钮 -->
            <el-tag
                :type="isAllSelected ? 'primary' : 'info'"
                class="tag-item all-tag"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-tag>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- 主要内容区：左右分栏 -->
    <div class="main-content-area">
      <!-- 左栏：知识文档列表 (70%) -->
      <div class="knowledge-list-panel" :style="{ width: selectedDoc ? '70%' : '100%' }">
        <div class="panel-header">
          <h3>知识文档</h3>
          <div class="stats">
            共 {{ filteredDocuments.length }} 个文档
            <span v-if="selectedTags.length > 0">
              （已选择 {{ selectedTags.length }} 个标签）
            </span>
          </div>
        </div>

        <!-- 文档卡片网格 -->
        <div class="documents-grid">
          <KnowledgeCard
              v-for="doc in filteredDocuments"
              :key="doc.id"
              :document="doc"
              :selected="selectedDoc?.id === doc.id"
              @click="selectDocument(doc)"
              @delete="confirmDeleteDocument(doc.id)"
              @tag-click="handleTagClick"
          />

          <!-- 空状态 -->
          <el-empty
              v-if="filteredDocuments.length === 0"
              description="暂无文档"
              :image-size="150"
          >
            <template #description>
              <p>没有找到符合条件的文档</p>
              <p>尝试上传文件或创建新文档</p>
            </template>
            <el-button type="primary" @click="showPasteDialog = true">
              创建第一个文档
            </el-button>
          </el-empty>
        </div>

        <!-- 分页器 -->
        <div class="pagination-container" v-if="totalDocsFromBackend > pageSize">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 36, 48]"
              :total="totalDocsFromBackend"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 右栏：文档详情面板 (30%) -->
      <div class="detail-panel">
        <div v-if="!selectedDoc" class="empty-detail">
          <el-empty description="请选择一个文档查看详情">
            <template #image>
              <el-icon :size="80" color="#909399">
                <Document />
              </el-icon>
            </template>
          </el-empty>
        </div>

        <div v-else>
          <div class="detail-header">
            <div class="doc-title-section">
              <h3 class="doc-title">{{ selectedDoc.title }}</h3>
              <div class="doc-meta">
                <span class="create-time">
                  <el-icon><Calendar /></el-icon>
                  创建于：{{ formatDateTime(selectedDoc.createTime) }}
                </span>
                <span class="update-time" v-if="selectedDoc.updateTime">
                  <el-icon><Refresh /></el-icon>
                  更新于：{{ formatDateTime(selectedDoc.updateTime) }}
                </span>
              </div>
            </div>

            <div class="doc-actions">
              <el-button
                  type="primary"
                  icon="MagicStick"
                  @click="handleGenerateFromDoc"
              >
                从此文档生成题目
              </el-button>
              <el-button
                  type="warning"
                  icon="Edit"
                  @click="editDocument(selectedDoc)"
              >
                编辑
              </el-button>
            </div>
          </div>

          <!-- 文档标签管理区 -->
          <div class="doc-tags-section">
            <div class="section-title">
              <span>文档标签</span>
              <el-button
                  type="text"
                  icon="Plus"
                  @click="showAddTagToDoc = true"
              >
                添加标签
              </el-button>
            </div>

            <div class="doc-tags-list">
              <el-tag
                  v-for="tag in selectedDoc.tags"
                  :key="tag.id"
                  :type="getTagType(tag.id)"
                  closable
                  :style="{
                  backgroundColor: tag.color,
                  color: getTextColor(tag.color)
                }"
                  @close="removeTagFromDoc(tag.id)"
                  @click="handleTagClick(tag.id)"
              >
                {{ tag.name }}
              </el-tag>

              <el-empty
                  v-if="selectedDoc.tags.length === 0"
                  description="暂无标签"
                  :image-size="50"
              />
            </div>
          </div>

          <!-- 自动标签推荐区 -->
          <div class="doc-auto-tags-section" v-if="autoKeywords.length > 0">
            <div class="section-title">
              <span>
                <el-icon><Star /></el-icon>
                智能推荐标签
              </span>
              <el-button
                  type="text"
                  size="small"
                  @click="acceptAutoTags"
              >
                全部采纳
              </el-button>
            </div>
            <div class="doc-tags-list">
              <el-tag
                  v-for="(keyword, index) in autoKeywords"
                  :key="index"
                  type="info"
                  effect="plain"
                  class="auto-tag"
                  @click="addAutoTag(keyword)"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>

          <!-- 关键词展示区 -->
          <div class="doc-keywords-section" v-if="selectedDoc.keywords && selectedDoc.keywords.length > 0">
            <div class="section-title">
              <span><el-icon><Key /></el-icon> 关键词</span>
            </div>
            <div class="keywords-list">
              <el-tag
                  v-for="(keyword, index) in selectedDoc.keywords"
                  :key="index"
                  size="small"
                  type="info"
                  effect="plain"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>

          <!-- 文档内容显示区 -->
          <div class="doc-content-section">
            <div class="section-title">
              <span>文档内容</span>
              <div class="content-actions">
                <el-tooltip content="复制内容">
                  <el-button
                      icon="DocumentCopy"
                      text
                      @click="copyToClipboard(selectedDoc.content)"
                  />
                </el-tooltip>
                <el-tooltip content="导出为 TXT">
                  <el-button
                      icon="Download"
                      text
                      @click="exportAsTxt(selectedDoc)"
                  />
                </el-tooltip>
              </div>
            </div>

            <div class="content-display">
              <el-scrollbar>
                <!-- 文本内容显示 -->
                <div v-if="selectedDoc.type === 'text'" class="text-content">
                  <pre>{{ selectedDoc.content }}</pre>
                </div>

                <!-- PDF 预览 -->
                <div v-else-if="selectedDoc.type === 'pdf'" class="pdf-preview">
                  <iframe
                      :src="selectedDoc.fileUrl"
                      width="100%"
                      height="600"
                      frameborder="0"
                  />
                </div>

                <!-- 图片预览 -->
                <div v-else-if="selectedDoc.type === 'image'" class="image-preview">
                  <el-image
                      :src="selectedDoc.fileUrl"
                      :preview-src-list="[selectedDoc.fileUrl]"
                      fit="contain"
                      style="max-height: 400px;"
                  />
                </div>

                <!-- Word 文档预览 -->
                <div v-else-if="selectedDoc.type === 'word'" class="word-preview">
                  <p>Word 文档预览</p>
                  <el-button @click="downloadFile(selectedDoc)">
                    下载文档
                  </el-button>
                </div>
              </el-scrollbar>
            </div>
          </div>

          <!-- 文档统计信息 -->
          <div class="doc-stats-section">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="知识块数量">
                <el-tag type="info">{{ selectedDoc.chunkCount || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="文件大小">
                {{ formatFileSize(selectedDoc.size) }}
              </el-descriptions-item>
              <el-descriptions-item label="创建者">
                {{ selectedDoc.creator?.name || '您' }}
              </el-descriptions-item>
              <el-descriptions-item label="最后访问">
                {{ formatRelativeTime(selectedDoc.lastAccessed) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </div>

    <!-- 粘贴文本对话框 -->
    <el-dialog
        v-model="showPasteDialog"
        title="创建文本文档"
        width="900px"
        destroy-on-close
        class="paste-dialog"
    >
      <el-form
          ref="pasteFormRef"
          :model="pasteForm"
          :rules="pasteRules"
          label-width="100px"
          label-position="top"
      >
        <el-form-item label="文档标题" prop="title">
          <el-input
              v-model="pasteForm.title"
              placeholder="请输入文档标题"
              maxlength="100"
              show-word-limit
              size="large"
          />
        </el-form-item>

        <el-form-item label="文档内容" prop="content">
          <el-input
              v-model="pasteForm.content"
              type="textarea"
              :rows="12"
              placeholder="请粘贴文本内容..."
              maxlength="10000"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasteDialog = false">取消</el-button>
          <el-button type="primary" @click="createTextDocument">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新建标签对话框 -->
    <el-dialog
        v-model="showAddTagDialog"
        title="新建标签"
        width="400px"
    >
      <el-form :model="newTagForm" label-width="80px">
        <el-form-item label="标签名称">
          <el-input v-model="newTagForm.name" placeholder="输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="newTagForm.color" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddTagDialog = false">取消</el-button>
        <el-button type="primary" @click="createTag">创建</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
        v-model="showDeleteConfirm"
        title="确认删除"
        width="400px"
        destroy-on-close
    >
      <p>确定要删除文档 "{{ docToDelete?.title }}" 吗？</p>
      <p style="color: var(--el-color-warning);">删除后将无法恢复！</p>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirm = false">取消</el-button>
          <el-button type="danger" @click="deleteDocument">确定删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Calendar, Refresh, Star, Key, Document } from '@element-plus/icons-vue'
import KnowledgeCard from '@/components/common/KnowledgeCard.vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getDocuments,
  createTextDoc,
  uploadFile,
  deleteDoc,
  getDocDetail,
  getKeywords
} from '@/api/knowledge'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

const searchType = ref('hybrid')
const searchKeyword = ref('')
const selectedTags = ref([])
const selectedDoc = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalDocsFromBackend = ref(0)
const autoKeywords = ref([])

const showPasteDialog = ref(false)
const showAddTagDialog = ref(false)
const showAddTagToDoc = ref(false)
const showDeleteConfirm = ref(false)
const docToDelete = ref(null)

const pasteFormRef = ref(null)
const pasteForm = ref({
  title: '',
  content: ''
})

const pasteRules = {
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文档内容', trigger: 'blur' }]
}

const newTagForm = ref({
  name: '',
  color: '#409EFF'
})

const allTags = ref([
  { id: 1, name: '重要', color: '#F56C6C', docCount: 5, createdBy: 'user' },
  { id: 2, name: '技术', color: '#409EFF', docCount: 12, createdBy: 'user' },
  { id: 3, name: '教程', color: '#67C23A', docCount: 8, createdBy: 'user' }
])

const currentUser = ref('user')

const filteredDocuments = computed(() => {
  const documents = store.state.knowledge.documents || []
  if (!Array.isArray(documents)) {
    return []
  }

  let result = documents

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(doc =>
      doc.title?.toLowerCase().includes(keyword) ||
      doc.content?.toLowerCase().includes(keyword)
    )
  }

  if (selectedTags.value.length > 0) {
    result = result.filter(doc =>
      doc.tags?.some(tag => selectedTags.value.includes(tag.id))
    )
  }

  return result
})

const isAllSelected = computed(() => {
  return selectedTags.value.length === allTags.value.length
})

const loadDocuments = async () => {
  try {
    const response = await getDocuments({
      page: currentPage.value,
      page_size: pageSize.value
    })

    const responseData = response.data || response
    if (responseData.documents && Array.isArray(responseData.documents)) {
      const formattedDocs = responseData.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.file_type || 'text',
        createTime: doc.created_at,
        updateTime: doc.updated_at,
        file_size: doc.file_size,
        size: doc.file_size,
        chunkCount: doc.chunk_count,
        accessCount: doc.access_count,
        lastAccessed: doc.last_accessed,
        status: doc.status,
        tags: [],
        keywords: [],
        content: ''
      }))

      store.commit('knowledge/SET_DOCUMENTS', formattedDocs)
      totalDocsFromBackend.value = responseData.total || 0
    }
  } catch (error) {
    console.error('加载文档失败:', error)
    ElMessage.error('加载文档失败: ' + error.message)
  }
}

const handleSearch = () => {
  loadDocuments()
}

const handleFileUpload = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)

  try {
    await uploadFile(formData)
    ElMessage.success('文件上传成功')
    loadDocuments()
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

const beforeFileUpload = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]

  const isAllowed = allowedTypes.includes(file.type)
  if (!isAllowed) {
    ElMessage.error('不支持的文件格式')
  }
  return isAllowed
}

const createTextDocument = async () => {
  if (!pasteFormRef.value) return

  await pasteFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createTextDoc({
          title: pasteForm.value.title,
          content: pasteForm.value.content
        })
        ElMessage.success('文档创建成功')
        showPasteDialog.value = false
        pasteForm.value = { title: '', content: '' }
        loadDocuments()
      } catch (error) {
        ElMessage.error('创建失败: ' + error.message)
      }
    }
  })
}

const selectDocument = async (doc) => {
  try {
    const response = await getDocDetail(doc.id)
    const detail = response.data || response
    selectedDoc.value = {
      ...doc,
      content: detail.content || '暂无内容',
      tags: detail.tags || [],
      keywords: detail.keywords || []
    }

    if (detail.id) {
      try {
        const keywordsRes = await getKeywords(detail.id)
        autoKeywords.value = keywordsRes.data?.keywords || keywordsRes.keywords || []
      } catch (error) {
        console.error('获取关键词失败:', error)
        autoKeywords.value = []
      }
    }
  } catch (error) {
    ElMessage.error('加载文档详情失败')
  }
}

const confirmDeleteDocument = (docId) => {
  docToDelete.value = filteredDocuments.value.find(d => d.id === docId)
  showDeleteConfirm.value = true
}

const deleteDocument = async () => {
  if (!docToDelete.value) return

  try {
    await deleteDoc(docToDelete.value.id)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    docToDelete.value = null
    if (selectedDoc.value?.id === docToDelete.value?.id) {
      selectedDoc.value = null
    }
    loadDocuments()
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  }
}

const toggleTagSelection = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedTags.value = []
  } else {
    selectedTags.value = allTags.value.map(tag => tag.id)
  }
}

const handleTagClick = (tagId) => {
  toggleTagSelection(tagId)
}

const createTag = () => {
  if (!newTagForm.value.name) {
    ElMessage.warning('请输入标签名称')
    return
  }

  const newTag = {
    id: Date.now(),
    name: newTagForm.value.name,
    color: newTagForm.value.color,
    docCount: 0,
    createdBy: currentUser.value
  }

  allTags.value.push(newTag)
  showAddTagDialog.value = false
  newTagForm.value = { name: '', color: '#409EFF' }
  ElMessage.success('标签创建成功')
}

const handleDeleteTag = (tagId) => {
  allTags.value = allTags.value.filter(tag => tag.id !== tagId)
  selectedTags.value = selectedTags.value.filter(id => id !== tagId)
  ElMessage.success('标签删除成功')
}

const removeTagFromDoc = (tagId) => {
  if (selectedDoc.value) {
    selectedDoc.value.tags = selectedDoc.value.tags.filter(tag => tag.id !== tagId)
    ElMessage.success('标签已移除')
  }
}

const addAutoTag = (keyword) => {
  if (selectedDoc.value) {
    const newTag = {
      id: Date.now(),
      name: keyword,
      color: '#909399',
      createdBy: currentUser.value
    }
    selectedDoc.value.tags.push(newTag)
    autoKeywords.value = autoKeywords.value.filter(k => k !== keyword)
    ElMessage.success('标签已添加')
  }
}

const acceptAutoTags = () => {
  if (selectedDoc.value) {
    autoKeywords.value.forEach(keyword => {
      const newTag = {
        id: Date.now() + Math.random(),
        name: keyword,
        color: '#909399',
        createdBy: currentUser.value
      }
      selectedDoc.value.tags.push(newTag)
    })
    autoKeywords.value = []
    ElMessage.success('已采纳所有推荐标签')
  }
}

const editDocument = () => {
  ElMessage.info('编辑功能开发中')
}

const handleGenerateFromDoc = () => {
  if (selectedDoc.value) {
    router.push({
      path: '/question-bank/generate',
      query: { docId: selectedDoc.value.id }
    })
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadDocuments()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadDocuments()
}

const getTagType = (tagId) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  return types[tagId % types.length]
}

const getTextColor = (bgColor) => {
  if (!bgColor) return '#ffffff'
  const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return '从未'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDateTime(dateString)
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const exportAsTxt = (doc) => {
  const blob = new Blob([doc.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.title}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadFile = (doc) => {
  if (doc.fileUrl) {
    const a = document.createElement('a')
    a.href = doc.fileUrl
    a.download = doc.title
    a.click()
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.knowledge-base-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.top-action-bar {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-section {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 800px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.tag-filter-section {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.tag-cloud {
  max-height: 120px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.badge {
  margin-left: 4px;
}

.all-tag {
  border-style: dashed;
}

.main-content-area {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.knowledge-list-panel {
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.stats {
  font-size: 14px;
  color: #909399;
}

.documents-grid {
  flex: 1;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  overflow-y: auto;
}

.pagination-container {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
}

.detail-panel {
  width: 30%;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-detail {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.doc-title-section {
  margin-bottom: 16px;
}

.doc-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}

.doc-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.create-time,
.update-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.doc-actions {
  display: flex;
  gap: 12px;
}

.doc-tags-section,
.doc-auto-tags-section,
.doc-keywords-section,
.doc-content-section,
.doc-stats-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.doc-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.auto-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.auto-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.content-display {
  max-height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
}

.text-content {
  padding: 16px;
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.pdf-preview,
.image-preview,
.word-preview {
  padding: 16px;
  text-align: center;
}

.paste-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}
</style>
