<template>
  <div class="reinforcement-practice-container">
    <div class="page-header">
      <div class="header-left">
        <el-button circle @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="header-title">
          <h1>强化练习</h1>
          <p>基于错题智能推荐，针对性提升薄弱点</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <div class="stat-value">{{ currentIndex + 1 }}/{{ totalQuestions }}</div>
          <div class="stat-label">当前进度</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ correctCount }}</div>
          <div class="stat-label">正确数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>
    </div>

    <div class="practice-content">
      <!-- 左侧：练习区域 -->
      <div class="practice-panel">
        <div v-if="!currentQuestion" class="empty-state">
          <el-empty description="暂无题目">
            <el-button type="primary" @click="goBack">返回错题本</el-button>
          </el-empty>
        </div>
        
        <div v-else>
          <div class="progress-bar">
            <el-progress 
              :percentage="progress" 
              :color="progressColor"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="progress-text">{{ progress }}%</span>
          </div>

          <div class="question-card">
            <div class="question-header">
              <div class="header-left-group">
                <el-tag type="info" size="large">
                  {{ getQuestionTypeLabel(currentQuestion.type) }}
                </el-tag>
                <el-tag type="info" size="large">
                  {{ currentQuestion.difficulty === 'easy' ? '简单' : currentQuestion.difficulty === 'medium' ? '中等' : '困难' }}
                </el-tag>
              </div>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeFromReinforcement"
                :disabled="showResult"
                class="remove-btn"
              >
                <el-icon><Delete /></el-icon>
                移出强化练习
              </el-button>
            </div>

            <div class="question-content">
              <h2 class="question-title">{{ currentQuestion.title }}</h2>
              <div class="question-body">
                {{ currentQuestion.content }}
              </div>

              <div class="question-options" v-if="currentQuestion.options && currentQuestion.options.length > 0">
                <div 
                  v-for="(option, index) in currentQuestion.options" 
                  :key="index"
                  class="option-item"
                  :class="{ 
                    'selected': selectedAnswer === index,
                    'correct': showResult && index === currentQuestion.correctAnswer,
                    'wrong': showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer
                  }"
                  @click="selectOption(index)"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                  <span class="option-text">{{ option }}</span>
                  <el-icon v-if="showResult && index === currentQuestion.correctAnswer" class="check-icon"><CircleCheck /></el-icon>
                  <el-icon v-if="showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer" class="close-icon"><CircleClose /></el-icon>
                </div>
              </div>
              <div v-else class="no-options-block">
                该题暂无可选项，请跳过或重新生成题目
              </div>
            </div>

            <div class="result-feedback" v-if="showResult">
              <div class="feedback-header" :class="{ correct: isCorrect, wrong: !isCorrect }">
                <el-icon class="feedback-icon">
                  <CircleCheck v-if="isCorrect" />
                  <CircleClose v-else />
                </el-icon>
                <span class="feedback-text">{{ isCorrect ? '回答正确！' : '回答错误' }}</span>
              </div>
              <div class="feedback-content" v-if="!isCorrect">
                <div class="feedback-item">
                  <span class="feedback-label">正确答案：</span>
                  <span class="feedback-value">{{ formatAnswerDisplay(resolveQuestionCorrectAnswer(currentQuestion)) }}</span>
                </div>
                <div class="feedback-analysis">
                  <h4>解析：</h4>
                  <p>{{ currentQuestion.analysis }}</p>
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <el-button 
                v-if="!showResult" 
                type="primary" 
                size="large" 
                @click="submitAnswer"
                :disabled="selectedAnswer === null || !(currentQuestion.options && currentQuestion.options.length > 0)"
                class="submit-btn"
              >
                <el-icon><Check /></el-icon>
                提交答案
              </el-button>
              <el-button 
                v-else 
                type="primary" 
                size="large" 
                @click="nextQuestion"
                class="next-btn"
              >
                <el-icon><ArrowRight /></el-icon>
                {{ currentIndex === totalQuestions - 1 ? '完成练习' : '下一题' }}
              </el-button>
              <el-button size="large" @click="skipQuestion" :disabled="showResult">
                <el-icon><DArrowRight /></el-icon>
                跳过
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：学习路径和统计 -->
      <div v-if="currentQuestion" class="side-panel">
        <div class="learning-path-card">
          <div class="card-header">
            <el-icon class="card-icon"><TrendCharts /></el-icon>
            <h3>学习路径</h3>
          </div>
          <div class="path-list">
            <div 
              v-for="(q, index) in questions" 
              :key="q.id"
              class="path-item"
              :class="{ 
                'current': index === currentIndex,
                'completed': index < currentIndex,
                'skipped': q.skipped
              }"
              @click="jumpToQuestion(index)"
            >
              <span class="path-number">【{{ index + 1 }}】</span>
              <div class="path-info">
                <div class="path-title">{{ q.title }}</div>
                <div class="path-meta">
                  <span>{{ getQuestionTypeLabel(q.type) }}</span>
                  <span>•</span>
                  <span>{{ q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难' }}</span>
                </div>
              </div>
              <el-icon v-if="index < currentIndex" class="path-status completed"><CircleCheck /></el-icon>
              <el-icon v-else-if="q.skipped" class="path-status skipped"><Warning /></el-icon>
              <el-icon v-else class="path-status current"><Clock /></el-icon>
            </div>
          </div>
        </div>

        <div class="mastery-stats-card">
          <div class="card-header">
            <el-icon class="card-icon"><DataAnalysis /></el-icon>
            <h3>掌握情况</h3>
          </div>
          <div class="stats-content">
            <div class="stat-row">
              <div class="stat-label">待强化</div>
              <div class="stat-bar">
                <div class="bar-fill pending" :style="{ width: pendingPercentage + '%' }"></div>
              </div>
              <div class="stat-value">{{ pendingCount }}</div>
            </div>
            <div class="stat-row">
              <div class="stat-label">练习中</div>
              <div class="stat-bar">
                <div class="bar-fill practicing" :style="{ width: practicingPercentage + '%' }"></div>
              </div>
              <div class="stat-value">{{ practicingCount }}</div>
            </div>
            <div class="stat-row">
              <div class="stat-label">已掌握</div>
              <div class="stat-bar">
                <div class="bar-fill mastered" :style="{ width: masteredPercentage + '%' }"></div>
              </div>
              <div class="stat-value">{{ masteredCount }}</div>
            </div>
          </div>
        </div>

        <div class="knowledge-points-card">
          <div class="card-header">
            <el-icon class="card-icon"><Collection /></el-icon>
            <h3>知识点覆盖</h3>
          </div>
          <div class="points-list">
            <div 
              v-for="point in knowledgePoints" 
              :key="point.name"
              class="point-item"
            >
              <div class="point-name">{{ point.name }}</div>
              <el-progress 
                :percentage="point.mastery" 
                :color="getProgressColor(point.mastery)"
                :stroke-width="6"
                :show-text="false"
              />
              <span class="point-value">{{ point.mastery }}%</span>
            </div>
          </div>
        </div>

        <div class="ai-suggestion-card">
          <div class="card-header">
            <el-icon class="card-icon"><ChatDotRound /></el-icon>
            <h3>AI 建议</h3>
          </div>
          <div class="suggestion-content">
            <div class="suggestion-item">
              <el-icon class="suggestion-icon"><Opportunity /></el-icon>
              <p>{{ aiSuggestion }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 完成练习弹窗 -->
    <el-dialog v-model="showCompleteDialog" title="练习完成" width="500px" class="complete-dialog">
      <div class="complete-content">
        <div class="complete-icon">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <h2 class="complete-title">恭喜完成强化练习！</h2>
        <div class="complete-stats">
          <div class="complete-stat">
            <div class="stat-value">{{ totalQuestions }}</div>
            <div class="stat-label">总题数</div>
          </div>
          <div class="complete-stat">
            <div class="stat-value">{{ correctCount }}</div>
            <div class="stat-label">正确数</div>
          </div>
          <div class="complete-stat">
            <div class="stat-value">{{ accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>
        <div class="complete-message">
          {{ accuracy >= 80 ? '表现优秀！继续保持！' : accuracy >= 60 ? '表现良好，继续努力！' : '需要加强练习，加油！' }}
        </div>
      </div>
      <template #footer>
        <el-button @click="showCompleteDialog = false">返回错题本</el-button>
        <el-button type="primary" @click="restartPractice">重新练习</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createReinforcementAttempt, deleteReinforcementQuestion } from '@/api/exam'
import {
  ArrowLeft,
  ArrowRight,
  DArrowRight,
  Check,
  CircleCheck,
  CircleClose,
  CircleCheckFilled,
  TrendCharts,
  DataAnalysis,
  Collection,
  ChatDotRound,
  Opportunity,
  Clock,
  Warning,
  Delete
} from '@element-plus/icons-vue'

const router = useRouter()

const currentIndex = ref(0)
const selectedAnswer = ref(null)
const showResult = ref(false)
const showCompleteDialog = ref(false)

const questions = ref([
  {
    id: 1,
    title: '二次函数的顶点坐标公式',
    subject: 'math',
    type: 'single',
    content: '已知二次函数 y = ax² + bx + c (a ≠ 0)，求其顶点坐标。',
    options: [
      '(-b/2a, c - b²/4a)',
      '(-b/2a, (4ac - b²)/4a)',
      '(b/2a, c - b²/4a)',
      '(b/2a, (4ac - b²)/4a)'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    analysis: '二次函数 y = ax² + bx + c 的顶点坐标为 (-b/2a, (4ac - b²)/4a)。可以通过配方法推导：y = a(x + b/2a)² + (4ac - b²)/4a。',
    skipped: false
  },
  {
    id: 2,
    title: '牛顿第二定律的应用',
    subject: 'physics',
    type: 'single',
    content: '一个质量为 2kg 的物体，在水平面上受到 10N 的水平拉力作用，物体与水平面间的摩擦系数为 0.2，求物体的加速度。（g = 10m/s²）',
    options: [
      '3 m/s²',
      '4 m/s²',
      '5 m/s²',
      '6 m/s²'
    ],
    correctAnswer: 0,
    difficulty: 'hard',
    analysis: '根据牛顿第二定律 F = ma，物体受到的合外力 F = F拉 - f摩擦 = 10 - μmg = 10 - 0.2×2×10 = 6N。所以加速度 a = F/m = 6/2 = 3 m/s²。',
    skipped: false
  },
  {
    id: 3,
    title: '英语定语从句的用法',
    subject: 'english',
    type: 'single',
    content: 'The book _____ I bought yesterday is very interesting.',
    options: [
      'which',
      'that',
      'who',
      'whom'
    ],
    correctAnswer: 0,
    difficulty: 'medium',
    analysis: '当先行词是物时，定语从句的关系代词可以用 which 或 that。这里 book 是物，所以用 which 或 that 都可以。',
    skipped: false
  },
  {
    id: 4,
    title: '化学方程式的配平',
    subject: 'chemistry',
    type: 'single',
    content: '配平化学方程式：Fe₂O₃ + CO → Fe + CO₂',
    options: [
      'Fe₂O₃ + 3CO → 2Fe + 3CO₂',
      'Fe₂O₃ + 2CO → 2Fe + 2CO₂',
      'Fe₂O₃ + 3CO → 2Fe + 2CO₂',
      'Fe₂O₃ + 2CO → Fe + 2CO₂'
    ],
    correctAnswer: 0,
    difficulty: 'hard',
    analysis: '根据质量守恒定律，配平后的方程式为：Fe₂O₃ + 3CO → 2Fe + 3CO₂。检查各元素原子数：Fe: 2=2, O: 3+3=6=3×2, C: 3=3。',
    skipped: false
  },
  {
    id: 5,
    title: '古诗词鉴赏技巧',
    subject: 'chinese',
    type: 'single',
    content: '下列哪项不属于古诗词的修辞手法？',
    options: [
      '比喻',
      '拟人',
      '排比',
      '夸张'
    ],
    correctAnswer: 2,
    difficulty: 'medium',
    analysis: '排比属于修辞手法，但在古诗词中较少使用。古诗词常用的修辞手法包括比喻、拟人、夸张、对偶等。',
    skipped: false
  }
])

const currentQuestion = computed(() => {
  if (questions.value.length === 0 || currentIndex.value >= questions.value.length) {
    return null
  }
  return questions.value[currentIndex.value]
})
const totalQuestions = computed(() => questions.value.length)
const completedCount = computed(() => {
  return questions.value.filter(q => q.userAnswer !== null || q.skipped).length
})
const correctCount = computed(() => {
  return questions.value.filter((q) => q.userAnswer !== null && isAnswerCorrect(q.userAnswer, q.correctAnswer, q.type)).length
})
const accuracy = computed(() => {
  const answered = questions.value.filter((q) => q.userAnswer !== null).length
  if (answered === 0) return 0
  return Math.round((correctCount.value / answered) * 100)
})
const progress = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((completedCount.value / totalQuestions.value) * 100)
})
const progressColor = computed(() => {
  if (accuracy.value >= 80) return '#67c23a'
  if (accuracy.value >= 60) return '#e6a23c'
  return '#f56c6c'
})
const isCorrect = computed(() => isAnswerCorrect(
  selectedAnswer.value,
  resolveQuestionCorrectAnswer(currentQuestion.value),
  currentQuestion.value.type
))

const pendingCount = computed(() => {
  return questions.value.filter(q => q.userAnswer === null && !q.skipped).length
})
const practicingCount = computed(() => {
  return questions.value.filter(q => q.skipped || (q.userAnswer !== null && q.userAnswer !== q.correctAnswer)).length
})
const masteredCount = computed(() => {
  return questions.value.filter(q => q.userAnswer !== null && q.userAnswer === q.correctAnswer).length
})

const pendingPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((pendingCount.value / totalQuestions.value) * 100)
})
const practicingPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((practicingCount.value / totalQuestions.value) * 100)
})
const masteredPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((masteredCount.value / totalQuestions.value) * 100)
})

