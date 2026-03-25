<template>
  <div class="wrong-question-detail-page">
    <!-- 顶部操作栏 -->
    <div class="top-action-bar">
      <div class="header-left">
        <el-button circle @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h1 class="page-title">错题详情与溯源</h1>
      </div>
      <div class="header-right">
        <el-tag :type="getSubjectType(question.subject)" size="large">
          {{ getSubjectName(question.subject) }}
        </el-tag>
        <el-tag type="danger" size="large">
          错误 {{ question.errorCount }} 次
        </el-tag>
      </div>
    </div>

    <!-- 主要内容区：左右分栏 -->
    <div class="main-content-area">
      <!-- 左栏：题目信息 (65%) -->
      <div class="left-panel">
        <div class="question-card">
          <div class="question-content">
            <h2 class="question-title">{{ question.title }}</h2>
            <div class="question-body">
              {{ question.content }}
            </div>

            <div class="question-options" v-if="question.options">
              <div 
                v-for="(option, index) in question.options" 
                :key="index"
                class="option-item"
                :class="{ 
                  'correct': index === question.correctAnswer,
                  'wrong': question.userAnswer === index && index !== question.correctAnswer
                }"
              >
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <span class="option-text">{{ option }}</span>
                <el-icon v-if="index === question.correctAnswer" class="check-icon"><CircleCheck /></el-icon>
                <el-icon v-if="question.userAnswer === index && index !== question.correctAnswer" class="close-icon"><CircleClose /></el-icon>
              </div>
            </div>
          </div>

          <div class="error-analysis">
            <h3>
              <el-icon><Warning /></el-icon>
              错误原因分析
            </h3>
            <div class="analysis-content">
              <div class="analysis-item">
                <span class="analysis-label">您的答案：</span>
                <span class="analysis-value wrong">{{ question.userAnswer !== null ? String.fromCharCode(65 + question.userAnswer) : '未作答' }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">正确答案：</span>
                <span class="analysis-value correct">{{ String.fromCharCode(65 + question.correctAnswer) }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">错误类型：</span>
                <el-tag type="warning" size="small">{{ question.errorType }}</el-tag>
              </div>
              <div class="analysis-description">
                {{ question.errorDescription }}
              </div>
            </div>
          </div>
        </div>

        <!-- AI解析 -->
        <div class="ai-analysis-card">
          <div class="card-header">
            <div class="header-left">
              <el-icon class="ai-icon"><ChatDotRound /></el-icon>
              <h3>AI 智能解析</h3>
            </div>
            <el-button type="primary" size="small" @click="regenerateAnalysis">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
          </div>
          <div class="analysis-text">
            {{ aiAnalysis }}
          </div>
        </div>
      </div>

      <!-- 右栏：知识溯源与推荐 (35%) -->
      <div class="right-panel">
        <!-- 知识点溯源 -->
        <div class="knowledge-trace-card">
          <div class="card-header">
            <el-icon class="card-icon"><Collection /></el-icon>
            <h3>知识点溯源</h3>
          </div>
          <div class="knowledge-points">
            <div 
              v-for="(point, index) in question.knowledgePoints" 
              :key="index"
              class="knowledge-point-item"
              @click="viewKnowledge(point)"
            >
              <div class="point-header">
                <el-icon><Document /></el-icon>
                <span class="point-name">{{ typeof point === 'object' ? point.name : point }}</span>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
              <div class="point-docs">
                <span>关联 {{ (typeof point === 'object' && point.relatedDocs) || 3 }} 个文档</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 知识库文档推荐 -->
        <div class="docs-recommend-card">
          <div class="card-header">
            <el-icon class="card-icon"><FolderOpened /></el-icon>
            <h3>知识库文档</h3>
          </div>
          <div class="docs-list">
            <div 
              v-for="doc in recommendedDocs" 
              :key="doc.id"
              class="doc-item"
              @click="viewDocument(doc)"
            >
              <div class="doc-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="doc-info">
                <div class="doc-title">{{ doc.title }}</div>
                <div class="doc-meta">
                  <span>{{ doc.category }}</span>
                  <span>•</span>
                  <span>{{ doc.relevance }}% 相关</span>
                </div>
              </div>
              <el-icon class="doc-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 相关题目推荐 -->
        <div class="related-questions-card">
          <div class="card-header">
            <el-icon class="card-icon"><List /></el-icon>
            <h3>相关题目推荐</h3>
          </div>
          <div class="questions-list">
            <div 
              v-for="q in relatedQuestions" 
              :key="q.id"
              class="related-question-item"
              @click="practiceQuestion(q)"
            >
              <div class="question-info">
                <div class="question-tag">{{ q.difficulty }}</div>
                <div class="question-text">{{ q.title }}</div>
              </div>
              <el-button type="primary" size="default" :style="{ 'background-color': '#66b1ff', 'border-color': '#66b1ff' }">
                去练习
              </el-button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="startReinforcement" class="full-width">
            开始强化练习
          </el-button>
          <el-button size="large" @click="markMastered" class="full-width">
            标记为已掌握
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Warning, CircleCheck, CircleClose, ChatDotRound, Refresh, Collection, Document, ArrowRight, FolderOpened, List } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const question = ref({
  id: 1,
  title: '二次函数的顶点坐标公式',
  subject: 'math',
  content: '已知二次函数 y = ax² + bx + c (a ≠ 0)，求其顶点坐标。',
  options: [
    '(-b/2a, c - b²/4a)',
    '(-b/2a, (4ac - b²)/4a)',
    '(b/2a, c - b²/4a)',
    '(b/2a, (4ac - b²)/4a)'
  ],
  correctAnswer: 1,
  userAnswer: 0,
  errorCount: 3,
  errorType: '概念理解错误',
  errorDescription: '对二次函数顶点坐标公式的推导过程理解不透彻，混淆了顶点纵坐标的表达式。需要重点复习配方法和二次函数的图像性质。',
  knowledgePoints: [
    { name: '二次函数', relatedDocs: 5 },
    { name: '顶点坐标', relatedDocs: 3 },
    { name: '配方法', relatedDocs: 4 }
  ],
  difficulty: 'medium'
})

const aiAnalysis = ref('二次函数 y = ax² + bx + c 的顶点坐标可以通过配方法求得：\n\n1. 将函数写成 y = a(x + b/2a)² + (4ac - b²)/4a\n2. 顶点横坐标为 x = -b/2a\n3. 顶点纵坐标为 y = (4ac - b²)/4a\n\n记忆技巧：顶点横坐标是 -b/2a，纵坐标可以用判别式 Δ = b² - 4ac 来记忆，即 y = -Δ/4a。')

const recommendedDocs = ref([
  {
    id: 1,
    title: '二次函数顶点坐标推导详解',
    category: '数学',
    relevance: 95
  },
  {
    id: 2,
    title: '配方法在二次函数中的应用',
    category: '数学',
    relevance: 88
  },
  {
    id: 3,
    title: '二次函数图像与性质总结',
    category: '数学',
    relevance: 82
  }
])

const relatedQuestions = ref([
  {
    id: 101,
    title: '求二次函数 y = x² - 4x + 3 的顶点坐标',
    difficulty: '简单'
  },
  {
    id: 102,
    title: '已知顶点坐标求二次函数解析式',
    difficulty: '中等'
  },
  {
    id: 103,
    title: '二次函数最值问题综合应用',
    difficulty: '困难'
  }
])

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

const goBack = () => {
  router.back()
}

const regenerateAnalysis = () => {
  ElMessage.success('AI解析已重新生成')
}

const viewKnowledge = (point) => {
  ElMessage.info(`正在查看知识点：${typeof point === 'object' ? point.name : point}`)
}

const viewDocument = (doc) => {
  ElMessage.info(`正在打开文档：${doc.title}`)
}

const practiceQuestion = (q) => {
  ElMessage.info(`开始练习题目：${q.title}`)
}

const startReinforcement = () => {
  router.push('/reinforcement-practice')
}

const markMastered = () => {
  ElMessage.success('已标记为已掌握')
  router.back()
}

onMounted(() => {
  const questionId = route.params.id
  console.log('加载错题详情:', questionId)
})
</script>

<style scoped>
.wrong-question-detail-page {
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
  font-size: 26px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.header-right .el-tag {
  font-size: 14px;
}

/* 主要内容区 */
.main-content-area {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 65%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.right-panel {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 0 20px 0 10px;
}

/* 卡片样式 */
.question-card,
.ai-analysis-card,
.knowledge-trace-card,
.docs-recommend-card,
.related-questions-card,
.action-buttons {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.card-header h3 {
  font-size: 19px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  font-size: 20px;
  color: #409eff;
}

.ai-icon {
  font-size: 20px;
  color: #409eff;
}

/* 题目内容 */
.question-content {
  padding: 20px;
}

.question-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.question-body {
  font-size: 18px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  margin-bottom: 20px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 17px;
}

.option-item.correct {
  border-color: #67c23a;
  background: #f0f9ff;
}

.option-item.wrong {
  border-color: #f56c6c;
  background: #fef0f0;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  min-width: 28px;
  font-size: 16px;
}

.option-text {
  flex: 1;
  color: var(--el-text-color-primary);
}

.check-icon {
  color: #67c23a;
  font-size: 22px;
}

.close-icon {
  color: #f56c6c;
  font-size: 22px;
}

/* 错误分析 */
.error-analysis {
  padding: 16px 20px;
  background: var(--el-fill-color-light);
  border-top: 1px solid var(--el-border-color);
}

.error-analysis h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 19px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
}

.analysis-label {
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.analysis-value {
  font-weight: 600;
}

.analysis-value.correct {
  color: #67c23a;
}

.analysis-value.wrong {
  color: #f56c6c;
}

.analysis-description {
  font-size: 17px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

/* AI解析 */
.ai-analysis-card .card-header {
  padding: 14px 16px;
}

.analysis-text {
  padding: 14px 16px;
  font-size: 17px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin: 0 14px 14px 14px;
}

/* 知识点溯源 */
.knowledge-points {
  padding: 12px;
}

.knowledge-point-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 6px;
}

.knowledge-point-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.knowledge-point-item:last-child {
  margin-bottom: 0;
}

.point-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 17px;
  color: var(--el-text-color-primary);
}

.point-name {
  flex: 1;
}

.arrow-icon {
  color: #409eff;
  font-size: 16px;
}

.point-docs {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  padding-left: 24px;
}

/* 文档推荐 */
.docs-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.doc-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.doc-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-arrow {
  color: #409eff;
  font-size: 16px;
}

/* 相关题目 */
.questions-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 8px;
}

.related-question-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.question-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.question-tag {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
}

.question-text {
  font-size: 16px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.action-buttons .el-button {
  font-size: 16px;
}

.full-width {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content-area {
    flex-direction: column;
  }
  
  .left-panel,
  .right-panel {
    flex: 1;
    width: 100%;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .wrong-question-detail-page {
    padding: 16px;
    margin-left: 16px;
    margin-right: 16px;
  }
  
  .top-action-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-left,
  .header-right {
    width: 100%;
  }
}
</style>
