<template>
  <div class="wrong-question-set-detail-page">
    <!-- 顶部操作栏 -->
    <div class="top-action-bar">
      <div class="header-left">
        <el-button circle @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="title-section">
          <h1 class="page-title">{{ setInfo.name }}</h1>
          <div class="set-meta">
            <el-tag :type="getSubjectType(setInfo.subject)" size="small" effect="plain" class="meta-tag">
              {{ getSubjectName(setInfo.subject) }}
            </el-tag>
            <span class="create-time">创建于 {{ formatDate(setInfo.createTime) }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-summary">
          <div class="stat-item">
            <span class="stat-value">{{ questions.length }}</span>
            <span class="stat-label">总错题</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ masteredCount }}</span>
            <span class="stat-label">已掌握</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错题列表容器 -->
    <div class="content-container">
      <div class="list-header">
        <div class="list-title">
          <el-icon><List /></el-icon>
          <span>题目列表</span>
        </div>
        <div class="list-filter">
          <el-radio-group v-model="filterStatus" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待强化</el-radio-button>
            <el-radio-button label="mastered">已掌握</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="pageLoading" class="questions-grid">
        <div v-for="idx in 8" :key="`skeleton-${idx}`" class="question-card skeleton-card">
          <el-skeleton animated>
            <template #template>
              <div style="padding: 16px">
                <el-skeleton-item variant="text" style="width: 30%; margin-bottom: 12px;" />
                <el-skeleton-item variant="h3" style="width: 100%; margin-bottom: 10px;" />
                <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 20px;" />
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <el-skeleton-item variant="text" style="width: 40%;" />
                  <el-skeleton-item variant="circle" style="width: 24px; height: 24px;" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <div v-else class="questions-grid">
        <div 
          v-for="question in filteredQuestions" 
          :key="question.id" 
          class="question-card"
          :class="{ 'is-mastered': question.status === 'mastered' }"
          @click="viewDetail(question)"
        >
          <div class="card-inner">
            <div class="question-tag-row">
              <span class="q-index">#{{ question.number }}</span>
              <el-tag :type="getStatusType(question.status)" size="small" effect="light">
                {{ getStatusName(question.status) }}
              </el-tag>
            </div>

            <h3 class="question-title" :title="question.title">{{ question.title }}</h3>

            <div class="question-meta">
              <div class="meta-row">
                <el-icon class="icon-kp"><Collection /></el-icon>
                <div class="kp-list">
                  <span v-for="(kp, i) in question.knowledgePoints.slice(0, 2)" :key="i" class="kp-tag">{{ kp }}</span>
                </div>
              </div>
              <div class="meta-row">
                <el-icon class="icon-err"><Warning /></el-icon>
                <span>出现次数：<span class="err-count">{{ question.errorCount }}</span></span>
              </div>
            </div>

            <div class="card-footer">
              <div class="mastery-info">
                <span class="label">掌握程度</span>
                <el-progress 
                  :percentage="question.mastery" 
                  :color="getProgressColor(question.mastery)"
                  :stroke-width="6"
                  :show-text="false"
                  class="custom-progress"
                />
              </div>
              <div class="action-hint">
                <span>查看详情</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredQuestions.length === 0" class="empty-state">
          <el-empty :description="filterStatus === 'all' ? '该错题集暂无题目' : '暂无对应状态的题目'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Warning, Collection, List, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const setInfo = ref({
  id: null,
  name: '加载中...',
  subject: 'math',
  createTime: new Date().toISOString(),
  status: 'pending'
})

const questions = ref([])
const pageLoading = ref(true)
const filterStatus = ref('all')

const masteredCount = computed(() => {
  return questions.value.filter(q => q.status === 'mastered').length
})

const filteredQuestions = computed(() => {
  if (filterStatus.value === 'all') return questions.value
  return questions.value.filter(q => q.status === filterStatus.value)
})

onMounted(() => {
  try {
    const routeSetId = String(route.params.setId || '')
    const storedSetRaw = sessionStorage.getItem('currentWrongSet')
    if (!storedSetRaw) {
      ElMessage.error('错题集数据不存在，请返回重试')
      router.push('/wrong-questions')
      return
    }
    const storedSet = JSON.parse(storedSetRaw)
    const storedId = String(storedSet.id || '')
    if (storedId !== routeSetId) {
      ElMessage.error('错题集数据已失效，请返回重试')
      router.push('/wrong-questions')
      return
    }
    setInfo.value = {
      id: storedSet.id || routeSetId,
      name: storedSet.name || '错题集',
      subject: storedSet.primaryTagName || '未分类',
      createTime: storedSet.createTime || new Date().toISOString(),
      status: storedSet.status || 'pending'
    }
    questions.value = (storedSet.questions || []).map((q, index) => ({
      id: q.id,
      mistakeId: q.mistakeId,
      number: index + 1,
      title: q.stem || `错题 ${index + 1}`,
      subject: storedSet.primaryTagName || '未分类',
      knowledgePoints: resolveQuestionKeyPoints(q),
      status: q.mastered ? 'mastered' : (storedSet.status || 'pending'),
      errorCount: 1,
      mastery: q.mastered ? 100 : (storedSet.status === 'practicing' ? 60 : 25),
      lastErrorTime: q.added_at || new Date().toISOString()
    }))
  } catch (error) {
    console.error('读取错题集缓存失败:', error)
    ElMessage.error('错题集数据读取失败，请返回重试')
    router.push('/wrong-questions')
  } finally {
    pageLoading.value = false
  }
})

