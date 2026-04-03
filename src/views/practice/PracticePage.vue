<!-- src/views/practice/PracticePage.vue -->
<template>
  <div class="practice-page">
    <div class="page-controls">
      <el-select v-model="selectedSetId" placeholder="选择题集" clearable @change="onSelectSet">
        <el-option v-for="set in sets" :key="set.id" :label="set.name" :value="set.id" />
      </el-select>

      <el-button type="danger" :disabled="!selectedSetId" @click="deleteSet">删除题集</el-button>

      <el-radio-group v-model="mode" size="small" style="margin-left:15px">
        <el-radio-button label="practice">练习模式</el-radio-button>
        <el-radio-button label="exam">考试模式</el-radio-button>
      </el-radio-group>

      <template v-if="mode === 'exam'">
        <el-input-number v-model="timePerQuestion" :min="10" :max="3600" label="每题秒数" size="small" style="margin-left:12px" />
        <el-button type="primary" @click="startExam">开始考试</el-button>
      </template>
    </div>

    <div class="page-body" v-if="!loading">
      <div class="navigator-container">
        <QuestionNavigator
          class="navigator"
          :questions="questions"
          :currentIndex="currentIndex"
          :userAnswers="userAnswers"
          :correctMap="correctMap"
          :mode="mode"
          @navigate="goToQuestion"
        />
      </div>

      <section class="question-area">
        <div class="control-row">
          <div>题集：<strong>{{ currentSet?.name || '未选择' }}</strong></div>
          <div v-if="mode === 'exam' && examStarted">
            <span>倒计时：<strong>{{ formattedTime }}</strong></span>
            <el-button size="small" type="warning" @click="submitExam">交卷</el-button>
          </div>
          <div v-else-if="mode === 'practice'">
            <el-button size="small" type="success" @click="saveProgress">保存进度</el-button>
          </div>
        </div>

        <div v-if="questions.length === 0" class="empty-area">
          <el-empty description="请选择题集开始练习" />
        </div>

        <div v-else class="question-container">
          <div v-if="showExplanationSplit" class="split-view">
            <div class="split-left">
              <component
                :is="componentFor(currentQuestion.type)"
                :question="currentQuestion"
                :index="currentIndex + 1"
                v-model="userAnswers[currentQuestion.id]"
                :showFeedback="false"
                :isCorrect="correctMap[currentQuestion.id]"
                :showExplanationToggle="false"
              />
            </div>
            <div class="split-right">
              <el-card class="explanation-card">
                <h3>正确答案</h3>
                <p class="correct-answer">{{ formattedAnswer }}</p>
                <h3>详细解析</h3>
                <p class="explanation-text">{{ currentQuestion.explanation || '暂无解析' }}</p>
                <h3>知识点</h3>
                <p class="knowledge-points">{{ currentQuestion.knowledge || '暂无知识点' }}</p>
              </el-card>
            </div>
          </div>
          <div v-else class="single-view">
            <component
              :is="componentFor(currentQuestion.type)"
              :question="currentQuestion"
              :index="currentIndex + 1"
              v-model="userAnswers[currentQuestion.id]"
              :showFeedback="mode === 'practice' && feedbackMap[currentQuestion.id]"
              :isCorrect="correctMap[currentQuestion.id]"
              :showExplanationToggle="false"
            />
          </div>
        </div>

        <div class="question-actions-fixed">
          <el-button :disabled="currentIndex === 0" @click="goToQuestion(currentIndex - 1)">上一题</el-button>
          <el-button :disabled="currentIndex === questions.length - 1" @click="goToQuestion(currentIndex + 1)">下一题</el-button>
          
          <template v-if="mode === 'practice'">
            <el-button v-if="!showExplanationSplit" type="primary" @click="toggleExplanation">查看解析</el-button>
            <el-button v-else @click="toggleExplanation">收起解析</el-button>
            <el-button type="success" @click="checkAnswer">检查答案</el-button>
            <el-button type="warning" @click="addToMistakes">加入错题集</el-button>
            <el-button type="info" @click="openReviewDialog">复核题目</el-button>
          </template>
        </div>

        <div v-if="showReport" class="report">
          <el-card>
            <h3>考试报告</h3>
            <p>总题数：{{ questions.length }}</p>
            <p>已答对：{{ report.correctCount }}</p>
            <p>已答错：{{ report.wrongCount }}</p>
            <p>得分：{{ report.score }} / {{ report.totalScore }}</p>
            <p>用时：{{ report.timeUsed }} 秒</p>
            <div class="report-actions">
              <el-button type="primary" @click="viewAllExplanations">查看全部解析</el-button>
              <el-button type="success" @click="addAllWrongToMistakes">批量加入错题集</el-button>
            </div>
          </el-card>
        </div>
      </section>
    </div>

    <div v-if="loading" class="page-body">
      <el-empty description="加载中..." />
    </div>

    <el-dialog v-model="reviewDialogVisible" title="复核题目" width="700px" append-to-body>
      <el-form :model="reviewingQuestion" label-position="top">
        <el-form-item label="题目描述">
          <el-input v-model="reviewingQuestion.stem" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="选项" v-if="['single', 'multi'].includes(reviewingQuestion.type)">
          <div v-for="(opt, idx) in reviewingQuestion.options" :key="idx" class="option-editor">
            <el-input v-model="opt.text" placeholder="选项内容" />
          </div>
        </el-form-item>
        
        <el-form-item label="答案">
          <el-input v-model="reviewingQuestion.answer" placeholder="输入答案" />
        </el-form-item>
        
        <el-form-item label="解析">
          <el-input v-model="reviewingQuestion.explanation" type="textarea" :rows="3" placeholder="题目解析..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReview">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import QuestionNavigator from '@/components/practice/QuestionNavigator.vue'
