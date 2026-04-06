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
        <el-tag type="info" size="large">
          {{ getQuestionTypeLabel(question.type) }}
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
                  'correct': isCorrectOption(index),
                  'wrong': isWrongOption(index)
                }"
              >
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <span class="option-text">{{ option }}</span>
                <el-icon v-if="isCorrectOption(index)" class="check-icon"><CircleCheck /></el-icon>
                <el-icon v-if="isWrongOption(index)" class="close-icon"><CircleClose /></el-icon>
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
                <span class="analysis-value wrong">{{ formatAnswerDisplay(question.userAnswer) }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">正确答案：</span>
                <span class="analysis-value correct">{{ formatAnswerDisplay(question.correctAnswer) }}</span>
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
          <div class="analysis-text markdown-body" v-html="renderedAiAnalysis">
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
            <div class="title-group">
              <el-icon class="card-icon"><List /></el-icon>
              <h3>相关题目推荐</h3>
            </div>
            <div class="generate-actions">
              <el-select v-model="generateCount" size="small" style="width: 100px">
                <el-option v-for="count in [1, 2, 3, 4, 5]" :key="count" :label="`${count}道`" :value="count" />
              </el-select>
              <el-button size="small" :loading="relatedQuestionsLoading" @click="generateReinforcementQuestions">生成强化练习题</el-button>
            </div>
          </div>
          <div class="questions-list">
            <div v-if="relatedQuestionsLoading" class="generating-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ generatingMessage }}</span>
            </div>
            <div v-else-if="relatedQuestions.length === 0" class="empty-generated">
              暂未生成到可展示题目，请重试
            </div>
            <div v-if="relatedQuestions.length > 0" class="batch-toolbar">
              <span class="slots-text">可加入 {{ remainingReinforcementSlots }}/{{ maxReinforcementQuestions }}，已勾选 {{ selectedBatchCount }}</span>
              <el-checkbox
                :model-value="isBatchAllChecked"
                :indeterminate="isBatchIndeterminate"
                :disabled="batchSelectableCount === 0"
                @change="handleBatchCheckAllChange"
              >
                全选可加入题目
              </el-checkbox>
              <el-button
                size="small"
                type="primary"
                :disabled="selectedBatchCount === 0 || !canAddMoreReinforcement"
                :loading="batchAdding"
                @click="addSelectedQuestionsToReinforcement"
              >
                批量加入强化练习（{{ selectedBatchCount }}）
              </el-button>
            </div>
            <div 
              v-for="q in relatedQuestions" 
              :key="q.uiKey"
              class="related-question-item"
            >
              <div class="question-select">
                <el-checkbox
                  :disabled="q.isSaved || !canAddMoreReinforcement"
                  :model-value="isQuestionChecked(q.uiKey)"
                  @change="(checked) => handleQuestionCheckChange(q.uiKey, checked)"
                  @click.stop
                />
              </div>
              <div class="question-info">
                <div class="question-text">{{ q.title }}</div>
                <div class="question-meta-row">
                  <el-tag size="small" type="info">{{ getQuestionTypeLabel(q.type) }}</el-tag>
                  <el-tag size="small" effect="plain">
                    {{ q.rawDifficulty === 'easy' ? '简单' : q.rawDifficulty === 'medium' ? '中等' : '困难' }}
                  </el-tag>
                </div>
                <div v-if="q.options && q.options.length > 0" class="question-options-preview">
                  <div v-for="(opt, optIndex) in q.options" :key="`${q.uiKey}-opt-${optIndex}`" class="preview-option">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ opt }}
                  </div>
                </div>
                <div v-else class="no-options-tip">暂无选项，建议重新生成该题</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="startReinforcement" class="full-width">
            开始强化练习
          </el-button>
          <el-button size="large" @click="markMastered" class="full-width" :disabled="question.mastered">
            {{ question.mastered ? '已掌握' : '标记为已掌握' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Warning, CircleCheck, CircleClose, ChatDotRound, Refresh, Collection, Document, ArrowRight, FolderOpened, List, Loading } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import {
  getMistakeDetail,
  regenerateMistakeAnalysis,
  markMistakeMastered,
  getRelatedDocuments,
  startReinforcement as startReinforcementApi,
  getReinforcementSessionQuestions,
  addReinforcementQuestion
} from '@/api/exam'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const mistakeId = ref(null)

const question = ref({
  id: null,
  mistakeId: null,
  title: '',
  subject: 'math',
  content: '',
  options: [],
  correctAnswer: null,
  userAnswer: null,
  errorCount: 0,
  errorType: '',
  errorDescription: '',
  knowledgePoints: [],
  difficulty: 'medium',
  type: 'single',
  mastered: false,
  questionSetName: ''
})

const aiAnalysis = ref('')
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})
const renderedAiAnalysis = computed(() => md.render(aiAnalysis.value || ''))

