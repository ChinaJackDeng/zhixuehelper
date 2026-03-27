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

    <!-- 搜索结果信息 -->
    <div v-if="searchResults.total > 0" class="search-results-info">
      <el-alert
          :title="`通过${getSearchTypeName(searchResults.type)}检索，一共检索到 ${searchResults.total} 条结果`"
          type="info"
          :closable="false"
          show-icon
      />
    </div>

    <!-- 标签筛选栏 -->
    <div class="tag-filter-section">
      <div class="section-header">
        <h4>知识标签</h4>
        <el-button
            type="primary"
            plain
            size="medium"
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
                backgroundColor: '#e6f2ff',
                color: '#000000',
                border: '1px solid #1890ff'
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
      <!-- 左栏：知识文档列表 (60%) -->
      <div class="knowledge-list-panel" :style="{ width: selectedDoc ? '60%' : '100%' }">
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

      <!-- 右栏：文档详情面板 (40%) -->
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
          <!-- 文档头部信息区：标题、信息 -->
          <div class="doc-header-section">
            <!-- 文档标题 -->
            <div class="doc-title-container">
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

            <!-- 文档信息区 -->
            <div class="doc-info-container">
              <div class="doc-info-inline">
                <div class="info-item">
                  <span class="info-label">知识块数量：</span>
                  <span class="info-value">{{ selectedDoc.chunkCount || 0 }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">文件大小：</span>
                  <span class="info-value">{{ formatFileSize(selectedDoc.size) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最后访问：</span>
                  <span class="info-value">{{ formatRelativeTime(selectedDoc.lastAccessed) }}</span>
                </div>
              </div>

              <div class="doc-actions-button">
                <el-button
                    type="primary"
                    icon="MagicStick"
                    size="default"
                    @click="handleGenerateFromDoc"
                >
                  从此文档生成题目
                </el-button>
              </div>
            </div>
          </div>

          <!-- 文档标签区：显示在中间空行 -->
          <div class="doc-tags-section">
            <div class="tags-line">
              <el-tag
                  v-for="tag in selectedDoc.tags"
                  :key="tag.id"
                  closable
                  class="doc-tag-item"
                  :style="{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  border: `1px solid ${tag.color}40`
                }"
                  @close="removeTagFromDoc(tag.id)"
              >
                {{ tag.name }}
              </el-tag>
              
              <!-- 新增标签按钮 -->
              <el-button
                  type="primary"
                  link
                  size="small"
                  class="add-tag-btn"
                  @click="showAddTagToDocDialog = true"
              >
                + 添加标签
              </el-button>
            </div>
          </div>

          <!-- 推荐标签和关键词区 -->
          <div class="doc-metadata-section">
            <!-- 自动推荐标签区 -->
            <div class="info-section" v-if="autoKeywords.length > 0">
              <div class="info-section-title">
                <el-icon><Star /></el-icon>
                <span>推荐标签</span>
              </div>
              <div class="tags-group">
                <el-tag
                    v-for="(keyword, index) in autoKeywords"
                    :key="index"
                    type="info"
                    effect="plain"
                    class="auto-tag"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>

            <!-- 关键词展示区 -->
            <div class="info-section" v-if="selectedDoc.keywords && selectedDoc.keywords.length > 0">
              <div class="info-section-title">
                <el-icon><Key /></el-icon>
                <span>关键词</span>
              </div>
              <div class="tags-group">
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
                <!-- Markdown 内容显示 -->
                <div class="markdown-content" v-html="renderedMarkdown"></div>
              </el-scrollbar>
            </div>
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
  getDocumentList,
  createTextDocument as createTextDocApi,
  uploadDocument,
  deleteDocument as deleteDocApi,
  getDocumentDetail,
  getDocumentKeywords,
  searchDocuments
} from '@/api/knowledge'
import { useStore } from 'vuex'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// 配置 marked 使用 highlight.js 进行代码高亮
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return code
  }
})

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
const showAddTagToDocDialog = ref(false)
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
  name: ''
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

  // 只有在非搜索状态下才进行前端过滤
  if (!searchKeyword.value) {
    if (selectedTags.value.length > 0) {
      result = result.filter(doc =>
        doc.tags?.some(tag => selectedTags.value.includes(tag.id))
      )
    }
  }

  return result
})

