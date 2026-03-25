<template>
  <div class="result-report">
    <!-- 成绩概览 -->
    <el-card class="score-card" shadow="never">
      <div class="score-header">
        <h2>🎉 {{ mode === 'exam' ? '考试完成' : '练习完成' }}</h2>
        <el-button @click="emit('back')">返回首页</el-button>
      </div>

      <div class="score-display">
        <el-progress
            type="dashboard"
            :percentage="scorePercentage"
            :width="140"
            :stroke-width="12"
            :color="scoreColors"
        >
          <template #default="{ percentage }">
            <span class="score-text">{{ percentage }}%</span>
          </template>
        </el-progress>

        <div class="score-stats">
          <div class="stat-item">
            <span class="stat-label">正确</span>
            <span class="stat-value correct">{{ correctCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误</span>
            <span class="stat-value wrong">{{ wrongCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总分</span>
            <span class="stat-value score">{{ scorePercentage }}/100</span>
          </div>
          <div class="stat-item" v-if="timeUsed">
            <span class="stat-label">用时</span>
            <span class="stat-value">{{ formatTime(timeUsed) }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 错题回顾 -->
    <el-card class="wrong-review" shadow="never">
      <template #header>
        <div class="review-header">
          <span>❌ 错题回顾 ({{ wrongQuestions.length }})</span>
          <el-button
              v-if="wrongQuestions.length"
              size="small"
              type="warning"
              :icon="CollectionTag"
              @click="addAllToWrongBook"
          >
            全部加入错题本
          </el-button>
        </div>
      </template>

      <el-empty
          v-if="wrongQuestions.length === 0"
          description="太棒了！没有错题 🎉"
          :image-size="120"
      />

      <el-collapse v-else v-model="activeWrong">
        <el-collapse-item
            v-for="(q) in wrongQuestions"
            :key="q.id"
            :name="q.id"
        >
          <template #title>
            <span class="collapse-title">
              <el-tag size="small" type="danger">错题</el-tag>
              <span class="q-stem-preview">{{ truncate(q.stem, 60) }}</span>
            </span>
          </template>

          <div class="wrong-detail">
            <p><strong>题干：</strong>{{ q.stem }}</p>
            <p><strong>您的答案：</strong> <span class="user-ans">{{ formatAnswer(userAnswers[q.id], q) }}</span></p>
            <p><strong>正确答案：</strong> <span class="correct-ans">{{ formatAnswer(q.answer, q) }}</span></p>
            <p v-if="q.explanation"><strong>解析：</strong>{{ q.explanation }}</p>
            <el-button
                size="small"
                type="warning"
                :icon="CollectionTag"
                @click="addToWrongBook(q)"
            >
              加入错题本
            </el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 操作按钮 -->
    <div class="report-actions">
      <el-button @click="emit('retry')">再练一次</el-button>
      <el-button type="primary" @click="emit('back')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  questions: { type: Array, default: () => [] },
  userAnswers: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'practice' },
  timeUsed: { type: Number, default: null }
})

const emit = defineEmits(['retry', 'back', 'add-to-wrong'])

const activeWrong = ref([])

const scorePercentage = computed(() => {
  if (!props.questions.length) return 0
  const correct = props.questions.filter(q => isCorrect(q)).length
  return Math.round(correct / props.questions.length * 100)
})

const correctCount = computed(() =>
    props.questions.filter(q => isCorrect(q)).length
)

const wrongCount = computed(() =>
    props.questions.length - correctCount.value
)

const wrongQuestions = computed(() =>
    props.questions.filter(q => !isCorrect(q))
)

const scoreColors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#67c23a', percentage: 100 }
]

const isCorrect = (q) => {
  const ans = props.userAnswers[q.id]
  if (ans === undefined) return false
  if (q.type === 'judge' || q.type === 'single' || q.type === 'fill' || q.type === 'essay') {
    return ans === q.answer
  }
  if (q.type === 'multi') {
    const a1 = Array.isArray(ans) ? [...ans].sort() : []
    const a2 = Array.isArray(q.answer) ? [...q.answer].sort() : []
    return JSON.stringify(a1) === JSON.stringify(a2)
  }
  return false
}

const formatAnswer = (answer, q) => {
  if (q.type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  if (q.type === 'fill' || q.type === 'essay') return answer || '（未作答）'
  return answer || '（未选择）'
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

const addToWrongBook = (q) => {
  emit('add-to-wrong', q)
  ElMessage.success('已加入错题本')
}

const addAllToWrongBook = () => {
  wrongQuestions.value.forEach(q => emit('add-to-wrong', q))
  ElMessage.success(`已添加 ${wrongQuestions.value.length} 道错题`)
}
</script>

<style scoped>
.result-report {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.score-card {
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.score-header h2 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin: 0;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
}

.score-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.score-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  min-width: 200px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.stat-value.correct { color: var(--color-success); }
.stat-value.wrong { color: var(--color-danger); }
.stat-value.score { color: var(--color-primary); font-size: var(--font-size-xl); }

.wrong-review {
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.q-stem-preview {
  color: var(--text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.wrong-detail {
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  color: var(--text-regular);
  line-height: 1.6;
}

.wrong-detail p {
  margin: 8px 0;
}

.user-ans { color: var(--color-danger); }
.correct-ans { color: var(--color-success); font-weight: 500; }

.report-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color-light);
}

@media (max-width: 768px) {
  .score-display {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  .score-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>