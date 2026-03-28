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
          <span>4. 语义检索（/knowledge/search/semantic）</span>
        </div>
      </template>
      <div class="search-form-row">
        <el-input
          v-model="semanticParams.query"
          placeholder="query（必填）"
          size="small"
          style="width: 220px;"
        />
        <el-input-number v-model="semanticParams.n_results" :min="1" :max="100" size="small" />
        <el-select v-model="semanticParams.file_type" size="small" style="width: 140px;">
          <el-option label="全部类型" value="" />
          <el-option label="text" value="text" />
          <el-option label="pdf" value="pdf" />
          <el-option label="doc" value="doc" />
          <el-option label="docx" value="docx" />
          <el-option label="image" value="image" />
        </el-select>
        <el-input-number
          v-model="semanticParams.score_threshold"
          :min="0"
          :max="1"
          :step="0.1"
          size="small"
        />
        <el-button type="primary" size="small" @click="testSemanticSearch">测试</el-button>
      </div>
      <div class="test-result">
        <pre>{{ semanticSearchResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>5. 关键词检索（/knowledge/search/keyword）</span>
        </div>
      </template>
      <div class="search-form-row">
        <el-input
          v-model="keywordParams.query"
          placeholder="query（必填）"
          size="small"
          style="width: 220px;"
        />
        <el-input-number v-model="keywordParams.n_results" :min="1" :max="100" size="small" />
        <el-select v-model="keywordParams.file_type" size="small" style="width: 140px;">
          <el-option label="全部类型" value="" />
          <el-option label="text" value="text" />
          <el-option label="pdf" value="pdf" />
          <el-option label="doc" value="doc" />
          <el-option label="docx" value="docx" />
          <el-option label="image" value="image" />
        </el-select>
        <el-button type="primary" size="small" @click="testKeywordSearch">测试</el-button>
      </div>
      <div class="test-result">
        <pre>{{ keywordSearchResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>6. 混合检索（/knowledge/search/hybrid）</span>
        </div>
      </template>
      <div class="search-form-row">
        <el-input
          v-model="hybridParams.query"
          placeholder="query（必填）"
          size="small"
          style="width: 220px;"
        />
        <el-input-number v-model="hybridParams.n_results" :min="1" :max="100" size="small" />
        <el-select v-model="hybridParams.file_type" size="small" style="width: 140px;">
          <el-option label="全部类型" value="" />
          <el-option label="text" value="text" />
          <el-option label="pdf" value="pdf" />
          <el-option label="doc" value="doc" />
          <el-option label="docx" value="docx" />
          <el-option label="image" value="image" />
        </el-select>
        <el-input-number
          v-model="hybridParams.semantic_weight"
          :min="0"
          :max="1"
          :step="0.1"
          size="small"
        />
        <el-input-number
          v-model="hybridParams.score_threshold"
          :min="0"
          :max="1"
          :step="0.1"
          size="small"
        />
        <el-button type="primary" size="small" @click="testHybridSearch">测试</el-button>
      </div>
      <div class="test-result">
        <pre>{{ hybridSearchResult }}</pre>
      </div>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>7. 删除文档 (ID: {{ deleteDocId }})</span>
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
const semanticSearchResult = ref('')
const keywordSearchResult = ref('')
const hybridSearchResult = ref('')
const deleteResult = ref('')

// 测试参数
const testDocId = ref(1)
const deleteDocId = ref(1)

const semanticParams = ref({
  query: '',
  n_results: 5,
  file_type: '',
  score_threshold: 0.0
})

const keywordParams = ref({
  query: '',
  n_results: 5,
  file_type: ''
})

const hybridParams = ref({
  query: '',
  n_results: 5,
  file_type: '',
  semantic_weight: 0.7,
  score_threshold: 0.0
})

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

// 测试语义检索
const testSemanticSearch = async () => {
  if (!semanticParams.value.query) {
    ElMessage.warning('请输入语义检索 query')
    return
  }
  try {
    semanticSearchResult.value = '搜索中...'
    const options = {}
    if (semanticParams.value.file_type) options.fileType = semanticParams.value.file_type
    options.scoreThreshold = semanticParams.value.score_threshold
    const response = await searchDocuments(
      semanticParams.value.query,
      'vector',
      semanticParams.value.n_results,
      options
    )
    semanticSearchResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('语义检索成功')
  } catch (error) {
    semanticSearchResult.value = `错误：${error.message}`
    ElMessage.error(`语义检索失败：${error.message}`)
  }
}

// 测试关键词检索
const testKeywordSearch = async () => {
  if (!keywordParams.value.query) {
    ElMessage.warning('请输入关键词检索 query')
    return
  }
  try {
    keywordSearchResult.value = '搜索中...'
    const options = {}
    if (keywordParams.value.file_type) options.fileType = keywordParams.value.file_type
    const response = await searchDocuments(
      keywordParams.value.query,
      'keyword',
      keywordParams.value.n_results,
      options
    )
    keywordSearchResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('关键词检索成功')
  } catch (error) {
    keywordSearchResult.value = `错误：${error.message}`
    ElMessage.error(`关键词检索失败：${error.message}`)
  }
}

// 测试混合检索
const testHybridSearch = async () => {
  if (!hybridParams.value.query) {
    ElMessage.warning('请输入混合检索 query')
    return
  }
  try {
    hybridSearchResult.value = '搜索中...'
    const options = {}
    if (hybridParams.value.file_type) options.fileType = hybridParams.value.file_type
    options.semanticWeight = hybridParams.value.semantic_weight
    options.scoreThreshold = hybridParams.value.score_threshold
    const response = await searchDocuments(
      hybridParams.value.query,
      'hybrid',
      hybridParams.value.n_results,
      options
    )
    hybridSearchResult.value = JSON.stringify(response, null, 2)
    ElMessage.success('混合检索成功')
  } catch (error) {
    hybridSearchResult.value = `错误：${error.message}`
    ElMessage.error(`混合检索失败：${error.message}`)
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

.search-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
</style>