const knowledgePoints = computed(() => {
  const pointMap = new Map()
  questions.value.forEach((question, index) => {
    const candidates = Array.isArray(question.knowledgePoints) && question.knowledgePoints.length > 0
      ? question.knowledgePoints
      : [inferKnowledgePoint(question.title, index)]
    candidates.forEach((name) => {
      const key = String(name || '').trim() || `知识点${index + 1}`
      if (!pointMap.has(key)) {
        pointMap.set(key, { name: key, score: 0, count: 0 })
      }
      const item = pointMap.get(key)
      const statusScore = question.userAnswer === null
        ? 45
        : question.userAnswer === question.correctAnswer
          ? 88
          : 58
      const adjustedScore = question.skipped ? Math.max(30, statusScore - 20) : statusScore
      item.score += adjustedScore
      item.count += 1
    })
  })
  return Array.from(pointMap.values()).map(item => ({
    name: item.name,
    mastery: Math.round(item.score / item.count)
  }))
})

const aiSuggestion = computed(() => {
  const sortedPoints = [...knowledgePoints.value].sort((a, b) => a.mastery - b.mastery)
  const weakPoint = sortedPoints[0]?.name || '薄弱知识点'
  if (accuracy.value >= 80) {
    return `保持稳定节奏，继续巩固${weakPoint}并做限时训练。`
  }
  if (accuracy.value >= 60) {
    return `优先复盘${weakPoint}错因，按题型再做两轮针对练习。`
  }
  return `先精练${weakPoint}基础题，再逐步提升综合应用能力。`
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

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

const normalizeAnswerValue = (value, type = 'single') => {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map(item => normalizeAnswerValue(item, type)).filter(item => item !== null)
  if (type === 'fill' || type === 'essay') return String(value).trim().toLowerCase()
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  const text = String(value).trim()
  if (!text) return null
  if (/^\d+$/.test(text)) return Number(text)
  const upper = text.toUpperCase()
  if (upper === 'TRUE') return 1
  if (upper === 'FALSE') return 0
  const charCode = upper.charCodeAt(0)
  if (charCode >= 65 && charCode <= 90) return charCode - 65
  return upper.toLowerCase()
}

const isAnswerCorrect = (userAnswer, correctAnswer, type = 'single') => {
  const normalizedUser = normalizeAnswerValue(userAnswer, type)
  const normalizedCorrect = normalizeAnswerValue(correctAnswer, type)
  if (Array.isArray(normalizedUser) || Array.isArray(normalizedCorrect)) {
    if (!Array.isArray(normalizedUser) || !Array.isArray(normalizedCorrect)) return false
    const userSorted = [...normalizedUser].sort().join(',')
    const correctSorted = [...normalizedCorrect].sort().join(',')
    return userSorted === correctSorted
  }
  return normalizedUser === normalizedCorrect
}

const inferCorrectAnswerFromAnalysis = (analysisText = '') => {
  const text = String(analysisText || '')
  if (!text) return null
  const match = text.match(/(?:正确答案|答案)\s*[：:]\s*([A-Z])/i)
  if (!match || !match[1]) return null
  return normalizeAnswerValue(match[1], 'single')
}

const resolveQuestionCorrectAnswer = (question = {}) => {
  const directAnswer = normalizeAnswerValue(question.correctAnswer, question.type || 'single')
  if (directAnswer !== null) return directAnswer
  const inferred = inferCorrectAnswerFromAnalysis(question.analysis || '')
  if (inferred !== null) return inferred
  return null
}

const formatAnswerDisplay = (answer) => {
  if (answer === null || answer === undefined || answer === '') return '暂无'
  if (Array.isArray(answer)) {
    return answer.map(item => formatAnswerDisplay(item)).join('、')
  }
  if (typeof answer === 'number') return String.fromCharCode(65 + answer)
  if (typeof answer === 'boolean') return answer ? '正确' : '错误'
  const text = String(answer).trim()
  if (!text) return '暂无'
  const upper = text.toUpperCase()
  if (/^\d+$/.test(upper)) return String.fromCharCode(65 + Number(upper))
  if (upper === 'TRUE') return '正确'
  if (upper === 'FALSE') return '错误'
  if (/^[A-Z]$/.test(upper)) return upper
  return text
}

const selectOption = (index) => {
  if (showResult.value) return
  selectedAnswer.value = index
}

const submitAnswer = async () => {
  if (selectedAnswer.value === null) {
    ElMessage.warning('请先选择答案')
    return
  }
  
  const current = questions.value[currentIndex.value]
  current.userAnswer = selectedAnswer.value
  current.skipped = false
  showResult.value = true
  
  if (isCorrect.value) {
    ElMessage.success('回答正确！')
  } else {
    ElMessage.error('回答错误')
  }

  if (current.reinforcementQuestionId) {
    try {
      await createReinforcementAttempt({
        reinforcement_question_id: current.reinforcementQuestionId,
        user_answer: selectedAnswer.value,
        is_correct: isCorrect.value
      })
    } catch (error) {
      console.error('保存强化练习作答失败:', error)
    }
  }
}

const nextQuestion = () => {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    selectedAnswer.value = null
    showResult.value = false
  } else {
    showCompleteDialog.value = true
  }
}

const skipQuestion = () => {
  questions.value[currentIndex.value].skipped = true
  showResult.value = false
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    selectedAnswer.value = null
  } else {
    showCompleteDialog.value = true
  }
}