const recommendedDocs = ref([])

const relatedQuestions = ref([])
const relatedSessionId = ref(null)
const generateCount = ref(2)
const selectedRelatedQuestionKeys = ref([])
const batchAdding = ref(false)
const relatedQuestionsLoading = ref(false)
const generatingMessage = ref('')
const maxReinforcementQuestions = ref(5)
const reinforcementQuestionCount = ref(0)

const remainingReinforcementSlots = computed(() => {
  return Math.max(0, maxReinforcementQuestions.value - reinforcementQuestionCount.value)
})
const canAddMoreReinforcement = computed(() => remainingReinforcementSlots.value > 0)
const selectableRelatedQuestions = computed(() => {
  if (!canAddMoreReinforcement.value) return []
  return relatedQuestions.value.filter(item => !item.isSaved)
})
const batchSelectableCount = computed(() => selectableRelatedQuestions.value.length)
const selectedBatchCount = computed(() => selectedRelatedQuestionKeys.value.length)
const isBatchAllChecked = computed(() => {
  return batchSelectableCount.value > 0 && selectedBatchCount.value === batchSelectableCount.value
})
const isBatchIndeterminate = computed(() => {
  return selectedBatchCount.value > 0 && selectedBatchCount.value < batchSelectableCount.value
})

const getQuestionTypeLabel = (type) => {
  const labels = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    fill: '填空题',
    essay: '问答题'
  }
  return labels[type] || '单选题'
}

const goBack = () => {
  router.back()
}

const regenerateAnalysis = async () => {
  if (!mistakeId.value) {
    ElMessage.warning('无法获取错题ID')
    return
  }

  try {
    ElMessage.info('正在重新生成AI解析，请稍候...')
    const data = await regenerateMistakeAnalysis(mistakeId.value)
    aiAnalysis.value = stripSimilarQuestionsSection(data.ai_analysis || '暂无AI解析')
    question.value.errorType = data.error_type || question.value.errorType
    ElMessage.success('AI解析已重新生成')
  } catch (error) {
    console.error('重新生成AI解析失败:', error)
    ElMessage.error('重新生成AI解析失败，请稍后重试')
  }
}

const viewKnowledge = (point) => {
  ElMessage.info(`正在查看知识点：${typeof point === 'object' ? point.name : point}`)
}

const viewDocument = (doc) => {
  ElMessage.info(`正在打开文档：${doc.title}`)
}

function buildReinforcementPayload(q) {
  const rawAnswer = resolveAnswerRaw(q)
  return {
    stem: q.title,
    options: q.options || [],
    answer: rawAnswer,
    explanation: q.explanation || '',
    type: q.type || 'single',
    difficulty: q.rawDifficulty || 'medium'
  }
}

function optionIndexToLabel(indexValue) {
  if (typeof indexValue !== 'number' || indexValue < 0) return ''
  return String.fromCharCode(65 + indexValue)
}

