<!-- src/views/practice/PracticePage.vue -->
<template>
  <div class="practice-page">
    <div class="page-controls">
      <div class="control-group">
        <span class="group-label">题集选择</span>
        <el-select v-model="selectedSetId" placeholder="选择题集" clearable @change="onSelectSet" style="width: 200px">
          <el-option v-for="set in sets" :key="set.id" :label="set.name" :value="set.id" />
        </el-select>
        <el-button-group class="action-group">
          <el-button type="danger" :disabled="!selectedSetId" @click="deleteSet" :icon="Delete">删除</el-button>
          <el-button type="info" @click="showExamHistory" :icon="Clock">历史</el-button>
        </el-button-group>
      </div>

      <div class="control-divider"></div>

      <div class="control-group">
        <span class="group-label">练习模式</span>
        <el-radio-group v-model="mode" @change="onModeChange" size="default">
          <el-radio-button label="practice">练习</el-radio-button>
          <el-radio-button label="exam">考试</el-radio-button>
        </el-radio-group>
      </div>

      <div v-if="mode === 'exam'" class="control-group exam-options">
        <div class="control-divider"></div>
        <el-input-number v-model="customDuration" :min="0" :max="7200" label="时间(秒)" size="default" style="width: 140px" placeholder="默认时间" />
        <el-checkbox v-model="randomOrder">随机排序</el-checkbox>
        <el-button type="primary" @click="startExam" :icon="VideoPlay">开始考试</el-button>
      </div>

      <div class="progress-section" v-if="questions.length > 0">
        <el-progress 
          :percentage="Math.round((Object.keys(userAnswers).length / questions.length) * 100)" 
          :stroke-width="12"
          striped
          striped-flow
          :color="mode === 'exam' ? '#409eff' : '#67c23a'"
        />
        <span class="progress-text">进度: {{ Object.keys(userAnswers).length }}/{{ questions.length }}</span>
      </div>
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
          <div class="set-info">
            <el-icon><Collection /></el-icon>
            题集：<strong>{{ currentSet?.name || '未选择' }}</strong>
          </div>
          <div v-if="mode === 'exam' && examStarted" class="exam-status">
            <span class="countdown">
              <el-icon><Timer /></el-icon>
              倒计时：<strong>{{ formattedTime }}</strong>
            </span>
            <el-button type="warning" @click="submitExam" :icon="Check">交卷</el-button>
          </div>
          <div v-else-if="mode === 'practice'" class="practice-status">
            <el-button type="success" @click="saveProgress" :icon="DocumentChecked">保存进度</el-button>
          </div>
        </div>

        <div v-if="questions.length === 0" class="empty-area">
          <el-empty description="请选择题集开始练习">
            <template #image>
              <el-icon size="100"><Document /></el-icon>
            </template>
          </el-empty>
        </div>

        <div v-else class="question-container">
          <div v-if="showAllExplanations" class="all-explanations-view">
            <el-card class="all-explanations-card">
              <template #header>
                <div class="card-header">
                  <span>全部题目解析</span>
                  <el-button type="primary" link @click="closeAllExplanations">关闭</el-button>
                </div>
              </template>
              <div class="all-questions-list">
                <div v-for="(question, index) in questions" :key="question.id" class="question-explanation-item">
                  <div class="question-header">
                    <span class="question-number">第 {{ index + 1 }} 题</span>
                    <el-tag size="small" :type="question.type === 'single' ? 'primary' : question.type === 'multi' ? 'success' : 'info'">
                      {{ question.type === 'single' ? '单选题' : question.type === 'multi' ? '多选题' : question.type === 'judge' ? '判断题' : '其他' }}
                    </el-tag>
                    <el-tag size="small" :type="correctMap[question.id] === true ? 'success' : correctMap[question.id] === false ? 'danger' : 'warning'">
                      {{ correctMap[question.id] === true ? '正确' : correctMap[question.id] === false ? '错误' : '未作答' }}
                    </el-tag>
                  </div>
                  <div class="question-content">
                    <p class="question-stem">{{ question.stem }}</p>
                    <div v-if="['single', 'multi'].includes(question.type)" class="question-options">
                      <div v-for="opt in question.options" :key="opt.key" class="option-item">
                        <span class="option-key">{{ opt.key }}.</span>
                        <span class="option-text">{{ opt.text }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="explanation-content">
                    <div class="explanation-section">
                      <h4>正确答案</h4>
                      <p>{{ getFormattedAnswer(question) }}</p>
                    </div>
                    <div class="explanation-section">
                      <h4>详细解析</h4>
                      <p>{{ question.explanation || '暂无解析' }}</p>
                    </div>
                    <div class="explanation-section">
                      <h4>知识点</h4>
                      <p>{{ question.knowledge || '暂无知识点' }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="explanation-actions">
                <el-button type="primary" @click="closeAllExplanations" :icon="Close">关闭全部解析</el-button>
              </div>
            </el-card>
          </div>
          <div v-else-if="showExplanationSplit" class="split-view">
            <div class="split-left">
              <transition name="fade" mode="out-in">
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
              </transition>
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
            <transition name="fade" mode="out-in">
              <component
                :key="currentIndex"
                :is="componentFor(currentQuestion.type)"
                :question="currentQuestion"
                :index="currentIndex + 1"
                v-model="userAnswers[currentQuestion.id]"
                :showFeedback="mode === 'practice' && feedbackMap[currentQuestion.id]"
                :isCorrect="correctMap[currentQuestion.id]"
                :showExplanationToggle="false"
              />
            </transition>
          </div>
        </div>

        <div class="question-actions-fixed">
          <div class="nav-buttons">
            <el-button :disabled="currentIndex === 0" @click="goToQuestion(currentIndex - 1)" :icon="ArrowLeft">上一题</el-button>
            <el-button :disabled="currentIndex === questions.length - 1" @click="goToQuestion(currentIndex + 1)">下一题<el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
          </div>
          
          <div class="function-buttons" v-if="mode === 'practice' && questions.length > 0">
            <el-button v-if="!showExplanationSplit" type="primary" @click="toggleExplanation">查看解析</el-button>
            <el-button v-else @click="toggleExplanation">收起解析</el-button>
            <el-button type="success" @click="checkAnswer" :icon="Finished">检查答案</el-button>
            <el-button type="warning" @click="addToMistakes" :icon="Star">加入错题集</el-button>
            <el-button type="info" @click="openReviewDialog" :icon="Edit">复核题目</el-button>
          </div>
        </div>

        <div v-if="showReport" class="report-floating" :class="{ collapsed: reportCollapsed }">
          <div class="report-header">
            <span>考试报告</span>
            <div class="report-header-actions">
              <el-button link type="primary" @click="toggleReportCollapse">
                {{ reportCollapsed ? '展开' : '收起' }}
              </el-button>
              <el-button link type="info" @click="closeReport">关闭</el-button>
            </div>
          </div>
          <div v-show="!reportCollapsed" class="report-body">
            <p>总题数：{{ questions.length }}</p>
            <p>已答对：{{ report.correctCount }}</p>
            <p>已答错：{{ report.wrongCount }}</p>
            <p>得分：{{ report.score }} / {{ report.totalScore }}</p>
            <p>用时：{{ report.timeUsed }} 秒</p>
            <div class="report-actions">
              <el-button type="primary" @click="viewAllExplanations">查看全部解析</el-button>
              <el-button type="success" @click="addAllWrongToMistakes">批量加入错题集</el-button>
            </div>
          </div>
        </div>
        <div v-else-if="report.examId" class="report-reopen">
          <el-button type="primary" plain @click="showReport = true">查看考试报告</el-button>
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
        
        <el-form-item label="题型">
          <el-select v-model="reviewingQuestion.type" placeholder="选择题型">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multi" />
            <el-option label="判断题" value="judge" />
            <el-option label="填空题" value="fill" />
            <el-option label="简答题" value="essay" />
          </el-select>
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
        
        <el-form-item label="知识点">
          <el-input v-model="reviewingQuestion.knowledge" placeholder="输入知识点" />
        </el-form-item>
        
        <el-form-item label="难度">
          <el-select v-model="reviewingQuestion.difficulty" placeholder="选择难度">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReview">保存修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="examHistoryVisible" title="成绩历史记录" width="800px" append-to-body>
      <div class="exam-history-content">
        <div class="exam-history-filter">
          <el-select v-model="selectedSetId" placeholder="筛选题集" clearable @change="loadExamHistory" style="width: 200px">
            <el-option v-for="set in sets" :key="set.id" :label="set.name" :value="set.id" />
          </el-select>
        </div>
        
        <el-table :data="examHistory" style="width: 100%" v-loading="loading">
          <el-table-column prop="question_set_name" label="题集名称" width="200" />
          <el-table-column prop="correct_count" label="正确数" width="80" />
          <el-table-column prop="wrong_count" label="错误数" width="80" />
          <el-table-column label="得分" width="100">
            <template #default="{ row }">
              {{ row.score }} / {{ row.total_score }}
            </template>
          </el-table-column>
          <el-table-column label="用时" width="100">
            <template #default="{ row }">
              {{ Math.floor(row.time_used / 60) }}:{{ (row.time_used % 60).toString().padStart(2, '0') }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="考试时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.created_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="viewExamReport(row.exam_id)">查看报告</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="exam-history-pagination">
          <el-pagination
            v-model:current-page="examHistoryPage"
            v-model:page-size="examHistoryPageSize"
            :page-sizes="[10, 20, 50]"
            :total="examHistoryTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadExamHistory"
            @current-change="loadExamHistory"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="examHistoryVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection, Timer, Check, DocumentChecked, Document,
  ArrowLeft, ArrowRight, Close, Finished,
  Star, Edit, Delete, Clock, VideoPlay
} from '@element-plus/icons-vue'
import QuestionNavigator from '@/components/practice/QuestionNavigator.vue'
import SingleQuestion from '@/components/question/SingleQuestion.vue'
import MultiQuestion from '@/components/question/MultiQuestion.vue'
import JudgeQuestion from '@/components/question/JudgeQuestion.vue'
import FillQuestion from '@/components/question/FillQuestion.vue'
import EssayQuestion from '@/components/question/EssayQuestion.vue'
import {
  getQuestionSets,
  savePracticeProgress,
  getPracticeProgress,
  submitExam as submitExamApi,
  getExamReport,
  updateQuestion,
  saveExamState,
  restoreExamState,
  getExamHistory,
  startExamWithConfig,
  getQuestionSetQuestions,
  checkExamModeSwitch,
  getQuestionDetail
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
const showAllExplanations = ref(false)

const showReport = ref(false)
const reportCollapsed = ref(false)
const report = reactive({ correctCount: 0, wrongCount: 0, score: 0, totalScore: 0, timeUsed: 0, examId: null })

const reviewDialogVisible = ref(false)
const reviewingQuestion = ref({})

const examHistoryVisible = ref(false)
const examHistory = ref([])
const examHistoryTotal = ref(0)
const examHistoryPage = ref(1)
const examHistoryPageSize = ref(10)

const customDuration = ref(0)
const randomOrder = ref(false)

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

// 辅助函数：统一处理 API 响应结构
function handleResponse(response, defaultValue = null) {
  if (!response) return defaultValue
  if (response.data?.data !== undefined) return response.data.data
  if (response.data !== undefined) return response.data
  return response || defaultValue
}

const formattedAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q) return ''
  const { answer, type } = q
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
})

