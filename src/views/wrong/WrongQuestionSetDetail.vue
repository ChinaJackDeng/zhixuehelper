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
import { ArrowLeft, TrendCharts, Warning, Collection, DocumentDelete } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const allSets = {
  1: {
    info: {
      id: 1,
      name: '二次函数专项',
      subject: 'math',
      createTime: '2026-03-20T10:30:00',
      status: 'practicing'
    },
    questions: [
      { id: 101, number: 1, title: '二次函数的顶点坐标公式', subject: 'math', knowledgePoints: ['二次函数', '顶点坐标', '配方法'], status: 'pending', errorCount: 3, mastery: 20, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 102, number: 2, title: '二次函数图像与系数关系', subject: 'math', knowledgePoints: ['二次函数', '函数图像', '系数分析'], status: 'practicing', errorCount: 2, mastery: 60, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 103, number: 3, title: '二次函数与一元二次方程', subject: 'math', knowledgePoints: ['二次函数', '一元二次方程', '判别式'], status: 'mastered', errorCount: 1, mastery: 95, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 104, number: 4, title: '二次函数的实际应用', subject: 'math', knowledgePoints: ['二次函数', '实际应用', '最值问题'], status: 'pending', errorCount: 4, mastery: 15, lastErrorTime: new Date(Date.now() - 3600000).toISOString() },
      { id: 105, number: 5, title: '二次函数的平移变换', subject: 'math', knowledgePoints: ['二次函数', '图像变换', '平移'], status: 'practicing', errorCount: 2, mastery: 45, lastErrorTime: new Date(Date.now() - 43200000).toISOString() }
    ]
  },
  2: {
    info: {
      id: 2,
      name: '力学基础错题',
      subject: 'physics',
      createTime: '2026-03-18T14:20:00',
      status: 'pending'
    },
    questions: [
      { id: 201, number: 1, title: '牛顿第二定律的应用', subject: 'physics', knowledgePoints: ['牛顿定律', '力学', '加速度'], status: 'pending', errorCount: 2, mastery: 30, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 202, number: 2, title: '摩擦力方向判断', subject: 'physics', knowledgePoints: ['摩擦力', '力的分析'], status: 'practicing', errorCount: 1, mastery: 55, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 203, number: 3, title: '匀变速直线运动', subject: 'physics', knowledgePoints: ['运动学', '加速度', '位移'], status: 'pending', errorCount: 3, mastery: 25, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 204, number: 4, title: '力的合成与分解', subject: 'physics', knowledgePoints: ['力的合成', '向量', '分解'], status: 'mastered', errorCount: 1, mastery: 85, lastErrorTime: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  3: {
    info: {
      id: 3,
      name: '英语语法易错点',
      subject: 'english',
      createTime: '2026-03-15T09:00:00',
      status: 'mastered'
    },
    questions: [
      { id: 301, number: 1, title: '定语从句关系词选择', subject: 'english', knowledgePoints: ['定语从句', '关系词'], status: 'mastered', errorCount: 2, mastery: 90, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 302, number: 2, title: '虚拟语气用法', subject: 'english', knowledgePoints: ['虚拟语气', '条件句'], status: 'practicing', errorCount: 3, mastery: 65, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 303, number: 3, title: '时态一致性', subject: 'english', knowledgePoints: ['时态', '主谓一致'], status: 'mastered', errorCount: 1, mastery: 88, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 304, number: 4, title: '非谓语动词辨析', subject: 'english', knowledgePoints: ['非谓语动词', '动名词', '分词'], status: 'practicing', errorCount: 2, mastery: 70, lastErrorTime: new Date(Date.now() - 3600000).toISOString() },
      { id: 305, number: 5, title: '倒装句结构', subject: 'english', knowledgePoints: ['倒装句', '句式'], status: 'pending', errorCount: 4, mastery: 35, lastErrorTime: new Date(Date.now() - 43200000).toISOString() },
      { id: 306, number: 6, title: '名词性从句连接词', subject: 'english', knowledgePoints: ['名词性从句', '连接词'], status: 'mastered', errorCount: 1, mastery: 92, lastErrorTime: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  4: {
    info: {
      id: 4,
      name: '化学反应方程式',
      subject: 'chemistry',
      createTime: '2026-03-19T16:45:00',
      status: 'pending'
    },
    questions: [
      { id: 401, number: 1, title: '氧化还原反应配平', subject: 'chemistry', knowledgePoints: ['氧化还原', '配平'], status: 'pending', errorCount: 3, mastery: 25, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 402, number: 2, title: '离子方程式书写', subject: 'chemistry', knowledgePoints: ['离子方程式', '电解质'], status: 'practicing', errorCount: 2, mastery: 50, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 403, number: 3, title: '化学平衡移动', subject: 'chemistry', knowledgePoints: ['化学平衡', '勒夏特列原理'], status: 'pending', errorCount: 4, mastery: 20, lastErrorTime: new Date(Date.now() - 259200000).toISOString() }
    ]
  },
  5: {
    info: {
      id: 5,
      name: '古诗词鉴赏',
      subject: 'chinese',
      createTime: '2026-03-17T11:30:00',
      status: 'practicing'
    },
    questions: [
      { id: 501, number: 1, title: '诗歌意象分析', subject: 'chinese', knowledgePoints: ['意象', '诗歌鉴赏'], status: 'practicing', errorCount: 2, mastery: 55, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 502, number: 2, title: '修辞手法辨析', subject: 'chinese', knowledgePoints: ['修辞', '比喻', '拟人'], status: 'mastered', errorCount: 1, mastery: 80, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 503, number: 3, title: '诗歌情感理解', subject: 'chinese', knowledgePoints: ['情感', '主旨'], status: 'pending', errorCount: 3, mastery: 35, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 504, number: 4, title: '炼字赏析', subject: 'chinese', knowledgePoints: ['炼字', '语言品味'], status: 'practicing', errorCount: 2, mastery: 60, lastErrorTime: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  6: {
    info: {
      id: 6,
      name: '函数与导数',
      subject: 'math',
      createTime: '2026-03-16T13:20:00',
      status: 'practicing'
    },
    questions: [
      { id: 601, number: 1, title: '导数的几何意义', subject: 'math', knowledgePoints: ['导数', '切线', '斜率'], status: 'practicing', errorCount: 2, mastery: 50, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 602, number: 2, title: '函数单调性判断', subject: 'math', knowledgePoints: ['单调性', '导数'], status: 'mastered', errorCount: 1, mastery: 85, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 603, number: 3, title: '极值与最值问题', subject: 'math', knowledgePoints: ['极值', '最值', '导数'], status: 'pending', errorCount: 4, mastery: 30, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 604, number: 4, title: '函数零点问题', subject: 'math', knowledgePoints: ['零点', '方程根'], status: 'practicing', errorCount: 2, mastery: 55, lastErrorTime: new Date(Date.now() - 3600000).toISOString() },
      { id: 605, number: 5, title: '导数综合应用', subject: 'math', knowledgePoints: ['导数', '综合应用'], status: 'pending', errorCount: 3, mastery: 25, lastErrorTime: new Date(Date.now() - 43200000).toISOString() }
    ]
  },
  7: {
    info: {
      id: 7,
      name: '电磁学专题',
      subject: 'physics',
      createTime: '2026-03-14T10:00:00',
      status: 'pending'
    },
    questions: [
      { id: 701, number: 1, title: '电场强度计算', subject: 'physics', knowledgePoints: ['电场', '库仑定律'], status: 'pending', errorCount: 3, mastery: 30, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 702, number: 2, title: '磁场对运动电荷的作用', subject: 'physics', knowledgePoints: ['洛伦兹力', '磁场'], status: 'practicing', errorCount: 2, mastery: 45, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 703, number: 3, title: '电磁感应定律', subject: 'physics', knowledgePoints: ['法拉第定律', '感应电流'], status: 'pending', errorCount: 4, mastery: 20, lastErrorTime: new Date(Date.now() - 259200000).toISOString() }
    ]
  },
  8: {
    info: {
      id: 8,
      name: '完形填空技巧',
      subject: 'english',
      createTime: '2026-03-13T15:30:00',
      status: 'mastered'
    },
    questions: [
      { id: 801, number: 1, title: '上下文逻辑推理', subject: 'english', knowledgePoints: ['逻辑推理', '语境'], status: 'mastered', errorCount: 1, mastery: 90, lastErrorTime: new Date(Date.now() - 86400000).toISOString() },
      { id: 802, number: 2, title: '词汇辨析选择', subject: 'english', knowledgePoints: ['词汇', '近义词'], status: 'practicing', errorCount: 2, mastery: 70, lastErrorTime: new Date(Date.now() - 172800000).toISOString() },
      { id: 803, number: 3, title: '固定搭配记忆', subject: 'english', knowledgePoints: ['固定搭配', '短语'], status: 'mastered', errorCount: 1, mastery: 88, lastErrorTime: new Date(Date.now() - 259200000).toISOString() },
      { id: 804, number: 4, title: '语篇连贯理解', subject: 'english', knowledgePoints: ['语篇', '连贯性'], status: 'mastered', errorCount: 1, mastery: 85, lastErrorTime: new Date(Date.now() - 3600000).toISOString() }
    ]
  }
}

const setInfo = ref({
  id: 1,
  name: '加载中...',
  subject: 'math',
  createTime: new Date().toISOString(),
  status: 'practicing'
})

const questions = ref([])

onMounted(() => {
  const setId = parseInt(route.params.setId) || 1
  const setData = allSets[setId] || allSets[1]
  setInfo.value = setData.info
  questions.value = setData.questions
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
  router.push(`/wrong-questions/${question.id}`)
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