const jumpToQuestion = (index) => {
  if (index <= currentIndex.value) {
    currentIndex.value = index
    selectedAnswer.value = questions.value[index].userAnswer ?? null
    showResult.value = questions.value[index].userAnswer !== null
  }
}

const goBack = () => {
  router.back()
}

const removeFromReinforcement = async () => {
  const current = questions.value[currentIndex.value]
  if (!current.reinforcementQuestionId) {
    ElMessage.warning('无法移出该题目')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定要将这道题移出强化练习吗？',
      '移出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteReinforcementQuestion(current.reinforcementQuestionId)
    ElMessage.success('已移出强化练习')
    questions.value.splice(currentIndex.value, 1)
    if (questions.value.length === 0) {
      router.back()
      return
    }
    if (currentIndex.value >= questions.value.length) {
      currentIndex.value = questions.value.length - 1
    }
    selectedAnswer.value = null
    showResult.value = false
    sessionStorage.setItem('reinforcementPracticeQuestions', JSON.stringify(questions.value))
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移出强化练习失败:', error)
      ElMessage.error('移出强化练习失败')
    }
  }
}

const restartPractice = () => {
  questions.value.forEach(q => {
    q.userAnswer = null
    q.skipped = false
  })
  currentIndex.value = 0
  selectedAnswer.value = null
  showResult.value = false
  showCompleteDialog.value = false
}

