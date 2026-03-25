<!-- 知识库 API 测试页面 -->
<template>
  <div class="api-test-page">
    <h2>知识库 API 测试</h2>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>1. 获取文档列表</span>
          <el-button type="primary" size="small" @click="testGetDocuments">
            测试
          </el-button>
        </div>
      </template>
      <div class="test-result">
        <pre>{{ documentListResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>2. 获取文档详情 (ID: {{ testDocId }})</span>
          <div>
            <el-input-number v-model="testDocId" :min="1" size="small" style="width: 120px; margin-right: 10px;" />
            <el-button type="primary" size="small" @click="testGetDocumentDetail">
              测试
            </el-button>
          </div>
        </div>
      </template>
      <div class="test-result">
        <pre>{{ documentDetailResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>3. 上传文档</span>
          <el-upload
            action="#"
            :http-request="testUploadDocument"
            :show-file-list="false"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          >
            <el-button type="primary" size="small">
              选择文件并上传
            </el-button>
          </el-upload>
        </div>
      </template>
      <div class="test-result">
        <pre>{{ uploadResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>4. 搜索文档</span>
          <div>
            <el-input 
              v-model="searchQuery" 
              placeholder="输入搜索关键词" 
              size="small"
              style="width: 200px; margin-right: 10px;"
            />
            <el-select v-model="searchType" size="small" style="width: 120px; margin-right: 10px;">
              <el-option label="混合搜索" value="hybrid" />
              <el-option label="关键词搜索" value="keyword" />
              <el-option label="语义搜索" value="vector" />
            </el-select>
            <el-button type="primary" size="small" @click="testSearch">
              测试
            </el-button>
          </div>
        </div>
      </template>
      <div class="test-result">
        <pre>{{ searchResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>5. 删除文档 (ID: {{ deleteDocId }})</span>
          <div>
            <el-input-number v-model="deleteDocId" :min="1" size="small" style="width: 120px; margin-right: 10px;" />
            <el-button type="danger" size="small" @click="testDeleteDocument">
              测试删除
            </el-button>
          </div>
        </div>
      </template>
      <div class="test-result">
        <pre>{{ deleteResult }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDocumentList,
  getDocumentDetail,
  uploadDocument,
  searchDocuments,
  deleteDocument
} from '@/api/knowledge'

// 测试结果
const documentListResult = ref('点击测试按钮查看结果')
const documentDetailResult = ref('')
const uploadResult = ref('')
const searchResult = ref('')
const deleteResult = ref('')

// 测试参数
const testDocId = ref(1)
const searchQuery = ref('')
const searchType = ref('hybrid')
const deleteDocId = ref(1)

// 测试获取文档列表
const testGetDocuments = async () => {
  try {
    documentListResult.value = '加载中...'
    const response = await getDocumentList()
    documentListResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('获取文档列表成功')
  } catch (error) {
    documentListResult.value = `错误：${error.message}`
    ElMessage.error(`获取失败：${error.message}`)
  }
}

// 测试获取文档详情
const testGetDocumentDetail = async () => {
  try {
    documentDetailResult.value = '加载中...'
    const response = await getDocumentDetail(testDocId.value)
    documentDetailResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('获取文档详情成功')
  } catch (error) {
    documentDetailResult.value = `错误：${error.message}`
    ElMessage.error(`获取失败：${error.message}`)
  }
}

// 测试上传文档
const testUploadDocument = async (options) => {
  const { file } = options
  try {
    uploadResult.value = '上传中...'
    const response = await uploadDocument(file)
    uploadResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('上传成功')
  } catch (error) {
    uploadResult.value = `错误：${error.message}`
    ElMessage.error(`上传失败：${error.message}`)
  }
}

// 测试搜索
const testSearch = async () => {
  try {
    searchResult.value = '搜索中...'
    const response = await searchDocuments(searchQuery.value, searchType.value, 10)
    searchResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('搜索成功')
  } catch (error) {
    searchResult.value = `错误：${error.message}`
    ElMessage.error(`搜索失败：${error.message}`)
  }
}

// 测试删除文档
const testDeleteDocument = async () => {
  try {
    deleteResult.value = '删除中...'
    await deleteDocument(deleteDocId.value)
    deleteResult.value = '删除成功'
    ElMessage.success('删除成功')
  } catch (error) {
    deleteResult.value = `错误：${error.message}`
    ElMessage.error(`删除失败：${error.message}`)
  }
}
</script>

<style scoped>
.api-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.api-test-page h2 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-result {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.test-result pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
