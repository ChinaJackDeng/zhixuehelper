<template>
  <div class="paper-exam-page">
    <div class="page-controls">
      <div class="control-group">
        <el-select v-model="selectedPaperId" :disabled="examStarted" placeholder="选择试卷" clearable filterable @change="onSelectPaper" style="width: 320px">
          <el-option v-for="paper in paperList" :key="paper.id" :label="`${paper.title}（${paper.question_count}题）`" :value="paper.id" />
        </el-select>
        <el-button-group class="action-group">
          <el-button type="primary" :disabled="!selectedPaperId || paperQuestions.length === 0 || examStarted" @click="startExam" :icon="VideoPlay">开始考试</el-button>
          <el-button type="warning" :disabled="!examStarted" @click="submitExam" :icon="Check">交卷</el-button>
          <el-button type="success" plain :disabled="!selectedPaperId || examStarted" @click="openExportDialog">导出试卷</el-button>
          <el-button type="danger" plain :disabled="!selectedPaperId || examStarted" :loading="deletingPaper" @click="removePaper">删除试卷</el-button>
          <el-button plain @click="goBackToPractice">返回练习</el-button>
        </el-button-group>
        <span class="countdown" v-if="examStarted">
          <el-icon><Timer /></el-icon>
          倒计时：<strong>{{ formattedTime }}</strong>
        </span>
      </div>
    </div>

    <div class="page-body" v-if="!loading">
      <div class="navigator-container" v-if="paperQuestions.length > 0">
        <QuestionNavigator
          class="navigator"
          :questions="paperQuestions"
          :currentIndex="currentIndex"
          :userAnswers="userAnswers"
          :correctMap="correctMap"
          :statusMap="questionStatusMap"
          mode="exam"
          @navigate="goToQuestion"
        />
      </div>
      <section class="question-area">
        <div class="control-row" v-if="paperQuestions.length > 0">
          <div class="set-info">
            <el-icon><Collection /></el-icon>
            试卷：<strong>{{ currentPaper?.title || '未选择' }}</strong>
          </div>
          <div class="paper-meta">
            <el-tag type="primary">当前题分值 {{ Number(currentQuestion?.score || 0) }} 分</el-tag>
            <el-tag v-if="hasSubmitted" type="success">得分 {{ submitResult.score }}/{{ submitResult.totalScore }}</el-tag>
          </div>
        </div>
        <div v-if="paperQuestions.length === 0" class="empty-area">
          <el-empty description="请选择试卷开始考试">
            <template #description><p class="empty-tip">请先选择一份已生成试卷。</p></template>
          </el-empty>
        </div>
        <div v-else class="single-view">
          <transition name="fade" mode="out-in">
            <div class="question-frame">
              <component
                :key="currentIndex"
                :is="componentFor(currentQuestion.type)"
                :question="currentQuestion"
                :index="currentIndex + 1"
                v-model="userAnswers[currentQuestion.id]"
                :showFeedback="false"
                :isCorrect="correctMap[currentQuestion.id]"
                :showExplanationToggle="false"
              />
            </div>
          </transition>
          <div class="question-nav-actions">
            <el-button class="nav-action-btn" size="large" :disabled="currentIndex === 0" @click="goToQuestion(currentIndex - 1)">上一题</el-button>
            <el-button class="nav-action-btn" size="large" :disabled="currentIndex >= paperQuestions.length - 1" type="primary" @click="goToQuestion(currentIndex + 1)">
              下一题
            </el-button>
          </div>
        </div>
        <div v-if="hasSubmitted" class="result-actions">
          <el-button type="primary" plain @click="showExplanations = !showExplanations">
            {{ showExplanations ? '收起解析' : '查看解析' }}
          </el-button>
          <el-button type="success" plain @click="showReport = !showReport">
            {{ showReport ? '收起报告' : '查看考试报告' }}
          </el-button>
        </div>
        <el-card v-if="showExplanations && hasSubmitted" class="explanation-card">
          <h3>当前题解析</h3>
          <p class="explanation-row"><strong>你的答案：</strong>{{ formatUserAnswer(currentQuestion) }}</p>
          <p class="explanation-row"><strong>正确答案：</strong>{{ getFormattedAnswer(currentQuestion) }}</p>
          <p class="explanation-row"><strong>题目解析：</strong>{{ currentQuestion?.explanation || '暂无解析' }}</p>
          <template v-if="currentQuestion?.type === 'essay' && currentEssayEvaluation">
            <p class="explanation-row"><strong>AI 批改得分：</strong>{{ Math.round(currentEssayEvaluation.score || 0) }} 分</p>
            <p class="explanation-row"><strong>AI 反馈：</strong>{{ currentEssayEvaluation.feedback || '暂无反馈' }}</p>
            <p class="explanation-row"><strong>关键词命中：</strong>{{ formatKeywordList(currentEssayEvaluation.keywordsMatched) }}</p>
            <p class="explanation-row"><strong>关键词缺失：</strong>{{ formatKeywordList(currentEssayEvaluation.keywordsMissing) }}</p>
          </template>
        </el-card>
        <el-card v-if="showReport && hasSubmitted" class="report-card">
          <h3>考试报告</h3>
          <div class="report-grid">
            <div class="report-item">
              <span>得分</span>
              <strong>{{ submitResult.score }} / {{ submitResult.totalScore }}</strong>
            </div>
            <div class="report-item">
              <span>正确题数</span>
              <strong>{{ submitResult.correctCount }}</strong>
            </div>
            <div class="report-item">
              <span>错误题数</span>
              <strong>{{ submitResult.wrongCount }}</strong>
            </div>
            <div class="report-item">
              <span>用时</span>
              <strong>{{ submitResult.timeUsed }} 秒</strong>
            </div>
          </div>
          <div class="report-actions">
            <el-button type="warning" plain :loading="addingWrongToMistakes" :disabled="submitResult.wrongCount === 0" @click="addAllWrongToMistakes">
              批量加入错题{{ submitResult.wrongCount > 0 ? `（${submitResult.wrongCount}）` : '' }}
            </el-button>
          </div>
        </el-card>
      </section>
    </div>
    <el-dialog v-model="exportDialogVisible" title="导出试卷" width="520px" append-to-body>
      <el-form :model="exportForm" label-width="110px">
        <el-form-item label="导出格式">
          <el-select v-model="exportForm.format" style="width: 100%">
            <el-option label="PDF 文档" value="pdf" />
            <el-option label="文本 TXT" value="txt" />
            <el-option label="结构化 JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.include_answers">包含参考答案</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.include_analysis">包含题目解析</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exportingPaper" @click="exportCurrentPaper">开始导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Timer, Check, VideoPlay } from '@element-plus/icons-vue'