import SingleQuestion from '@/components/question/SingleQuestion.vue'
import MultiQuestion from '@/components/question/MultiQuestion.vue'
import JudgeQuestion from '@/components/question/JudgeQuestion.vue'
import FillQuestion from '@/components/question/FillQuestion.vue'
import EssayQuestion from '@/components/question/EssayQuestion.vue'
import {
  getQuestionSets,
  getQuestionSetDetail,
  savePracticeProgress,
  getPracticeProgress,
  submitExam as submitExamApi,
  getExamReport
} from '@/api/exam'

const sets = ref([])
const loading = ref(false)
const selectedSetId = ref(null)
const currentSet = computed(() => sets.value.find(s => s.id === selectedSetId.value))
const questions = ref([])

const mode = ref('practice')
const timePerQuestion = ref(60)
const timer = ref(null)
const timeLeft = ref(0)
const examStarted = ref(false)

const currentIndex = ref(0)
const userAnswers = reactive({})
const feedbackMap = reactive({})
const correctMap = reactive({})
const showExplanationSplit = ref(false)

const showReport = ref(false)
const report = reactive({ correctCount: 0, wrongCount: 0, score: 0, totalScore: 0, timeUsed: 0, examId: null })

const reviewDialogVisible = ref(false)
const reviewingQuestion = ref({})

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

const formattedAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q) return ''
  const { answer, type } = q
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
})

onMounted(async () => {
  await loadQuestionSets()
})

async function loadQuestionSets() {
  try {
    loading.value = true
    const response = await getQuestionSets()
    console.log('题集列表响应:', response)
    
    // 检查响应结构
    if (Array.isArray(response)) {
      // 直接返回数组的情况
      sets.value = response
    } else if (response && response.data && response.data.data) {
      // 完整结构：{ data: { data: [...] } }
      sets.value = response.data.data || []
    } else if (response && response.data) {
      // 简化结构：{ data: [...] }
      sets.value = response.data || []
    } else {
      sets.value = []
    }
  } catch (error) {
    console.error('加载题集列表失败:', error)
    ElMessage.error('加载题集列表失败')
    sets.value = []
  } finally {
    loading.value = false
  }
}

function onSelectSet() {
  loadQuestions()
}

function normalizeQuestion(q) {
  const converted = { ...q }
  
  // 转换题型
  if (converted.type === 'choice') {
    converted.type = 'single'
  }
  
  // 转换选项格式：从对象 { A: "...", B: "..." } 转为数组 [{ key: "A", text: "..." }, ...]
  if (converted.options && typeof converted.options === 'object' && !Array.isArray(converted.options)) {
    converted.options = Object.entries(converted.options).map(([key, text]) => ({ key, text }))
  }
  
  return converted
}