function resolveAnswerRaw(item = {}) {
  const candidates = [item.answerRaw, item.answer, item.correct_answer, item.correctAnswerRaw]
  for (const value of candidates) {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) return value.map(part => String(part)).join(',')
      return String(value)
    }
  }
  if (Array.isArray(item.correctAnswer)) {
    const labels = item.correctAnswer.map(optionIndexToLabel).filter(Boolean)
    return labels.join(',')
  }
  if (typeof item.correctAnswer === 'number') {
    return optionIndexToLabel(item.correctAnswer)
  }
  if (typeof item.explanation === 'string') {
    const match = item.explanation.match(/(?:正确答案|答案)\s*[：:]\s*([A-Z])/i)
    if (match?.[1]) return match[1].toUpperCase()
  }
  return ''
}

function isQuestionChecked(uiKey) {
  return selectedRelatedQuestionKeys.value.includes(uiKey)
}

function handleQuestionCheckChange(uiKey, checked) {
  if (checked) {
    if (!selectedRelatedQuestionKeys.value.includes(uiKey)) {
      selectedRelatedQuestionKeys.value = [...selectedRelatedQuestionKeys.value, uiKey]
    }
    return
  }
  selectedRelatedQuestionKeys.value = selectedRelatedQuestionKeys.value.filter(key => key !== uiKey)
}

function handleBatchCheckAllChange(checked) {
  if (!checked) {
    selectedRelatedQuestionKeys.value = []
    return
  }
  selectedRelatedQuestionKeys.value = selectableRelatedQuestions.value.map(item => item.uiKey)
}

async function syncQuestionCountFromSession(sessionId) {
  if (!sessionId) {
    reinforcementQuestionCount.value = 0
    return
  }
  try {
    const sessionData = await getReinforcementSessionQuestions(sessionId)
    const sessionQuestions = Array.isArray(sessionData?.questions) ? sessionData.questions : []
    reinforcementQuestionCount.value = sessionQuestions.length
  } catch (error) {
    console.error('同步强化练习容量失败:', error)
  }
}

function updateReinforcementCapacity(payload = {}, fallbackIncrement = 0) {
  const maxFromPayload = Number(payload?.max_selected_questions)
  if (maxFromPayload > 0) {
    maxReinforcementQuestions.value = maxFromPayload
  }
  const remainingSlots = Number(payload?.remaining_slots)
  if (remainingSlots >= 0) {
    reinforcementQuestionCount.value = Math.max(0, maxReinforcementQuestions.value - remainingSlots)
  } else {
    const totalFromPayload = Number(payload?.question_total_count)
    if (totalFromPayload >= 0) {
      reinforcementQuestionCount.value = totalFromPayload
    } else {
      const selectedFromPayload = Number(payload?.selected_count)
      if (selectedFromPayload >= 0) {
        reinforcementQuestionCount.value = selectedFromPayload
      } else if (fallbackIncrement > 0) {
        reinforcementQuestionCount.value = Math.min(
          maxReinforcementQuestions.value,
          reinforcementQuestionCount.value + fallbackIncrement
        )
      }
    }
  }
  if (selectedRelatedQuestionKeys.value.length > 0 && !canAddMoreReinforcement.value) {
    selectedRelatedQuestionKeys.value = []
  }
}

