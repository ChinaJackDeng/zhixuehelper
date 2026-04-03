<template>
  <el-card class="question-card" shadow="never">
    <!-- 题目头部 -->
    <div class="q-header">
      <el-tag size="small" :type="tagType">{{ typeLabel }}</el-tag>
      <el-tag size="small" effect="plain">{{ difficultyLabel }}</el-tag>
    </div>

    <!-- 题干 -->
    <div class="q-stem">
      <span class="q-index">【{{ index }}】</span>
      <span class="q-content">{{ question.stem }}</span>
    </div>

    <!-- 答题区域 (由子类实现) -->
    <slot name="input" />

    <!-- 反馈区域 (练习模式) -->
    <div v-if="showFeedback" class="feedback-section">
      <el-alert
          :title="isCorrect ? '✅ 回答正确！' : '❌ 回答错误'"
          :type="isCorrect ? 'success' : 'error'"
          :closable="false"
          show-icon
      />
      <div class="answer-detail" v-if="!isCorrect">
        <p><strong>正确答案：</strong>{{ formattedAnswer }}</p>
        <p v-if="question.explanation"><strong>解析：</strong>{{ question.explanation }}</p>
      </div>
    </div>

    <!-- 解析按钮 (可折叠) -->
    <el-button
        v-if="showExplanationToggle"
        :icon="Document"
        link
        @click="showExplanation = !showExplanation"
        class="explain-toggle"
    >
      {{ showExplanation ? '隐藏解析' : '显示解析' }}
    </el-button>

    <!-- 解析内容 -->
    <div v-if="showExplanation && question.explanation" class="explanation">
      <strong>💡 解析：</strong>
      <p>{{ question.explanation }}</p>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true
    // { id, type, stem, options?, answer, explanation, difficulty, tags }
  },
  modelValue: {},  // 用户答案
  index: { type: Number, default:1 },
  showFeedback: { type: Boolean, default: false },
  isCorrect: { type: Boolean, default: false },
  showExplanationToggle: { type: Boolean, default: false }
})

const showExplanation = ref(false)

const typeLabel = computed(() => {
  const map = {
    single: '单选题', multi: '多选题',
    judge: '判断题', fill: '填空题', essay: '简答题'
  }
  return map[props.question.type] || props.question.type
})

const tagType = computed(() => {
  const map = {
    single: '', multi: 'warning', judge: 'success',
    fill: 'info', essay: 'danger'
  }
  return map[props.question.type] || ''
})

const difficultyLabel = computed(() => {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[props.question.difficulty] || props.question.difficulty || '未知'
})

const formattedAnswer = computed(() => {
  const { answer, type } = props.question
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
})
</script>

<style scoped>
.question-card {
  border-radius: 12px;
  margin-bottom: 0;
  font-size: 16px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom:1px solid #f0f0f0;
  font-size: 14px;
}

.q-header .el-tag {
  font-size: 16px;
  padding: 6px 12px;
  height: auto;
}

.q-stem {
  font-size: 16px;
  line-height:1.5;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.q-index {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 16px;
  white-space: nowrap;
}

.q-content {
  flex:1;
  color: #333;
  font-size: 16px;
}

.feedback-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top:1px solid #f0f0f0;
  font-size: 14px;
}

.answer-detail {
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-regular);
  border:1px solid #e8e8e8;
}

.answer-detail p {
  margin:6px 0;
  font-size: 14px;
}

.explain-toggle {
  margin-top: 8px;
  font-size: 14px;
}

.explanation {
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  border-left: 4px solid var(--color-primary);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  color: var(--text-regular);
  line-height:1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.explanation p {
  margin:6px 0 0 0;
  font-size: 14px;
}
</style>