const isAllSelected = computed(() => {
  return selectedTags.value.length === allTags.value.length
})

const renderedMarkdown = computed(() => {
  if (!selectedDoc.value?.content) return ''
  return marked(selectedDoc.value.content)
})

const loadDocuments = async () => {
  try {
    const response = await getDocumentList({
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

const searchResults = ref({
  total: 0,
  type: '',
  keyword: ''
})

const isSearching = ref(false)

const handleSearch = async () => {
  if (!searchKeyword.value) {
    searchResults.value = {
      total: 0,
      type: '',
      keyword: ''
    }
    loadDocuments()
    return
  }

  isSearching.value = true
  try {
    console.log('开始搜索:', searchKeyword.value, '类型:', searchType.value)
    const response = await searchDocuments(searchKeyword.value, searchType.value, 100)
    const responseData = response.data || response
    
    console.log('搜索响应数据:', responseData)
    console.log('响应数据类型:', typeof responseData)
    console.log('是否包含documents:', 'documents' in responseData)
    
    if (responseData.documents && Array.isArray(responseData.documents)) {
      console.log('搜索结果数量:', responseData.documents.length)
      console.log('搜索结果:', responseData.documents)
      
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

      console.log('格式化后的文档:', formattedDocs)
      store.commit('knowledge/SET_DOCUMENTS', formattedDocs)
      searchResults.value = {
        total: formattedDocs.length,
        type: searchType.value,
        keyword: searchKeyword.value
      }
      console.log('搜索结果状态:', searchResults.value)
    } else {
      console.log('无搜索结果')
      store.commit('knowledge/SET_DOCUMENTS', [])
      searchResults.value = {
        total: 0,
        type: searchType.value,
        keyword: searchKeyword.value
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败: ' + error.message)
    store.commit('knowledge/SET_DOCUMENTS', [])
    searchResults.value = {
      total: 0,
      type: searchType.value,
      keyword: searchKeyword.value
    }
  } finally {
    isSearching.value = false
  }
}

const handleFileUpload = async (options) => {
  try {
    await uploadDocument(options.file, options.file.name)
    ElMessage.success('文件上传成功')
    loadDocuments()
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

const beforeFileUpload = (file) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
  ]

  // 允许的文件扩展名（作为备选验证）
  const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

  // 获取文件扩展名
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

  // 验证文件类型或扩展名
  const isAllowedType = allowedTypes.includes(file.type)
  const isAllowedExtension = allowedExtensions.includes(fileExtension)

  if (!isAllowedType && !isAllowedExtension) {
    ElMessage.error('不支持的文件格式，请上传 PDF、TXT、DOC、DOCX 或图片文件')
    return false
  }
  return true
}

const createTextDocument = async () => {
  if (!pasteFormRef.value) return

  await pasteFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createTextDocApi({
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
    const response = await getDocumentDetail(doc.id)
    const detail = response.data || response
    selectedDoc.value = {
      ...doc,
      content: detail.content || '暂无内容',
      tags: detail.tags || [],
      keywords: detail.keywords || [],
      fileUrl: detail.fileUrl || doc.fileUrl || ''
    }

    if (detail.id) {
      try {
        const keywordsRes = await getDocumentKeywords(detail.id)
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
    await deleteDocApi(docToDelete.value.id)
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
    color: '#1890ff',
    docCount: 0,
    createdBy: currentUser.value
  }

  allTags.value.push(newTag)
  showAddTagDialog.value = false
  newTagForm.value = { name: '' }
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





const handleGenerateFromDoc = () => {
  if (selectedDoc.value) {
    router.push({
      path: '/question-bank/generate',
      query: {
        docId: selectedDoc.value.id,
        docTitle: selectedDoc.value.title
      }
    })
  }
}

const getSearchTypeName = (type) => {
  const typeMap = {
    'hybrid': '混合',
    'keyword': '关键词',
    'vector': '语义'
  }
  return typeMap[type] || type
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
  max-height: 150px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  padding: 6px 12px;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.badge {
  margin-left: 6px;
  font-size: 12px;
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

/* 搜索结果信息 */
.search-results-info {
  padding: 0 20px 16px;
}

.search-results-info .el-alert {
  margin: 0;
  border-radius: 4px;
}

.documents-grid {
  flex: 1;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px 36px;
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

.detail-panel {
  width: 40%;
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

.detail-panel > div {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.detail-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.doc-title-section {
  margin-bottom: 16px;
}

.doc-title {
  margin: 0 0 8px 0;
  font-size: 16px;
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

.detail-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.doc-title-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 文档头部信息区：标题、标签、信息上下结构 */
.doc-header-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-title-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-info-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.doc-info-inline {
  flex: 1;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.info-label {
  color: #909399;
  font-weight: 500;
}

.info-value {
  color: #606266;
  font-weight: 500;
}

.doc-actions-button {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

/* 文档标签区：显示在文档信息和内容之间 */
.doc-tags-section {
  padding: 8px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fafafa;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.tags-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.doc-tag-item {
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  padding: 4px 8px;
}

.doc-tag-item:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

.add-tag-btn {
  font-size: 13px !important;
}

/* 文档元数据区：推荐标签和关键词 */
.doc-metadata-section {
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 文档信息卡片区 */
.doc-info-card {
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-section-title :deep(.el-icon) {
  font-size: 12px;
  color: #909399;
}

.tags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.doc-content-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex: 7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.doc-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  overflow: auto;
}

.markdown-content {
  padding: 20px;
  line-height: 1.8;
  color: #333;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 标题样式 */
.markdown-content h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 24px 0 12px 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
  color: #1a1a1a;
}

.markdown-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 20px 0 10px 0;
  color: #1a1a1a;
}

.markdown-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: #2c2c2c;
}

.markdown-content h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 6px 0;
  color: #2c2c2c;
}

.markdown-content h5 {
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0 4px 0;
}

.markdown-content h6 {
  font-size: 12px;
  font-weight: 600;
  margin: 8px 0 2px 0;
  color: #666;
}

/* 段落样式 */
.markdown-content p {
  margin: 12px 0;
  line-height: 1.8;
  font-size: 16px;
}

/* 列表样式 */
.markdown-content ul,
.markdown-content ol {
  margin: 12px 0;
  padding-left: 32px;
}

.markdown-content li {
  margin: 6px 0;
  line-height: 1.8;
  font-size: 16px;
}

/* 代码样式 */
.markdown-content code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
}

.markdown-content pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

/* 引用样式 */
.markdown-content blockquote {
  border-left: 4px solid #165dff;
  padding: 12px 0 12px 16px;
  margin: 12px 0;
  background: #f0f7ff;
  color: #666;
  font-style: italic;
  font-size: 16px;
}

/* 表格样式 */
.markdown-content table {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
  border: 1px solid #ddd;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  font-size: 16px;
}

.markdown-content th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.markdown-content tr:nth-child(even) {
  background: #fafafa;
}

/* 链接样式 */
.markdown-content a {
  color: #165dff;
  text-decoration: none;
  border-bottom: 1px solid #d0d0d0;
  transition: all 0.3s;
  font-size: 16px;
}

.markdown-content a:hover {
  color: #0d47a1;
  border-bottom-color: #165dff;
}

/* 水平线 */
.markdown-content hr {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 20px 0;
}

/* 图片样式 */
.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 12px 0;
}

.paste-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}
</style>