function inferKnowledgePoint(title, index) {
  const plainTitle = String(title || '').replace(/\s+/g, '')
  if (!plainTitle) return `知识点${index + 1}`
  return plainTitle.slice(0, Math.min(8, plainTitle.length))
}

onMounted(() => {
  const storedQuestions = sessionStorage.getItem('reinforcementPracticeQuestions')
  if (!storedQuestions) return
  try {
    const parsed = JSON.parse(storedQuestions)
    if (Array.isArray(parsed) && parsed.length > 0) {
      questions.value = parsed.map((item, index) => {
        const normalizedType = item.type || 'single'
        const normalizedCorrectAnswer = normalizeAnswerValue(
          item.correctAnswer ?? item.answer ?? item.answerRaw ?? item.correct_answer,
          normalizedType
        )
        return {
          id: item.id || index + 1,
          reinforcementQuestionId: item.reinforcementQuestionId || null,
          title: item.title || `练习题 ${index + 1}`,
          subject: item.subject || 'math',
          type: normalizedType,
          content: item.content || item.title || '',
          options: Array.isArray(item.options) ? item.options : [],
          correctAnswer: normalizedCorrectAnswer ?? inferCorrectAnswerFromAnalysis(item.analysis || ''),
          difficulty: item.difficulty || 'medium',
          analysis: item.analysis || '',
          knowledgePoints: Array.isArray(item.knowledgePoints) ? item.knowledgePoints : [],
          skipped: false,
          userAnswer: null
        }
      })
    }
  } catch (error) {
    console.error('读取强化练习题失败:', error)
  }
})
</script>