function getFormattedAnswer(question) {
  if (!question) return ''
  const { answer, type } = question
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
}

function closeAllExplanations() {
  showAllExplanations.value = false
}

function handleKeydown(e) {
  // 忽略在输入框中的按键
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

  switch (e.key) {
    case 'ArrowLeft':
      if (currentIndex.value > 0) goToQuestion(currentIndex.value - 1)
      break
    case 'ArrowRight':
      if (currentIndex.value < questions.value.length - 1) goToQuestion(currentIndex.value + 1)
      break
    case '1': case '2': case '3': case '4':
      if (currentQuestion.value.type === 'single') {
        const keys = ['A', 'B', 'C', 'D']
        const key = keys[parseInt(e.key) - 1]
        if (currentQuestion.value.options?.some(o => o.key === key)) {
          userAnswers[currentQuestion.value.id] = key
        }
      }
      break
    case 'Enter':
      if (mode.value === 'practice') {
        checkAnswer()
      }
      break
    case ' ':
      if (mode.value === 'practice') {
        e.preventDefault()
        toggleExplanation()
      }
      break
  }
}

onMounted(async () => {
  await loadQuestionSets()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
  window.removeEventListener('keydown', handleKeydown)
})

async function loadQuestionSets() {
  try {
    loading.value = true
    const response = await getQuestionSets()
    const data = handleResponse(response, [])
    sets.value = Array.isArray(data) ? data : (data.data || [])
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

async function onModeChange(newMode) {
  if (!selectedSetId.value) {
    mode.value = newMode
    return
  }
  
  try {
    const response = await checkExamModeSwitch({
      question_set_id: selectedSetId.value,
      current_mode: mode.value,
      target_mode: newMode
    })
    
    const data = handleResponse(response)
    if (data?.has_unfinished_exam && !data?.can_switch) {
      ElMessageBox.confirm(
        '当前有未完成的考试，切换模式将丢失考试进度。确定要切换吗？',
        '提示',
        {
          confirmButtonText: '确定切换',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        mode.value = newMode
        ElMessage.success('模式已切换')
      }).catch(() => {
        // 取消切换，保持原模式
      })
    } else {
      mode.value = newMode
    }
  } catch (error) {
    console.error('模式切换检查失败:', error)
    mode.value = newMode
  }
}

function normalizeQuestion(q) {
  const converted = {
    ...q,
    type: q.type === 'choice' ? 'single' : q.type,
    answer: q.answer ?? null,
    explanation: q.explanation ?? null,
    knowledge: q.knowledge ?? null
  }
  
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
    const response = await getQuestionSetQuestions(selectedSetId.value, { random: randomOrder.value })
    const data = handleResponse(response)
    
    let questionList = []
    if (Array.isArray(data)) questionList = data
    else if (data?.questions) questionList = data.questions
    else if (data?.data?.questions) questionList = data.data.questions

    questions.value = questionList.map(q => normalizeQuestion(q))
    
    Object.keys(userAnswers).forEach(k => delete userAnswers[k])
    Object.keys(feedbackMap).forEach(k => delete feedbackMap[k])
    Object.keys(correctMap).forEach(k => delete correctMap[k])
    showExplanationSplit.value = false
    showReport.value = false
    currentIndex.value = 0
    examStarted.value = false
    
    await checkAndRestoreExamState()
    await loadPracticeProgress()
    if (questions.value.length > 0) {
      await ensureQuestionDetail(questions.value[0].id)
    }
  } catch (error) {
    console.error('加载题目失败:', error)
    ElMessage.error('加载题目失败')
    questions.value = []
  } finally {
    loading.value = false
  }
}

async function checkAndRestoreExamState() {
  if (!selectedSetId.value) return
  
  try {
    const response = await restoreExamState(selectedSetId.value)
    const stateData = handleResponse(response)
    
    if (stateData?.answers) {
      ElMessageBox.confirm(
        `检测到您有未完成的考试，已答 ${Object.keys(stateData.answers).length} 题。是否恢复考试？`,
        '恢复考试',
        { confirmButtonText: '恢复考试', cancelButtonText: '开始新考试', type: 'info' }
      ).then(() => {
        Object.assign(userAnswers, stateData.answers)
        currentIndex.value = stateData.current_question_index || 0
        timeLeft.value = stateData.time_left || 0
        examStarted.value = true
        startTimer()
        ElMessage.success('考试已恢复')
      })
    }
  } catch (error) {
    // 正常情况，没有可恢复的状态
  }
}

function startTimer() {
  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value -= 1
    
    if (timeLeft.value % 30 === 0) {
      saveExamState({
        question_set_id: selectedSetId.value,
        answers: { ...userAnswers },
        time_used: (questions.value.length * (timePerQuestion.value || 60)) - timeLeft.value,
        time_left: timeLeft.value,
        current_question_index: currentIndex.value
      })
    }
    
    if (timeLeft.value <= 0) {
      clearInterval(timer.value)
      submitExam()
    }
  }, 1000)
}