import QuestionNavigator from '@/components/practice/QuestionNavigator.vue'
import SingleQuestion from '@/components/question/SingleQuestion.vue'
import MultiQuestion from '@/components/question/MultiQuestion.vue'
import JudgeQuestion from '@/components/question/JudgeQuestion.vue'
import FillQuestion from '@/components/question/FillQuestion.vue'
import EssayQuestion from '@/components/question/EssayQuestion.vue'
import { getPaperList, getPaperQuestions, submitPaperExam, batchAddMistakes, deletePaper, exportPaper } from '@/api/exam'

const loading = ref(false)
const route = useRoute()
const router = useRouter()
const paperList = ref([])
const selectedPaperId = ref(null)
const currentPaper = ref(null)
const paperQuestions = ref([])
const currentIndex = ref(0)
const examStarted = ref(false)
const timer = ref(null)
const deletingPaper = ref(false)
const exportingPaper = ref(false)
const exportDialogVisible = ref(false)
const timeLeft = ref(0)
const userAnswers = reactive({})
const correctMap = reactive({})
const questionStatusMap = reactive({})
const essayEvaluationMap = reactive({})
const addedMistakesSet = reactive(new Set())
const hasSubmitted = ref(false)
const showExplanations = ref(false)
const showReport = ref(false)
const addingWrongToMistakes = ref(false)
const exportForm = reactive({
  format: 'pdf',
  include_answers: true,
  include_analysis: true
})
const submitResult = reactive({
  score: 0,
  totalScore: 0,
  correctCount: 0,
  wrongCount: 0,
  timeUsed: 0
})
const currentEssayEvaluation = computed(() => {
  const qid = currentQuestion.value?.id
  if (!qid) return null
  return essayEvaluationMap[qid] || essayEvaluationMap[String(qid)] || null
})

const currentQuestion = computed(() => paperQuestions.value[currentIndex.value] || {})
const formattedTime = computed(() => {
  const total = Math.max(0, Number(timeLeft.value || 0))
  const min = String(Math.floor(total / 60)).padStart(2, '0')
  const sec = String(total % 60).padStart(2, '0')
  return `${min}:${sec}`
})

function handleResponse(response, defaultValue = null) {
  if (!response) return defaultValue
  if (response.data?.data !== undefined) return response.data.data
  if (response.data !== undefined) return response.data
  return response || defaultValue
}