const addSelectedQuestionsToReinforcement = async () => {
  if (!mistakeId.value) {
    ElMessage.warning('错题ID缺失')
    return
  }
  const selectedQuestions = relatedQuestions.value.filter(
    item => selectedRelatedQuestionKeys.value.includes(item.uiKey) && !item.isSaved
  )
  if (selectedQuestions.length === 0) {
    ElMessage.warning('请先勾选题目')
    return
  }
  if (!canAddMoreReinforcement.value) {
    ElMessage.warning(`强化练习最多 ${maxReinforcementQuestions.value} 题，当前已满`)
    return
  }
  const allowedCount = Math.min(selectedQuestions.length, remainingReinforcementSlots.value)
  const targetQuestions = selectedQuestions.slice(0, allowedCount)
  if (targetQuestions.length < selectedQuestions.length) {
    ElMessage.warning(`最多还能加入 ${remainingReinforcementSlots.value} 题，已按剩余容量处理`)
  }
  batchAdding.value = true
  try {
    const results = await Promise.allSettled(
      targetQuestions.map(item => addReinforcementQuestion(Number(mistakeId.value), buildReinforcementPayload(item)))
    )
    let successCount = 0
    let failedCount = 0
    let latestTotalCount = -1
    let latestPayload = null
    results.forEach((result, index) => {
      const item = targetQuestions[index]
      if (result.status === 'fulfilled') {
        const data = result.value
        item.reinforcementQuestionId = data?.question?.id || item.reinforcementQuestionId
        item.id = item.reinforcementQuestionId || item.id
        item.isSaved = true
        item.isSelected = true
        relatedSessionId.value = data?.session_id || relatedSessionId.value
        const totalCount = Number(data?.question_total_count)
        if (totalCount >= latestTotalCount) {
          latestTotalCount = totalCount
          latestPayload = data
        }
        successCount += 1
        return
      }
      failedCount += 1
    })
    updateReinforcementCapacity(latestPayload || {}, successCount)
    selectedRelatedQuestionKeys.value = selectedRelatedQuestionKeys.value.filter(
      key => !targetQuestions.some(item => item.uiKey === key)
    )
    if (successCount > 0 && failedCount === 0) {
      ElMessage.success(`已批量加入 ${successCount} 道强化练习题`)
      return
    }
    if (successCount > 0) {
      ElMessage.warning(`成功 ${successCount} 道，失败 ${failedCount} 道`)
      return
    }
    ElMessage.error('批量加入强化练习失败，请稍后重试')
  } catch (error) {
    console.error('批量加入强化练习失败:', error)
    const message = error?.response?.data?.detail || '批量加入强化练习失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    batchAdding.value = false
  }
}

const startReinforcement = async () => {
  if (!mistakeId.value) {
    ElMessage.warning('无法获取错题ID')
    return
  }
  try {
    let sourceQuestions = []
    if (relatedSessionId.value) {
      const selectedData = await getReinforcementSessionQuestions(relatedSessionId.value, { selected_only: true })
      sourceQuestions = mapSimilarQuestionsForPanel(selectedData?.questions || [])
    }
    if (sourceQuestions.length === 0) {
      sourceQuestions = relatedQuestions.value.filter(item => item.isSaved)
    }
    const practiceQuestions = normalizeReinforcementQuestions(sourceQuestions)
    if (practiceQuestions.length === 0) {
      ElMessage.warning('请先将推荐题目加入强化练习')
      return
    }
    sessionStorage.setItem('reinforcementPracticeQuestions', JSON.stringify(practiceQuestions))
    router.push('/reinforcement-practice')
  } catch (error) {
    console.error('开始强化练习失败:', error)
    ElMessage.error('开始强化练习失败，请稍后重试')
  }
}

const markMastered = async () => {
  if (!mistakeId.value) {
    ElMessage.warning('无法获取错题ID')
    return
  }
  if (question.value.mastered) {
    ElMessage.success('该错题已是已掌握状态')
    return
  }
  try {
    await markMistakeMastered(mistakeId.value)
    question.value.mastered = true
    ElMessage.success('已标记为已掌握')
  } catch (error) {
    console.error('标记已掌握失败:', error)
    ElMessage.error('标记已掌握失败，请稍后重试')
  }
}

