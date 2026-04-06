<template>
  <div class="wrong-question-set-detail-page">
    <!-- 顶部操作栏 -->
    <div class="top-action-bar">
      <div class="header-left">
        <el-button circle @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h1 class="page-title">{{ setInfo.name }}</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="startPractice">
          <el-icon><TrendCharts /></el-icon>
          开始练习
        </el-button>
      </div>
    </div>

    <!-- 信息栏 -->
    <div class="info-bar">
      <div class="info-left">
        <el-tag :type="getSubjectType(setInfo.subject)" size="large">
          {{ getSubjectName(setInfo.subject) }}
        </el-tag>
        <el-tag :type="getStatusType(setInfo.status)" size="large">
          {{ getStatusName(setInfo.status) }}
        </el-tag>
        <span class="create-time">创建于 {{ formatDate(setInfo.createTime) }}</span>
      </div>
      <div class="info-right">
        <span class="question-count">共 {{ questions.length }} 道错题</span>
      </div>
    </div>

    <!-- 错题列表 -->
    <div class="questions-grid">
      <div 
        v-for="question in questions" 
        :key="question.id" 
        class="question-card"
        @click="viewDetail(question)"
      >
        <div class="question-header">
          <span class="question-number">【{{ question.number }}】</span>
          <el-tag :type="getStatusType(question.status)" size="small">
            {{ getStatusName(question.status) }}
          </el-tag>
        </div>

        <h3 class="question-title">{{ question.title }}</h3>

        <div class="question-content">
          <div class="knowledge-points">
            <el-icon><Collection /></el-icon>
            <span>{{ question.knowledgePoints.slice(0, 2).join('、') }}</span>
          </div>
          <div class="error-info">
            <el-icon><Warning /></el-icon>
            <span>错误 {{ question.errorCount }} 次</span>
          </div>
        </div>

        <div class="question-footer">
          <div class="progress-section">
            <span class="progress-label">掌握进度</span>
            <el-progress 
              :percentage="question.mastery" 
              :color="getProgressColor(question.mastery)"
              :show-text="false"
              :stroke-width="4"
            />
            <span class="progress-value">{{ question.mastery }}%</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="questions.length === 0" class="empty-state">
        <el-icon class="empty-icon"><DocumentDelete /></el-icon>
        <p>该错题集暂无题目</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, TrendCharts, Warning, Collection, DocumentDelete } from '@element-plus/icons-vue'

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

onMounted(() => {
  const routeSetId = String(route.params.setId || '')
  const storedSetRaw = sessionStorage.getItem('currentWrongSet')
  if (!storedSetRaw) {
    ElMessage.error('错题集数据不存在，请返回重试')
    router.push('/wrong-questions')
    return
  }
  try {
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
      subject: storedSet.primaryTagName || '未打标签',
      createTime: storedSet.createTime || new Date().toISOString(),
      status: storedSet.status || 'pending'
    }
    questions.value = (storedSet.questions || []).map((q, index) => ({
      id: q.id,
      mistakeId: q.mistakeId,
      number: index + 1,
      title: q.stem || `错题 ${index + 1}`,
      subject: storedSet.primaryTagName || '未打标签',
      knowledgePoints: Array.isArray(q.tags) && q.tags.length > 0 ? q.tags.map(t => t.name) : ['未打标签'],
      status: q.mastered ? 'mastered' : (storedSet.status || 'pending'),
      errorCount: 1,
      mastery: q.mastered ? 100 : (storedSet.status === 'practicing' ? 60 : 25),
      lastErrorTime: q.added_at || new Date().toISOString()
    }))
  } catch (error) {
    console.error('读取错题集缓存失败:', error)
    ElMessage.error('错题集数据读取失败，请返回重试')
    router.push('/wrong-questions')
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

const startPractice = () => {
  router.push('/reinforcement-practice')
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
  margin-bottom: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 信息栏 */
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.create-time {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.info-right {
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

.question-count {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 错题网格 */
.questions-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  overflow-y: auto;
  padding: 4px;
}

.question-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-number {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  display: box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  flex: 1;
}

.knowledge-points,
.error-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.knowledge-points .el-icon,
.error-info .el-icon {
  color: #409eff;
  font-size: 16px;
}

.question-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  min-width: 36px;
  text-align: right;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 80px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
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