function componentFor(type) {
  return {
    single: SingleQuestion,
    multi: MultiQuestion,
    judge: JudgeQuestion,
    fill: FillQuestion,
    essay: EssayQuestion
  }[type] || SingleQuestion
}

function goToQuestion(index) {
  if (index >= 0 && index < paperQuestions.value.length) {
    currentIndex.value = index
  }
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.map(item => String(item)).join('、')
  if (value === null || value === undefined || value === '') return '未作答'
  return String(value)
}

function normalizeQuestionType(type) {
  const value = String(type || '').toLowerCase()
  if (value === 'choice') return 'single'
  if (['single', 'multi', 'judge', 'fill', 'essay'].includes(value)) return value
  return 'single'
}

function normalizeDifficulty(value) {
  const difficulty = String(value || '').toLowerCase()
  if (['easy', 'medium', 'hard'].includes(difficulty)) return difficulty
  return 'medium'
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.map((item, index) => {
      if (item && typeof item === 'object') {
        const key = item.key ?? item.label ?? String.fromCharCode(65 + index)
        const text = item.text ?? item.value ?? ''
        return { key: String(key), text: String(text) }
      }
      return { key: String.fromCharCode(65 + index), text: String(item ?? '') }
    })
  }

  if (options && typeof options === 'object') {
    return Object.entries(options).map(([key, text]) => ({
      key: String(key),
      text: String(text ?? '')
    }))
  }

  return []
}

function normalizePaperQuestion(question) {
  const normalized = {
    ...question,
    type: normalizeQuestionType(question?.type),
    difficulty: normalizeDifficulty(question?.difficulty)
  }
  if (['single', 'multi'].includes(normalized.type)) {
    normalized.options = normalizeOptions(question?.options)
  } else {
    normalized.options = Array.isArray(question?.options) ? question.options : []
  }
  return normalized
}

function sortPaperQuestions(list = []) {
  const typeOrder = { single: 1, multi: 2, fill: 3, essay: 4, judge: 5 }
  return [...list].sort((a, b) => {
    const aOrder = typeOrder[String(a?.type || '').toLowerCase()] ?? 99
    const bOrder = typeOrder[String(b?.type || '').toLowerCase()] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return Number(a?.order || 0) - Number(b?.order || 0)
  })
}

function formatKeywordList(value) {
  if (!Array.isArray(value) || value.length === 0) return '无'
  return value.map(item => String(item)).join('、')
}

function getFormattedAnswer(question) {
  if (!question) return '暂无'
  return normalizeAnswer(question.answer)
}

function formatUserAnswer(question) {
  if (!question) return '未作答'
  return normalizeAnswer(userAnswers[question.id])
}

async function loadPaperList() {
  try {
    loading.value = true
    const response = await getPaperList()
    const data = handleResponse(response, [])
    paperList.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '加载试卷失败')
  } finally {
    loading.value = false
  }
}

async function onSelectPaper() {
  if (examStarted.value) {
    ElMessage.warning('考试进行中，提交后才能切换试卷')
    return
  }
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  examStarted.value = false
  hasSubmitted.value = false
  showExplanations.value = false
  showReport.value = false
  if (!selectedPaperId.value) {
    currentPaper.value = null
    paperQuestions.value = []
    currentIndex.value = 0
    Object.keys(essayEvaluationMap).forEach(key => delete essayEvaluationMap[key])
    addedMistakesSet.clear()
    return
  }
  try {
    loading.value = true
    const response = await getPaperQuestions(selectedPaperId.value)
    const data = handleResponse(response, null)
    currentPaper.value = data
    const normalized = Array.isArray(data?.questions) ? data.questions.map(item => normalizePaperQuestion(item)) : []
    paperQuestions.value = sortPaperQuestions(normalized)
    currentIndex.value = 0
    Object.keys(userAnswers).forEach(key => delete userAnswers[key])
    Object.keys(correctMap).forEach(key => delete correctMap[key])
    Object.keys(questionStatusMap).forEach(key => delete questionStatusMap[key])
    Object.keys(essayEvaluationMap).forEach(key => delete essayEvaluationMap[key])
    addedMistakesSet.clear()
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '加载试卷题目失败')
  } finally {
    loading.value = false
  }
}

function onBeforeWindowUnload(event) {
  if (!examStarted.value) return
  event.preventDefault()
  event.returnValue = ''
}

async function goBackToPractice() {
  if (examStarted.value) {
    ElMessage.warning('考试进行中，提交试卷后才能退出')
    return
  }
  await router.push({ name: 'Practice' })
}