onMounted(async () => {
  mistakeId.value = route.params.id
  if (!mistakeId.value) {
    ElMessage.error('无法获取错题ID')
    return
  }

  loading.value = true
  try {
    const data = await getMistakeDetail(mistakeId.value)
    question.value = {
      id: data.question.id,
      mistakeId: data.id,
      title: data.question.stem,
      subject: 'math',
      content: data.question.stem,
      options: normalizeOptions(data.question.options),
      correctAnswer: normalizeAnswer(data.question.type, data.question.answer),
      userAnswer: normalizeAnswer(data.question.type, data.user_answer),
      errorCount: 1,
      errorType: data.error_type || '',
      errorDescription: data.error_description || '',
      knowledgePoints: data.knowledge_points || [],
      difficulty: data.question.difficulty || 'medium',
      type: data.question.type,
      mastered: !!data.mastered,
      questionSetName: data.question_set_name || '相似题集'
    }
    aiAnalysis.value = stripSimilarQuestionsSection(data.ai_analysis || '暂无AI解析，点击"重新生成"获取智能分析')
    await Promise.all([
      loadRelatedDocuments(data),
      loadRelatedQuestions()
    ])
  } catch (error) {
    console.error('获取错题详情失败:', error)
    ElMessage.error('获取错题详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
})

function normalizeOptions(rawOptions) {
  if (!rawOptions) return []
  if (Array.isArray(rawOptions)) {
    return rawOptions.map(opt => {
      if (typeof opt === 'string') return opt
      return opt?.text || opt?.value || ''
    })
  }
  if (typeof rawOptions === 'object') {
    return Object.keys(rawOptions)
      .sort()
      .map(key => rawOptions[key])
  }
  return []
}

function stripSimilarQuestionsSection(markdownText) {
  if (!markdownText) return ''
  const marker = '## 举一反三'
  const index = markdownText.indexOf(marker)
  if (index === -1) return markdownText
  return markdownText.slice(0, index).trim()
}

function normalizeAnswer(type, answer) {
  if (answer === null || answer === undefined) return null
  if (Array.isArray(answer)) return answer.map(toOptionIndex).filter(v => v !== null)
  if (typeof answer === 'object') {
    if (Array.isArray(answer.selected_ids)) {
      return answer.selected_ids.map(toOptionIndex).filter(v => v !== null)
    }
    if (answer.selected !== undefined) {
      return toOptionIndex(answer.selected)
    }
    if (answer.text !== undefined) {
      return answer.text
    }
  }
  if (type === 'fill' || type === 'essay') {
    return String(answer)
  }
  const parsed = toOptionIndex(answer)
  if (parsed !== null) return parsed
  if (typeof answer === 'string' && answer.includes(',')) {
    return answer.split(',').map(item => toOptionIndex(item)).filter(v => v !== null)
  }
  return answer
}

function toOptionIndex(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const firstCharCode = trimmed.charCodeAt(0)
  if (firstCharCode >= 65 && firstCharCode <= 90) {
    return firstCharCode - 65
  }
  return null
}

function isCorrectOption(index) {
  if (Array.isArray(question.value.correctAnswer)) {
    return question.value.correctAnswer.includes(index)
  }
  return question.value.correctAnswer === index
}

function isUserSelected(index) {
  if (Array.isArray(question.value.userAnswer)) {
    return question.value.userAnswer.includes(index)
  }
  return question.value.userAnswer === index
}

function isWrongOption(index) {
  return isUserSelected(index) && !isCorrectOption(index)
}

function formatAnswerDisplay(answer) {
  if (answer === null || answer === undefined || answer === '') return '未作答'
  if (Array.isArray(answer)) {
    if (answer.length === 0) return '未作答'
    return answer.map(item => formatAnswerDisplay(item)).join(', ')
  }
  if (typeof answer === 'number') {
    return String.fromCharCode(65 + answer)
  }
  if (typeof answer === 'string') {
    return answer
  }
  if (typeof answer === 'object' && answer.text) {
    return answer.text
  }
  return String(answer)
}

async function loadRelatedDocuments(detailData) {
  try {
    const tags = Array.isArray(detailData.knowledge_points) ? detailData.knowledge_points.map(item => item.id).filter(Boolean) : []
    const data = await getRelatedDocuments({
      mistake_id: Number(mistakeId.value),
      question_id: detailData.question?.id,
      question_set_id: detailData.question_set_id,
      tags: tags.length > 0 ? tags.join(',') : undefined,
      limit: 5
    })
    const docs = Array.isArray(data)
      ? data
      : (Array.isArray(data?.documents) ? data.documents : [])
    recommendedDocs.value = docs.map(item => ({
      id: item.id,
      title: item.title || `文档 ${item.id}`,
      category: item.file_type || '文档',
      relevance: Math.round((item.relevance_score || 0) * 100)
    }))
  } catch (error) {
    console.error('获取相关文档失败:', error)
    recommendedDocs.value = []
  }
}

async function loadRelatedQuestions() {
  relatedQuestionsLoading.value = true
  generatingMessage.value = '正在生成强化练习题，请稍候...'
  const startTime = Date.now()
  try {
    const aiData = await startReinforcementApi({
      mistake_id: Number(mistakeId.value),
      question_count: Number(generateCount.value || 2)
    })
    const elapsed = Date.now() - startTime
    if (elapsed < 900) {
      await new Promise(resolve => setTimeout(resolve, 900 - elapsed))
    }
    relatedSessionId.value = aiData?.session_id || null
    updateReinforcementCapacity(aiData)
    if (relatedSessionId.value && !Number.isFinite(Number(aiData?.question_total_count))) {
      await syncQuestionCountFromSession(relatedSessionId.value)
    }
    relatedQuestions.value = mapSimilarQuestionsForPanel(aiData?.questions || [])
    selectedRelatedQuestionKeys.value = []
    if (!canAddMoreReinforcement.value) {
      ElMessage.info(`当前强化练习已满 ${maxReinforcementQuestions.value} 题，仅可练习不可继续加入`)
    }
    return true
  } catch (error) {
    console.error('获取相关题目失败:', error)
    relatedSessionId.value = null
    relatedQuestions.value = []
    selectedRelatedQuestionKeys.value = []
    return false
  } finally {
    relatedQuestionsLoading.value = false
    generatingMessage.value = ''
  }
}

async function generateReinforcementQuestions() {
  const loaded = await loadRelatedQuestions()
  if (!loaded) {
    ElMessage.error('生成强化题失败，请稍后重试')
    return
  }
  if (relatedQuestions.value.length === 0) {
    ElMessage.warning('未生成到可展示题目，请调整后重试')
    return
  }
  ElMessage.success(`强化题目已生成，可再加入 ${remainingReinforcementSlots.value} 题`)
}

function mapSimilarQuestionsForPanel(source) {
  return (source || []).map((item, index) => ({
    uiKey: item.id ? `saved-${item.id}` : `generated-${index + 1}-${String(item.stem || '').slice(0, 20)}`,
    id: item.id,
    reinforcementQuestionId: item.id && String(item.id).startsWith('temp-') ? null : item.id,
    title: item.stem || `练习题 ${item.id}`,
    type: item.type || 'single',
    rawDifficulty: item.difficulty || 'medium',
    options: normalizeOptions(item.options),
    answerRaw: resolveAnswerRaw(item),
    correctAnswer: normalizeAnswer(item.type || 'single', resolveAnswerRaw(item)),
    explanation: item.explanation || '',
    isSelected: !!item.is_selected,
    isSaved: !!item.is_saved
  }))
}

function normalizeReinforcementQuestions(source) {
  return (source || []).map((item, index) => ({
    id: item.id || `reinforce-${index + 1}`,
    reinforcementQuestionId: item.reinforcementQuestionId || item.id,
    title: item.stem || item.title || `强化练习 ${index + 1}`,
    subject: 'math',
    type: item.type || 'single',
    content: item.stem || item.title || '',
    options: normalizeOptions(item.options),
    correctAnswer: normalizeAnswer(item.type || 'single', resolveAnswerRaw(item)),
    difficulty: item.difficulty || 'medium',
    analysis: item.explanation || '',
    answerRaw: resolveAnswerRaw(item),
    skipped: false
  }))
}
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

.title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.generate-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin: 0 14px 14px 14px;
}

.analysis-text :deep(h1),
.analysis-text :deep(h2),
.analysis-text :deep(h3) {
  margin: 8px 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.analysis-text :deep(p) {
  margin: 6px 0;
}

.analysis-text :deep(ul),
.analysis-text :deep(ol) {
  padding-left: 22px;
  margin: 8px 0;
}

.analysis-text :deep(code) {
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
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
  max-height: 460px;
  overflow-y: auto;
}

.generating-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.empty-generated {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.slots-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.related-question-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
  gap: 8px;
}

.question-select {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}

.question-meta-row {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}

.question-options-preview {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-option {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
}

.no-options-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