async function loadQuestions() {
  if (!selectedSetId.value) {
    questions.value = []
    return
  }

  try {
    loading.value = true
    const response = await getQuestionSetDetail(selectedSetId.value)
    console.log('题集详情响应:', response)
    
    // 检查响应结构
    if (Array.isArray(response)) {
      // 直接返回数组的情况
      questions.value = response.map(q => normalizeQuestion(q))
    } else if (response && response.data && response.data.data) {
      // 完整结构：{ data: { data: { questions: [...] } } }
      questions.value = (response.data.data.questions || []).map(q => normalizeQuestion(q))
    } else if (response && response.data) {
      // 简化结构：{ data: { questions: [...] } }
      questions.value = (response.data.questions || []).map(q => normalizeQuestion(q))
    } else if (response && response.questions) {
      // 直接返回对象：{ questions: [...] }
      questions.value = (response.questions || []).map(q => normalizeQuestion(q))
    } else {
      questions.value = []
    }
    
    Object.keys(userAnswers).forEach(k => delete userAnswers[k])
    Object.keys(feedbackMap).forEach(k => delete feedbackMap[k])
    Object.keys(correctMap).forEach(k => delete correctMap[k])
    showExplanationSplit.value = false
    showReport.value = false
    currentIndex.value = 0
    examStarted.value = false
    
    await loadPracticeProgress()
  } catch (error) {
    console.error('加载题目失败:', error)
    ElMessage.error('加载题目失败')
    questions.value = []
  } finally {
    loading.value = false
  }
}

async function loadPracticeProgress() {
  if (!selectedSetId.value) return
  
  try {
    const response = await getPracticeProgress(selectedSetId.value)
    console.log('练习进度响应:', response)
    
    // 检查响应结构
    if (response && response.data && response.data.data) {
      if (response.data.data.answers) {
        Object.assign(userAnswers, response.data.data.answers)
      }
    } else if (response && response.data) {
      // 兼容直接返回数据的情况
      if (response.data.answers) {
        Object.assign(userAnswers, response.data.answers)
      }
    }
  } catch (error) {
    console.error('加载练习进度失败:', error)
  }
}

function deleteSet() {
  if (!selectedSetId.value) return
  const idx = sets.value.findIndex(s => s.id === selectedSetId.value)
  if (idx >= 0) sets.value.splice(idx, 1)
  selectedSetId.value = null
  questions.value = []
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

function goToQuestion(idx) {
  if (idx >= 0 && idx < questions.value.length) {
    currentIndex.value = idx
    showExplanationSplit.value = false
  }
}

function toggleExplanation() {
  showExplanationSplit.value = !showExplanationSplit.value
}

function checkAnswer() {
  const qid = currentQuestion.value.id
  feedbackMap[qid] = true
  computeCorrectnessFor(qid)
}

function computeCorrectnessFor(qid) {
  const q = questions.value.find(x => x.id === qid)
  if (!q) return
  const ans = userAnswers[qid]
  let ok = false
  if (q.type === 'multi') {
    const a = Array.isArray(ans) ? [...ans].sort() : []
    const b = Array.isArray(q.answer) ? [...q.answer].sort() : []
    ok = JSON.stringify(a) === JSON.stringify(b)
  } else if (q.type === 'judge') {
    ok = ans === q.answer
  } else if (q.type === 'fill' || q.type === 'essay') {
    ok = q.answer ? String(ans || '').trim() === String(q.answer).trim() : false
  } else {
    ok = ans === q.answer
  }
  correctMap[qid] = ok
}

function addToMistakes() {
  const q = currentQuestion.value
  if (!q) return
  
  const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]')
  const exists = mistakes.find(m => m.id === q.id)
  if (exists) {
    ElMessage({ message: '该题目已在错题集中', type: 'warning' })
    return
  }
  
  mistakes.push({
    ...q,
    userAnswer: userAnswers[q.id],
    addedAt: new Date().toISOString()
  })
  localStorage.setItem('mistakes', JSON.stringify(mistakes))
  ElMessage({ message: '已加入错题集', type: 'success' })
}

function startExam() {
  if (!questions.value.length) return
  timeLeft.value = questions.value.length * (timePerQuestion.value || 60)
  showReport.value = false
  showExplanationSplit.value = false
  Object.keys(userAnswers).forEach(k => delete userAnswers[k])
  Object.keys(correctMap).forEach(k => delete correctMap[k])
  Object.keys(feedbackMap).forEach(k => delete feedbackMap[k])
  examStarted.value = true

  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      clearInterval(timer.value)
      submitExam()
    }
  }, 1000)
}