const getSubjectType = (subject) => {
  const types = {
    math: '',
    chinese: 'success',
    english: 'warning',
    physics: 'danger',
    chemistry: 'info'
  }
  return types[subject] || ''
}

const getSubjectName = (subject) => {
  const names = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    physics: '物理',
    chemistry: '化学'
  }
  return names[subject] || subject
}

const getStatusType = (status) => {
  const types = {
    pending: 'danger',
    practicing: 'warning',
    mastered: 'success'
  }
  return types[status] || ''
}

const getStatusName = (status) => {
  const names = {
    pending: '待强化',
    practicing: '练习中',
    mastered: '已掌握'
  }
  return names[status] || status
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

const normalizePointNames = (items) => {
  if (!Array.isArray(items)) return []
  return [...new Set(
    items
      .map(item => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') return String(item.name || '').trim()
        return ''
      })
      .filter(Boolean)
  )]
}

const inferKeyPointsFromStem = (stem) => {
  const text = String(stem || '')
  if (!text) return []
  const stopWords = new Set(['以下', '根据', '关于', '什么', '哪个', '下列', '正确', '错误', '请说明', '结合', '内容'])
  const chunks = text
    .split(/[，。；;：:\s、（）()【】“”"'`！？!?]/)
    .map(item => item.trim())
    .filter(Boolean)
  const candidates = chunks
    .filter(item => item.length >= 2 && item.length <= 14)
    .filter(item => !stopWords.has(item))
    .filter(item => /[\u4e00-\u9fa5A-Za-z]/.test(item))
  return [...new Set(candidates)].slice(0, 3)
}

const resolveQuestionKeyPoints = (question) => {
  const fromKnowledgePoints = normalizePointNames(question?.knowledge_points)
  if (fromKnowledgePoints.length > 0) return fromKnowledgePoints.slice(0, 3)
  const fromTags = normalizePointNames(question?.tags)
  if (fromTags.length > 0) return fromTags.slice(0, 3)
  const inferred = inferKeyPointsFromStem(question?.stem)
  if (inferred.length > 0) return inferred
  return ['考点待补充']
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const goBack = () => {
  router.push('/wrong-questions')
}

const viewDetail = (question) => {
  if (!question.mistakeId) {
    ElMessage.error('错题记录不存在，无法查看详情')
    return
  }
  router.push(`/wrong-questions/${question.mistakeId}`)
}
</script>

<style scoped>
.wrong-question-set-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-left: 30px;
  margin-right: 30px;
  background-color: var(--el-bg-color-page);
}

/* 顶部操作栏 */
.top-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.set-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-tag {
  font-weight: 500;
}

.create-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 32px;
}

.stat-summary {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: var(--el-border-color-lighter);
}

/* 内容区域 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.list-title .el-icon {
  color: var(--el-color-primary);
}

/* 错题网格 */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding: 4px;
  padding-bottom: 20px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-8);
}

.question-card.is-mastered {
  opacity: 0.85;
}

.card-inner {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.question-tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.q-index {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
}

.question-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 51px; /* 1.5 * 17 * 2 */
}

.question-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.meta-row .el-icon {
  font-size: 15px;
}

.icon-kp { color: var(--el-color-primary); }
.icon-err { color: var(--el-color-danger); }

.kp-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.kp-tag {
  background: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.err-count {
  font-weight: 600;
  color: var(--el-color-danger);
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.mastery-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mastery-info .label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-progress {
  width: 80%;
}

.action-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-color-primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.question-card:hover .action-hint {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 100px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .questions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .questions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .wrong-question-set-detail-page {
    padding: 16px;
    margin-left: 16px;
    margin-right: 16px;
  }
  
  .questions-grid {
    grid-template-columns: 1fr;
  }
  
  .top-action-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .header-right {
    width: 100%;
  }
  
  .header-right .el-button {
    width: 100%;
  }
  
  .info-bar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .info-left {
    flex-wrap: wrap;
  }
  
  .question-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .question-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
