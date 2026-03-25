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
import { ref, reactive, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import QuestionNavigator from '@/components/practice/QuestionNavigator.vue'
import SingleQuestion from '@/components/question/SingleQuestion.vue'
import MultiQuestion from '@/components/question/MultiQuestion.vue'
import JudgeQuestion from '@/components/question/JudgeQuestion.vue'
import FillQuestion from '@/components/question/FillQuestion.vue'
import EssayQuestion from '@/components/question/EssayQuestion.vue'

const sets = ref([
  {
    id: 'set1',
    name: '数学基础题库',
    questions: [
      { id: 'q1', type: 'single', stem: '2+2=?', options: [{key:'A',text:'3'},{key:'B',text:'4'},{key:'C',text:'5'}], answer: 'B', explanation: '2+2=4', difficulty: '简单', knowledge: '基础运算' },
      { id: 'q2', type: 'multi', stem: '下列哪些是质数？', options: [{key:'A',text:'2'},{key:'B',text:'4'},{key:'C',text:'3'}], answer: ['A','C'], explanation: '2和3是质数', difficulty: '中等', knowledge: '质数' },
      { id: 'q3', type: 'judge', stem: '0 是自然数。', answer: true, explanation: '按常规定义，0 是自然数', difficulty: '简单', knowledge: '自然数' },
      { id: 'q4', type: 'fill', stem: '圆的周长公式：C=', answer: '2πr', explanation: '周长=2πr', difficulty: '简单', knowledge: '圆的周长' },
      { id: 'q5', type: 'essay', stem: '简述勾股定理。', answer: '', explanation: '直角三角形斜边的平方等于两直角边平方和', difficulty: '难', knowledge: '勾股定理' }
    ]
  },
  {
    id: 'set2',
    name: '英语基础题库',
    questions: [
      { id: 'e1', type: 'single', stem: 'What is plural of "child"?', options:[{key:'A',text:'childs'},{key:'B',text:'children'},{key:'C',text:'childes'}], answer: 'B', explanation: '', difficulty: '简单', knowledge: '名词复数' }
    ]
  }
])

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
const report = reactive({ correctCount: 0, wrongCount: 0, score: 0, totalScore: 0, timeUsed: 0 })

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

function onSelectSet() {
  loadQuestions()
}

function loadQuestions() {
  loading.value = true
  const set = currentSet.value
  if (!set) {
    questions.value = []
    loading.value = false
    return
  }

  questions.value = set.questions.map(q => ({ ...q }))
  Object.keys(userAnswers).forEach(k => delete userAnswers[k])
  Object.keys(feedbackMap).forEach(k => delete feedbackMap[k])
  Object.keys(correctMap).forEach(k => delete correctMap[k])
  showExplanationSplit.value = false
  showReport.value = false
  currentIndex.value = 0
  examStarted.value = false
  loading.value = false
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

function submitExam() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  let correct = 0
  questions.value.forEach(q => {
    const qid = q.id
    computeCorrectnessFor(qid)
    if (correctMap[qid]) correct += 1
  })
  
  report.correctCount = correct
  report.wrongCount = questions.value.length - correct
  report.totalScore = questions.value.length
  report.score = correct
  report.timeUsed = (questions.value.length * timePerQuestion.value) - timeLeft.value
  showReport.value = true
  examStarted.value = false
}

function viewAllExplanations() {
  ElMessage({ message: '查看全部解析功能开发中', type: 'info' })
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

function saveProgress() {
  localStorage.setItem('practice_progress_' + (selectedSetId.value || 'none'), JSON.stringify(userAnswers))
  ElMessage({ message: '进度已保存（本地）', type: 'success' })
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
}

.page-controls {
  display:flex;
  gap:16px;
  align-items:center;
  margin-bottom:16px;
  font-size: 20px;
}

.page-controls .el-select {
  font-size: 20px;
  width: 60%;
}

.page-controls .el-button,
.page-controls .el-input-number {
  font-size: 20px;
  margin-top: 2px;
}

.page-controls .el-radio-group {
  transform: scale(1.45);
  margin-left: 20px;
  padding: 15px;
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
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16px;
  font-size: 16px;
}

.control-row .el-button {
  font-size: 16px;
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

.explanation-card {
  height: 100%;
  background: transparent;
  border: none;
  box-shadow: none;
}

.explanation-card h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 8px;
  margin-top: 12px;
}

.explanation-card h3:first-child {
  margin-top: 0;
}

.correct-answer {
  font-size: 14px;
  color: var(--color-success);
  font-weight: 600;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e9 100%);
  border-radius: 6px;
  border: 1px solid #c8e6c9;
}

.explanation-text,
.knowledge-points {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 6px;
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
  font-size: 14px;
  padding: 8px 16px;
  height: auto;
}

.report {
  margin-top:16px;
  font-size: 16px;
}

.report h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.report p {
  font-size: 16px;
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
}

@media (max-width: 992px) {
  .page-body { flex-direction:column }
  .navigator { width:100% }
  .split-view { flex-direction:column }
}
</style>