async function submitExam() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  
  try {
    const timeUsed = (questions.value.length * timePerQuestion.value) - timeLeft.value
    
    const response = await submitExamApi({
      question_set_id: selectedSetId.value,
      answers: { ...userAnswers },
      time_used: timeUsed
    })
    
    console.log('提交考试响应:', response)
    
    // 检查响应结构
    if (response && response.data && response.data.data) {
      report.correctCount = response.data.data.correct_count
      report.wrongCount = response.data.data.wrong_count
      report.totalScore = response.data.data.total_score
      report.score = response.data.data.score
      report.timeUsed = response.data.data.time_used
      report.examId = response.data.data.exam_id
    } else if (response && response.data) {
      // 兼容直接返回数据的情况
      report.correctCount = response.data.correct_count
      report.wrongCount = response.data.wrong_count
      report.totalScore = response.data.total_score
      report.score = response.data.score
      report.timeUsed = response.data.time_used
      report.examId = response.data.exam_id
    }
    
    showReport.value = true
    examStarted.value = false
    
    ElMessage.success('考试提交成功')
  } catch (error) {
    console.error('提交考试失败:', error)
    ElMessage.error('提交考试失败')
  }
}

async function viewAllExplanations() {
  if (!report.examId) {
    ElMessage.warning('没有考试记录')
    return
  }
  
  try {
    const response = await getExamReport(report.examId)
    console.log('考试报告响应:', response)
    
    // 检查响应结构
    if (response && response.data && response.data.data) {
      if (response.data.data.correctness) {
        Object.assign(correctMap, response.data.data.correctness)
        showExplanationSplit.value = true
        ElMessage.success('已加载全部解析')
      }
    } else if (response && response.data) {
      // 兼容直接返回数据的情况
      if (response.data.correctness) {
        Object.assign(correctMap, response.data.correctness)
        showExplanationSplit.value = true
        ElMessage.success('已加载全部解析')
      }
    }
  } catch (error) {
    console.error('加载考试报告失败:', error)
    ElMessage.error('加载考试报告失败')
  }
}

function addAllWrongToMistakes() {
  const wrongQuestions = questions.value.filter(q => correctMap[q.id] === false)
  if (wrongQuestions.length === 0) {
    ElMessage({ message: '没有错题需要加入', type: 'info' })
    return
  }
  
  const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]')
  let addedCount = 0
  
  wrongQuestions.forEach(q => {
    const exists = mistakes.find(m => m.id === q.id)
    if (!exists) {
      mistakes.push({
        ...q,
        userAnswer: userAnswers[q.id],
        addedAt: new Date().toISOString()
      })
      addedCount++
    }
  })
  
  localStorage.setItem('mistakes', JSON.stringify(mistakes))
  ElMessage({ message: `已添加 ${addedCount} 道错题到错题集`, type: 'success' })
}

async function saveProgress() {
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  
  try {
    const response = await savePracticeProgress({
      question_set_id: selectedSetId.value,
      answers: { ...userAnswers }
    })
    
    console.log('保存进度响应:', response)
    ElMessage({ message: '进度已保存', type: 'success' })
  } catch (error) {
    console.error('保存进度失败:', error)
    ElMessage.error('保存进度失败')
  }
}

function openReviewDialog() {
  const q = currentQuestion.value
  if (!q) return
  
  reviewingQuestion.value = JSON.parse(JSON.stringify(q))
  reviewDialogVisible.value = true
}

function saveReview() {
  const qid = reviewingQuestion.value.id
  const idx = questions.value.findIndex(q => q.id === qid)
  
  if (idx !== -1) {
    questions.value[idx] = { ...reviewingQuestion.value }
    
    const setIdx = sets.value.findIndex(s => s.id === selectedSetId.value)
    if (setIdx !== -1) {
      const qIdx = sets.value[setIdx].questions.findIndex(q => q.id === qid)
      if (qIdx !== -1) {
        sets.value[setIdx].questions[qIdx] = { ...reviewingQuestion.value }
      }
    }
    
    ElMessage({ message: '题目复核修改已保存', type: 'success' })
  }
  
  reviewDialogVisible.value = false
}

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

const formattedTime = computed(() => {
  const s = timeLeft.value || 0
  const mm = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})
</script>

<style scoped>
.practice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #eef5ff 100%);
  padding: 24px;
  box-sizing: border-box;
  font-size: 16px;
  color: #1f2d3d;
}

.page-controls {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  flex-wrap: wrap;
}

.page-controls .el-select {
  font-size: 16px;
  width: 60%;
  min-width: 240px;
}

.page-controls .el-button,
.page-controls .el-input-number {
  font-size: 15px;
  margin-top: 0;
}

.page-controls .el-radio-group {
  transform: scale(1.08);
  margin-left: 4px;
  padding: 4px;
  transform-origin: left center;
}

.page-body { display:flex; gap:20px; position: relative; }
.navigator-container { width:30%; max-width: 300px; position: sticky; top: 20px; height: calc(100vh - 50px); overflow-y: auto; }
.question-area { 
  flex:1; 
  overflow-y: auto; 
  display: flex;
  flex-direction: column;
  position: relative;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid #dde8f7;
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(2px);
  gap: 12px;
  flex-wrap: wrap;
}