async function removePaper() {
  if (!selectedPaperId.value) {
    ElMessage.warning('请先选择试卷')
    return
  }
  if (examStarted.value) {
    ElMessage.warning('考试进行中，不能删除试卷')
    return
  }
  try {
    await ElMessageBox.confirm('删除后无法恢复，确认删除该试卷吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    deletingPaper.value = true
    await deletePaper(selectedPaperId.value)
    paperList.value = paperList.value.filter(item => item.id !== selectedPaperId.value)
    selectedPaperId.value = null
    currentPaper.value = null
    paperQuestions.value = []
    currentIndex.value = 0
    Object.keys(userAnswers).forEach(key => delete userAnswers[key])
    Object.keys(correctMap).forEach(key => delete correctMap[key])
    Object.keys(questionStatusMap).forEach(key => delete questionStatusMap[key])
    Object.keys(essayEvaluationMap).forEach(key => delete essayEvaluationMap[key])
    addedMistakesSet.clear()
    hasSubmitted.value = false
    showExplanations.value = false
    showReport.value = false
    ElMessage.success('试卷已删除')
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '删除试卷失败')
  } finally {
    deletingPaper.value = false
  }
}

function openExportDialog() {
  if (!selectedPaperId.value) {
    ElMessage.warning('请先选择试卷')
    return
  }
  if (examStarted.value) {
    ElMessage.warning('考试进行中，不能导出试卷')
    return
  }
  exportDialogVisible.value = true
}

function resolveDownloadFilename(headers = {}, fallbackName = 'paper.txt') {
  const contentDisposition = headers?.['content-disposition'] || headers?.['Content-Disposition'] || ''
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (plainMatch?.[1]) return plainMatch[1]
  return fallbackName
}

async function exportCurrentPaper() {
  if (!selectedPaperId.value) {
    ElMessage.warning('请先选择试卷')
    return
  }
  try {
    exportingPaper.value = true
    const response = await exportPaper(selectedPaperId.value, {
      format: exportForm.format,
      include_answers: exportForm.include_answers,
      include_analysis: exportForm.include_analysis
    })
    const blob = response instanceof Blob
      ? response
      : response?.data instanceof Blob
        ? response.data
        : new Blob([response || ''], { type: 'text/plain;charset=utf-8' })
    const fallbackName = `${(currentPaper.value?.title || `paper_${selectedPaperId.value}`).replace(/[\\/:*?"<>|]/g, '_')}.${exportForm.format}`
    const filename = resolveDownloadFilename(response?.headers || {}, fallbackName)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    exportDialogVisible.value = false
    ElMessage.success('试卷导出成功')
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '导出试卷失败')
  } finally {
    exportingPaper.value = false
  }
}

function startTimer() {
  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      clearInterval(timer.value)
      timer.value = null
      submitExam({ skipConfirm: true })
    }
  }, 1000)
}

function startExam() {
  if (!currentPaper.value || paperQuestions.value.length === 0) {
    ElMessage.warning('请先选择试卷')
    return
  }
  examStarted.value = true
  hasSubmitted.value = false
  showExplanations.value = false
  showReport.value = false
  timeLeft.value = Math.max(60, Number(currentPaper.value.duration_minutes || 60) * 60)
  currentIndex.value = 0
  startTimer()
  ElMessage.success('考试已开始')
}