<style scoped>
.reinforcement-practice-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-left: 30px;
  margin-right: 30px;
  background-color: var(--el-bg-color-page);
}

.page-header {
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

.header-title h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.header-title p {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.header-stats {
  display: flex;
  gap: 32px;
  padding: 8px 20px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.header-stats .stat-item {
  text-align: center;
  padding: 0 12px;
}

.header-stats .stat-item:not(:last-child) {
  border-right: 1px solid rgba(64, 158, 255, 0.2);
}

.header-stats .stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 2px;
  color: var(--el-color-primary);
}

.header-stats .stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.practice-content {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
  overflow: hidden;
}

.practice-panel {
  flex: 0 0 65%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.side-panel {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  min-width: 50px;
  text-align: right;
}

.question-card {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color);
}

.header-left-group {
  display: flex;
  gap: 12px;
}

.question-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.question-body {
  font-size: 15px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  margin-bottom: 24px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-options-block {
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.option-item.selected {
  border-color: #409eff;
  background: #e6f7ff;
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
}

.option-text {
  flex: 1;
  color: var(--el-text-color-primary);
}

.check-icon {
  color: #67c23a;
  font-size: 20px;
}

.close-icon {
  color: #f56c6c;
  font-size: 20px;
}

.result-feedback {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.feedback-header.correct {
  background: #f0f9ff;
  color: #67c23a;
}

.feedback-header.wrong {
  background: #fef0f0;
  color: #f56c6c;
}

.feedback-icon {
  font-size: 22px;
}

.feedback-text {
  font-size: 15px;
  font-weight: 600;
}

.feedback-content {
  padding: 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
}

.feedback-label {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.feedback-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.feedback-analysis h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.feedback-analysis p {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color);
}

.submit-btn,
.next-btn {
  flex: 1;
  height: 44px;
  font-size: 15px;
}

.learning-path-card,
.mastery-stats-card,
.knowledge-points-card,
.ai-suggestion-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.card-icon {
  font-size: 18px;
  color: #409eff;
}

.path-list {
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 6px;
}

.path-item:hover {
  background: #f0f7ff;
}

.path-item.current {
  background: #e6f7ff;
  border: 1px solid #409eff;
}

.path-item.completed {
  opacity: 0.7;
}

.path-item.skipped {
  opacity: 0.5;
}

.path-number {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 24px;
}

.path-info {
  flex: 1;
}

.path-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.path-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.path-status {
  font-size: 14px;
}

.path-status.completed {
  color: #67c23a;
}

.path-status.skipped {
  color: #e6a23c;
}

.path-status.current {
  color: #409eff;
}

.stats-content {
  padding: 14px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stats-content .stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 56px;
}

.stat-bar {
  flex: 1;
  height: 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bar-fill.pending {
  background: #f56c6c;
}

.bar-fill.practicing {
  background: #e6a23c;
}

.bar-fill.mastered {
  background: #67c23a;
}

.stats-content .stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 36px;
  text-align: right;
}

.points-list {
  padding: 14px;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.point-item:last-child {
  margin-bottom: 0;
}

.point-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  min-width: 90px;
}

.point-item .el-progress {
  flex: 1;
}

.point-value {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  min-width: 36px;
  text-align: right;
}

.suggestion-content {
  padding: 14px;
}

.suggestion-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.suggestion-icon {
  font-size: 18px;
  color: #e6a23c;
  flex-shrink: 0;
}

.suggestion-item p {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0;
}

.complete-content {
  text-align: center;
  padding: 20px;
}

.complete-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 12px;
}

.complete-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;
}

.complete-stat {
  text-align: center;
}

.complete-stat .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 6px;
}

.complete-stat .stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.complete-message {
  font-size: 15px;
  color: var(--el-text-color-regular);
  padding: 14px;
  background: #f0f9ff;
  border-radius: 6px;
}

@media (max-width: 1200px) {
  .practice-content {
    flex-direction: column;
  }
  
  .practice-panel,
  .side-panel {
    flex: 1;
    width: 100%;
    padding-right: 0;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .reinforcement-practice-container {
    padding: 16px;
    margin-left: 16px;
    margin-right: 16px;
  }
  
  .header-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .submit-btn,
  .next-btn {
    width: 100%;
  }
}
</style>