.control-row strong {
  font-size: 18px;
  font-weight: 700;
  color: #1a73e8;
}

.control-row .el-button {
  font-size: 14px;
  font-weight: 600;
}

.question-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  max-height: 75%;
  overflow: hidden;
}

.single-view,
.split-view {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 12px 12px 0 0;
  border: 1px solid #e8e8e8;
  border-bottom: none;
}

.split-view {
  display: flex;
  gap: 16px;
  padding: 24px;
}

.split-left,
.split-right {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.split-right {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border-radius: 12px;
  border: 1px solid #c1dff3;
  padding: 0;
  display: flex;
  align-items: flex-start;
}

.split-right .explanation-card {
  width: 100%;
  padding: 24px;
}

.single-view :deep(.question-card),
.single-view :deep(.question-container),
.split-left :deep(.question-card),
.split-left :deep(.question-container) {
  font-size: 16px;
  line-height: 1.7;
}

.single-view :deep(h1),
.single-view :deep(h2),
.single-view :deep(h3),
.split-left :deep(h1),
.split-left :deep(h2),
.split-left :deep(h3) {
  font-size: clamp(18px, 2vw, 24px);
  line-height: 1.35;
  font-weight: 700;
  color: #102a43;
}

.single-view :deep(.question-stem),
.split-left :deep(.question-stem),
.single-view :deep(.stem),
.split-left :deep(.stem) {
  font-size: clamp(18px, 1.9vw, 24px);
  line-height: 1.55;
  font-weight: 650;
  color: #0f172a;
}

.single-view :deep(.option-item),
.split-left :deep(.option-item),
.single-view :deep(.option),
.split-left :deep(.option) {
  font-size: clamp(16px, 1.5vw, 20px);
  line-height: 1.6;
  font-weight: 500;
}

.single-view :deep(.answer-section),
.split-left :deep(.answer-section),
.single-view :deep(.analysis-section),
.split-left :deep(.analysis-section),
.single-view :deep(.explanation-section),
.split-left :deep(.explanation-section) {
  font-size: 15px;
}

.explanation-card {
  height: 100%;
  background: transparent;
  border: none;
  box-shadow: none;
}

.explanation-card h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 10px;
  margin-top: 14px;
}

.explanation-card h3:first-child {
  margin-top: 0;
}

.correct-answer {
  font-size: 16px;
  color: var(--color-success);
  font-weight: 700;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e9 100%);
  border-radius: 8px;
  border: 1px solid #c8e6c9;
  line-height: 1.55;
}

.explanation-text,
.knowledge-points {
  font-size: 15px;
  color: #333;
  line-height: 1.75;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.question-actions-fixed {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 0 0 12px 12px;
  border: 1px solid #e8e8e8;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 0;
  flex-shrink: 0;
}

.question-actions-fixed .el-button {
  font-size: 15px;
  font-weight: 600;
  padding: 9px 18px;
  height: auto;
  transition: transform 0.18s ease, box-shadow 0.2s ease;
}

.question-actions-fixed .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(26, 115, 232, 0.16);
}

.report {
  margin-top: 16px;
  font-size: 16px;
}

.report h3 {
  font-size: 22px;
  margin-bottom: 14px;
  font-weight: 700;
  color: #0f172a;
}

.report p {
  font-size: 16px;
  line-height: 1.75;
  font-weight: 500;
  margin-bottom: 8px;
}

.report-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.empty-area { padding:40px }

.option-editor {
  margin-bottom: 10px;
}

:deep(.el-card) {
  font-size: 16px;
}

:deep(.el-empty__description) {
  font-size: 16px;
  font-weight: 500;
  color: #667085;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__input),
:deep(.el-radio-button__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  font-size: 15px;
}

:deep(.el-button) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-button:focus-visible) {
  outline: 2px solid rgba(64, 158, 255, 0.35);
  outline-offset: 2px;
}

:deep(.el-radio-button__inner) {
  font-weight: 600;
  letter-spacing: 0.2px;
}

@media (max-width: 992px) {
  .page-body { flex-direction: column }
  .navigator { width: 100% }
  .split-view { flex-direction: column }
  .page-controls {
    font-size: 15px;
    gap: 10px;
  }
  .page-controls .el-select {
    width: 100%;
  }
  .single-view :deep(.question-stem),
  .split-left :deep(.question-stem),
  .single-view :deep(.stem),
  .split-left :deep(.stem) {
    font-size: 18px;
  }
}
</style>