async function submitExam(options = {}) {
  if (!selectedPaperId.value || !examStarted.value) return
  const skipConfirm = Boolean(options.skipConfirm)
  if (!skipConfirm) {
    try {
      await ElMessageBox.confirm('确认交卷吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
  }
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  const configuredTotal = Math.max(60, Number(currentPaper.value?.duration_minutes || 60) * 60)
  const timeUsed = Math.max(0, configuredTotal - Number(timeLeft.value || 0))
  const answers = Object.fromEntries(
    paperQuestions.value.map(q => [String(q.id), userAnswers[q.id] ?? ''])
  )
  try {
    const response = await submitPaperExam(selectedPaperId.value, {
      answers,
      time_used: timeUsed
    })
    const data = handleResponse(response, {})
    const correctness = data?.correctness || {}
    const essayEvaluations = data?.essay_evaluations || {}
    Object.keys(correctMap).forEach(key => delete correctMap[key])
    Object.assign(correctMap, correctness)
    Object.keys(essayEvaluationMap).forEach(key => delete essayEvaluationMap[key])
    Object.entries(essayEvaluations).forEach(([qid, item]) => {
      essayEvaluationMap[qid] = {
        score: Number(item?.score || 0),
        feedback: item?.feedback || '',
        keywordsMatched: Array.isArray(item?.keywords_matched) ? item.keywords_matched : [],
        keywordsMissing: Array.isArray(item?.keywords_missing) ? item.keywords_missing : []
      }
    })
    paperQuestions.value.forEach(q => {
      const qid = String(q.id)
      const ans = answers[qid]
      if (ans === '' || ans === null || ans === undefined || (Array.isArray(ans) && ans.length === 0)) {
        questionStatusMap[qid] = 'unanswered'
      } else if (correctness[qid] === true) {
        questionStatusMap[qid] = 'correct'
      } else {
        questionStatusMap[qid] = 'wrong'
      }
    })
    submitResult.score = Number(data?.score ?? 0)
    submitResult.totalScore = Number(data?.total_score ?? 0)
    submitResult.correctCount = Number(data?.correct_count ?? 0)
    submitResult.wrongCount = Number(data?.wrong_count ?? 0)
    submitResult.timeUsed = Number(data?.time_used ?? timeUsed)
    examStarted.value = false
    hasSubmitted.value = true
    ElMessage.success(`交卷成功：${data?.score ?? 0}/${data?.total_score ?? 0}`)
    try {
      await ElMessageBox.confirm('交卷完成，是否查看当前题解析？', '提交成功', {
        type: 'success',
        confirmButtonText: '查看解析',
        cancelButtonText: '查看报告',
        distinguishCancelAndClose: true
      })
      showExplanations.value = true
    } catch (action) {
      if (action === 'cancel') {
        showReport.value = true
      }
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '交卷失败')
  }
}

async function addAllWrongToMistakes() {
  const wrongQuestions = paperQuestions.value.filter(q => {
    const qid = String(q.id)
    return correctMap[qid] === false && !addedMistakesSet.has(qid)
  })

  if (wrongQuestions.length === 0) {
    ElMessage.info('所有错题已在错题集中')
    return
  }

  const payload = wrongQuestions.map(q => ({
    question_id: q.id,
    question_set_id: q.question_set_id ?? undefined,
    user_answer: userAnswers[q.id]
  }))

  try {
    addingWrongToMistakes.value = true
    const response = await batchAddMistakes({ questions: payload })
    const data = handleResponse(response, {})
    wrongQuestions.forEach(q => addedMistakesSet.add(String(q.id)))
    const addedCount = Number(data?.added ?? wrongQuestions.length)
    const alreadyCount = Number(data?.already_exists ?? 0)
    if (alreadyCount > 0) {
      ElMessage.success(`已新增 ${addedCount} 道，跳过 ${alreadyCount} 道已存在错题`)
    } else {
      ElMessage.success(`已添加 ${addedCount} 道错题到错题集`)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.detail || '批量加入错题集失败')
  } finally {
    addingWrongToMistakes.value = false
  }
}

onMounted(async () => {
  await loadPaperList()
  window.addEventListener('beforeunload', onBeforeWindowUnload)
  const queryPaperId = Number(route.query?.paper_id || 0)
  if (queryPaperId > 0 && paperList.value.some(item => item.id === queryPaperId)) {
    selectedPaperId.value = queryPaperId
    await onSelectPaper()
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
  window.removeEventListener('beforeunload', onBeforeWindowUnload)
})

onBeforeRouteLeave((to, from, next) => {
  if (!examStarted.value) {
    next()
    return
  }
  ElMessage.warning('考试进行中，提交试卷后才能退出')
  next(false)
})
</script>

<style scoped>
.paper-exam-page {
  min-height: calc(100vh - 72px);
  padding: 20px;
  background: #f5f7fb;
}

.page-controls {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  margin-bottom: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.countdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #dc2626;
  font-weight: 600;
}

.page-body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
}

.navigator-container,
.question-area {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.navigator-container {
  padding: 12px;
}

.question-area {
  padding: 16px;
}

.control-row {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.set-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #111827;
}

.paper-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.single-view {
  margin-top: 8px;
}

.question-nav-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.nav-action-btn {
  min-width: 112px;
  font-size: 15px;
}

.question-frame {
  border: 1px solid #e6eaf1;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
}

.empty-area {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-tip {
  color: #9ca3af;
  font-size: 13px;
}

.result-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.explanation-card,
.report-card {
  margin-top: 14px;
}

.explanation-row {
  margin: 8px 0;
  color: #374151;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
}

.report-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.report-item span {
  color: #6b7280;
  font-size: 13px;
}

.report-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .page-body {
    grid-template-columns: 1fr;
  }

  .navigator-container {
    order: 2;
  }

  .question-area {
    order: 1;
  }

  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