async function loadPracticeProgress() {
  if (!selectedSetId.value) return
  
  try {
    const response = await getPracticeProgress(selectedSetId.value)
    const data = handleResponse(response)
    if (data?.answers) {
      Object.assign(userAnswers, data.answers)
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
    ensureQuestionDetail(questions.value[idx].id)
  }
}

async function ensureQuestionDetail(questionId) {
  const idx = questions.value.findIndex(q => q.id === questionId)
  if (idx === -1) return
  const q = questions.value[idx]
  const needDetail = q.answer == null || !q.explanation || !q.knowledge || !q.difficulty
  if (!needDetail) return

  try {
    const response = await getQuestionDetail(questionId)
    const detail = handleResponse(response)
    if (!detail) return
    questions.value[idx] = normalizeQuestion({ ...q, ...detail })
  } catch (error) {
    console.error('加载题目详情失败:', error)
  }
}

async function toggleExplanation() {
  if (!showExplanationSplit.value) {
    await ensureQuestionDetail(currentQuestion.value.id)
  }
  showExplanationSplit.value = !showExplanationSplit.value
}

function checkAnswer() {
  const qid = currentQuestion.value.id
  feedbackMap[qid] = true
  computeCorrectnessFor(qid)
}

function toggleReportCollapse() {
  reportCollapsed.value = !reportCollapsed.value
}

function closeReport() {
  showReport.value = false
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

async function startExam() {
  if (!questions.value.length || !selectedSetId.value) return
  
  try {
    const response = await startExamWithConfig({
      question_set_id: selectedSetId.value,
      custom_duration: customDuration.value > 0 ? customDuration.value : undefined,
      random_order: randomOrder.value
    })
    
    const data = handleResponse(response)
    if (data) {
      report.examId = data.exam_id
      timeLeft.value = data.duration || (questions.value.length * (timePerQuestion.value || 60))
    } else {
      timeLeft.value = questions.value.length * (timePerQuestion.value || 60)
    }
    
    showReport.value = false
    showExplanationSplit.value = false
    Object.keys(userAnswers).forEach(k => delete userAnswers[k])
    Object.keys(correctMap).forEach(k => delete correctMap[k])
    Object.keys(feedbackMap).forEach(k => delete feedbackMap[k])
    examStarted.value = true
    startTimer()
    ElMessage.success('考试开始')
  } catch (error) {
    console.error('开始考试失败:', error)
    ElMessage.error('开始考试失败')
  }
}

async function submitExam() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  if (!selectedSetId.value) return
  
  try {
    const timeUsed = (questions.value.length * timePerQuestion.value) - timeLeft.value
    const response = await submitExamApi({
      question_set_id: selectedSetId.value,
      answers: { ...userAnswers },
      time_used: timeUsed
    })
    
    const data = handleResponse(response)
    if (data) {
      report.correctCount = data.correct_count || 0
      report.wrongCount = data.wrong_count || 0
      report.totalScore = data.total_score || 0
      report.score = data.score || 0
      report.timeUsed = data.time_used || timeUsed
      report.examId = data.exam_id
    }
    
    showReport.value = true
    reportCollapsed.value = false
    examStarted.value = false
    ElMessage.success('考试提交成功')
  } catch (error) {
    console.error('提交考试失败:', error)
    ElMessage.error('提交考试失败')
  }
}

async function viewAllExplanations() {
  if (mode.value === 'exam' && report.examId) {
    try {
      const response = await getExamReport(report.examId)
      const reportData = handleResponse(response)
      
      if (reportData) {
        if (reportData.correctness) Object.assign(correctMap, reportData.correctness)
        if (reportData.questions) questions.value = reportData.questions.map(q => normalizeQuestion(q))
      }
    } catch (error) {
      console.error('加载考试报告失败:', error)
    }
  }
  
  // 为缺少数据的题目获取详情
  const updatedQuestions = []
  let hasMissingData = false
  
  for (const q of questions.value) {
    if (q.answer === null || q.explanation === null) {
      hasMissingData = true
      try {
        const detailResponse = await getQuestionDetail(q.id)
        const detailData = handleResponse(detailResponse)
        if (detailData) {
          updatedQuestions.push(normalizeQuestion({ ...q, ...detailData }))
        } else {
          updatedQuestions.push(q)
        }
      } catch (error) {
        updatedQuestions.push(q)
      }
    } else {
      updatedQuestions.push(q)
    }
  }
  
  if (hasMissingData) questions.value = updatedQuestions
  showAllExplanations.value = true
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

async function saveReview() {
  try {
    const qid = reviewingQuestion.value.id
    await updateQuestion(qid, {
      stem: reviewingQuestion.value.stem,
      type: reviewingQuestion.value.type,
      options: reviewingQuestion.value.options,
      answer: reviewingQuestion.value.answer,
      explanation: reviewingQuestion.value.explanation,
      knowledge: reviewingQuestion.value.knowledge,
      difficulty: reviewingQuestion.value.difficulty
    })
    
    const idx = questions.value.findIndex(q => q.id === qid)
    if (idx !== -1) questions.value[idx] = normalizeQuestion(reviewingQuestion.value)
    
    ElMessage.success('题目编辑成功')
    reviewDialogVisible.value = false
  } catch (error) {
    console.error('编辑题目失败:', error)
    ElMessage.error('编辑题目失败')
  }
}

async function showExamHistory() {
  examHistoryVisible.value = true
  await loadExamHistory()
}

async function loadExamHistory() {
  try {
    loading.value = true
    const response = await getExamHistory({
      page: examHistoryPage.value,
      page_size: examHistoryPageSize.value,
      question_set_id: selectedSetId.value || undefined
    })
    
    const data = handleResponse(response)
    if (data) {
      examHistory.value = data.list || []
      examHistoryTotal.value = data.total || 0
    }
  } catch (error) {
    console.error('加载成绩历史失败:', error)
    ElMessage.error('加载成绩历史失败')
  } finally {
    loading.value = false
  }
}

async function viewExamReport(examId) {
  report.examId = examId
  examHistoryVisible.value = false
  await viewAllExplanations()
}

const formattedTime = computed(() => {
  const s = timeLeft.value || 0
  const mm = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})
</script>

<style scoped>
/* 全局变量 */
:root {
  --primary-color: #1a73e8;
  --primary-hover: #1967d2;
  --success-color: #34a853;
  --warning-color: #fbbc04;
  --danger-color: #ea4335;
  --info-color: #4285f4;
  --text-primary: #1f2d3d;
  --text-secondary: #4a5568;
  --text-muted: #718096;
  --border-color: #e2e8f0;
  --bg-light: #f8fafc;
  --bg-white: #ffffff;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --transition: all 0.3s ease;
}

.practice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #eef5ff 100%);
  padding: 24px;
  box-sizing: border-box;
  font-size: 16px;
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 页面控制栏 */
.page-controls {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.control-divider {
  width: 1px;
  height: 32px;
  background: var(--border-color);
  margin: 0 8px;
}

.progress-section {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: auto;
}

.progress-text {
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
  font-weight: 500;
}

.action-group {
  margin-left: 8px;
}

.exam-options {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 页面主体 */
.page-body {
  display: flex;
  gap: 24px;
  position: relative;
  height: calc(100vh - 180px);
  overflow: hidden;
}

.navigator-container {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.question-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

/* 控制行 */
.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(to right, #ffffff, #f8fafc);
  border-bottom: 1px solid var(--border-color);
}

.set-info, .exam-status, .practice-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.set-info .el-icon {
  color: var(--primary-color);
  font-size: 18px;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--danger-color);
  font-weight: 600;
  padding: 4px 12px;
  background: rgba(234, 67, 53, 0.1);
  border-radius: var(--border-radius-sm);
}

.question-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.single-view,
.split-view {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
}

.split-view {
  display: flex;
  gap: 24px;
}

.split-left {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.split-right {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border-radius: 12px;
  border: 1px solid #c1dff3;
  padding: 0;
  display: flex;
  align-items: flex-start;
}

.split-right .explanation-card {
  width: 100%;
  padding: 0;
}

.split-right :deep(.el-card__body) {
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
  color: var(--primary-color);
  margin-bottom: 10px;
  margin-top: 14px;
}

.explanation-card h3:first-child {
  margin-top: 0;
}

.correct-answer {
  font-size: 16px;
  color: var(--success-color);
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

/* 题目操作栏 */
.question-actions-fixed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
}

.nav-buttons, .function-buttons {
  display: flex;
  gap: 12px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 其他现有样式保留或微调 */

.question-actions-fixed .el-button {
  font-size: 15px;
  font-weight: 600;
  padding: 10px 20px;
  height: auto;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.question-actions-fixed .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(26, 115, 232, 0.16);
}

.question-actions-fixed .el-button:active {
  transform: translateY(0);
}

/* 考试报告 */
.report-floating {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 360px;
  max-width: calc(100vw - 32px);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  z-index: 40;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.report-floating.collapsed {
  width: 260px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.report-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-body {
  padding: 16px;
}

.report-body p {
  font-size: 16px;
  line-height: 1.75;
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.report-body p:last-child {
  border-bottom: none;
}

.report-body p span {
  font-weight: 600;
  color: var(--primary-color);
}

.report-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.report-actions .el-button {
  font-size: 15px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.report-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.report-reopen {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 35;
}

/* 空状态 */
.empty-area {
  padding: 80px 40px;
  text-align: center;
}

/* 选项编辑器 */
.option-editor {
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(26, 115, 232, 0.05);
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(26, 115, 232, 0.1);
}

/* 卡片样式 */
:deep(.el-card) {
  font-size: 16px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.el-card__body) {
  padding: 24px;
}

/* 空状态样式 */
:deep(.el-empty__description) {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-muted);
}

/* 表单元素样式 */
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__input),
:deep(.el-radio-button__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  font-size: 15px;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
}

:deep(.el-input__inner:focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select__input:focus) {
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  border-color: var(--primary-color);
}

/* 按钮样式 */
:deep(.el-button) {
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
}

:deep(.el-button:focus-visible) {
  outline: 2px solid rgba(64, 158, 255, 0.35);
  outline-offset: 2px;
}

:deep(.el-radio-button__inner) {
  font-weight: 600;
  letter-spacing: 0.2px;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: -1px 0 0 0 var(--primary-color);
}

/* 全部解析视图样式 */
.all-explanations-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条样式 */
.all-explanations-view::-webkit-scrollbar,
.navigator-container::-webkit-scrollbar,
.question-area::-webkit-scrollbar,
.single-view::-webkit-scrollbar,
.split-view::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.all-explanations-view::-webkit-scrollbar-track,
.navigator-container::-webkit-scrollbar-track,
.question-area::-webkit-scrollbar-track,
.single-view::-webkit-scrollbar-track,
.split-view::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.all-explanations-view::-webkit-scrollbar-thumb,
.navigator-container::-webkit-scrollbar-thumb,
.question-area::-webkit-scrollbar-thumb,
.single-view::-webkit-scrollbar-thumb,
.split-view::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: var(--transition);
}

.all-explanations-view::-webkit-scrollbar-thumb:hover,
.navigator-container::-webkit-scrollbar-thumb:hover,
.question-area::-webkit-scrollbar-thumb:hover,
.single-view::-webkit-scrollbar-thumb:hover,
.split-view::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.all-explanations-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.all-questions-list {
  margin: 24px 0;
}

.question-explanation-item {
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.question-explanation-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
  border-color: rgba(26, 115, 232, 0.2);
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 12px;
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  margin-right: 12px;
  color: var(--text-primary);
  background: rgba(26, 115, 232, 0.1);
  padding: 4px 12px;
  border-radius: var(--border-radius-sm);
}

.question-content {
  margin-bottom: 20px;
}

.question-stem {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 16px;
  font-weight: 500;
}

.question-options {
  margin-left: 24px;
}

.option-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
}

.option-item:hover {
  background: rgba(26, 115, 232, 0.05);
}

.option-key {
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 12px;
  min-width: 24px;
  background: rgba(26, 115, 232, 0.1);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  text-align: center;
}

.option-text {
  flex: 1;
  color: var(--text-secondary);
  line-height: 1.5;
}

.explanation-content {
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.explanation-section {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.explanation-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.explanation-section p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.explanation-actions {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.explanation-actions .el-button {
  min-width: 140px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.explanation-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 成绩历史样式 */
.exam-history-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exam-history-filter {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.exam-history-filter .el-select {
  width: 240px;
  border-radius: var(--border-radius-md);
}

.exam-history-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

:deep(.el-table) {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  padding: 14px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-table td) {
  padding: 14px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-table tr:hover > td) {
  background: rgba(26, 115, 232, 0.05);
}

:deep(.el-pagination) {
  margin-top: 20px;
}

:deep(.el-pagination__item) {
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
}

:deep(.el-pagination__item:hover) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-pagination__item.is-active) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-body {
    flex-direction: column;
  }
  
  .navigator-container {
    width: 100%;
    max-width: none;
    position: relative;
    top: 0;
    height: auto;
    max-height: 300px;
    margin-bottom: 24px;
  }
  
  .question-area {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .practice-page {
    padding: 16px;
  }
  
  .page-controls {
    padding: 16px;
    gap: 12px;
  }
  
  .page-controls .el-select {
    width: 100%;
  }
  
  .question-area {
    padding: 16px;
  }
  
  .single-view,
  .split-view {
    padding: 20px;
  }
  
  .split-view {
    flex-direction: column;
  }
  
  .control-row {
    padding: 12px 16px;
  }
  
  .question-actions-fixed {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
  
  .question-actions-fixed .el-button {
    width: 100%;
    text-align: center;
  }
  
  .report-actions {
    flex-direction: column;
  }
  
  .report-actions .el-button {
    width: 100%;
  }

  .report-floating,
  .report-reopen {
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
    bottom: 12px;
  }
  
  .all-explanations-view {
    padding: 0 12px;
  }
  
  .question-explanation-item {
    padding: 16px;
  }
  
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .exam-history-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .exam-history-filter .el-select {
    width: 100%;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-explanation-item,
.all-explanations-card {
  animation: fadeIn 0.3s ease-out;
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* 倒计时样式 */
.control-row .countdown {
  font-size: 18px;
  font-weight: 700;
  color: var(--danger-color);
  background: rgba(234, 67, 53, 0.1);
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(234, 67, 53, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(234, 67, 53, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(234, 67, 53, 0);
  }
}
</style>
