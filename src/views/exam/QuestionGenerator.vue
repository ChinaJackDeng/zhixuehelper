<!-- src/views/exam/QuestionGenerator.vue -->
<template>
  <div class="question-generator-page">
    <div class="page-body">
      <!-- 左侧参数配置区 (60%) -->
      <div class="config-section">
        <el-card shadow="never" class="config-card">
          <el-form
              ref="configFormRef"
              :model="configForm"
              label-position="top"
              class="config-form"
          >
            <!-- 1. 标签检索 -->
            <el-form-item
                label="知识标签"
                prop="tags"
                :rules="{ required: true, message: '请至少选择一个标签', trigger: 'change' }"
            >
              <el-select
                  v-model="configForm.tags"
                  multiple
                  filterable
                  placeholder="选择知识点标签"
                  style="width: 100%"
                  @change="handleTagChange"
                  size="large"
                  class="tag-select"
              >
                <el-option
                    v-for="tag in availableTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                />
              </el-select>
            </el-form-item>

            <!-- 2. 文件选择 -->
            <el-form-item
                label="知识文件"
                prop="selectedFiles"
                :rules="{ required: true, message: '请至少选择一个文件', trigger: 'change' }"
            >
              <el-checkbox-group v-model="configForm.selectedFiles" class="file-checkbox-group">
                <el-checkbox
                    v-for="file in filteredFiles"
                    :key="file.id"
                    :label="file.id"
                    class="file-checkbox"
                >
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-meta">
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
              <el-empty v-if="filteredFiles.length === 0" description="暂无匹配的知识文件" />
            </el-form-item>

            <!-- 3. 题型选择 -->
<el-form-item label="题型选择" prop="questionTypes">
  <div class="type-list-container">
    <div 
      v-for="type in questionTypes" 
      :key="type.value" 
      class="type-item"
      :class="{ selected: configForm.questionTypes.includes(type.value) }"
    >
      <div class="type-content" @click="toggleQuestionType(type.value)">
        <!-- 左侧：复选框 + 题型名称 -->
        <div class="type-left">
          <el-checkbox
            :model-value="configForm.questionTypes.includes(type.value)"
            class="type-checkbox-simple"
          />
          <span class="type-label-text">{{ type.label }}</span>
        </div>
        
        <!-- 右侧：数量控制（仅在选择时显示） -->
        <div 
          v-if="configForm.questionTypes.includes(type.value)" 
          class="type-right"
          @click.stop
        >
          <div class="count-controls">
            <el-button
              circle
              :icon="Minus"
              @click="decreaseCount(type.value)"
              :disabled="typeCounts[type.value] <= 1"
              size="small"
              class="count-btn"
            />
            <span class="count-display">{{ typeCounts[type.value] }}</span>
            <el-button
              circle
              :icon="Plus"
              @click="increaseCount(type.value)"
              :disabled="typeCounts[type.value] >= 50"
              size="small"
              class="count-btn"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</el-form-item>

            <!-- 4. 难度选择 -->
            <el-form-item label="题目难度" prop="difficulty">
              <el-select v-model="configForm.difficulty" style="width: 100%" size="large">
                <el-option label="🟢 简单" value="easy" />
                <el-option label="🟡 中等" value="medium" />
                <el-option label="🔴 困难" value="hard" />
                <el-option label="⚖️ 混合" value="mixed" />
              </el-select>
            </el-form-item>

            <!-- 5. 生成设置 -->
            <el-form-item label="生成设置">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="题目名称">
                    <el-input v-model="configForm.questionSetName" placeholder="输入题目集名称" size="large" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="绑定方式">
                    <el-select v-model="configForm.bindType" style="width: 100%" size="large">
                      <el-option label="按文件" value="by_file" />
                      <el-option label="按标签" value="by_tag" />
                      <el-option label="自定义" value="custom" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>

            <!-- 生成按钮 -->
            <div class="form-actions">
              <el-button @click="resetConfig" size="large">重置</el-button>
              <el-button
                  type="primary"
                  :icon="MagicStick"
                  :loading="generating"
                  @click="generateQuestions"
                  :disabled="!canGenerate"
                  size="large"
              >
                {{ generating ? '生成中...' : '开始生成' }}
              </el-button>
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- 右侧题目展示区 (40%) -->
      <div class="preview-section">
        <el-card shadow="never" class="preview-card">
          <div class="preview-header">
            <h3 class="preview-title">
              {{ configForm.questionSetName || '题目预览' }}
              <span v-if="generatedQuestions.length > 0" class="question-count">
                ({{ currentQuestionIndex + 1 }}/{{ generatedQuestions.length }})
              </span>
            </h3>
            <div class="preview-actions">
              <el-button :icon="Refresh" @click="regenerate">重新生成</el-button>
              <el-button type="success" :icon="Check" @click="saveQuestions" :disabled="generatedQuestions.length === 0">
                保存题目
              </el-button>
            </div>
          </div>

          <!-- 题目卡片 -->
          <div class="question-card-container">
            <el-empty v-if="generatedQuestions.length === 0" description="生成题目后将显示在此处" />
            
            <div v-else class="question-card">
              <!-- 题目头部 -->
              <div class="question-header">
                <el-tag size="small" :type="getTagType(currentQuestion.type)">
                  {{ getTypeLabel(currentQuestion.type) }}
                </el-tag>
                <el-tag size="small" effect="plain" class="difficulty-tag">
                  {{ getDifficultyLabel(currentQuestion.difficulty) }}
                </el-tag>
                <div class="question-id">第 {{ currentQuestionIndex + 1 }} 题</div>
              </div>

              <!-- 题目内容 -->
              <div class="question-content">
                <p class="question-stem">{{ currentQuestion.stem }}</p>

                <!-- 选项 -->
                <div v-if="['single', 'multi'].includes(currentQuestion.type)" class="options-list">
                  <div
                      v-for="opt in currentQuestion.options"
                      :key="opt.key"
                      class="option-item"
                  >
                    <span class="option-key">{{ opt.key }}.</span>
                    <span class="option-text">{{ opt.text }}</span>
                  </div>
                </div>

                <!-- 答案区域 -->
                <div class="answer-section" v-if="currentQuestion.answer">
                  <div class="answer-header">
                    <span class="answer-label">参考答案：</span>
                    <el-button
                        link
                        size="small"
                        @click="showAnswer = !showAnswer"
                    >
                      {{ showAnswer ? '隐藏' : '显示' }}
                    </el-button>
                  </div>
                  <div v-if="showAnswer" class="answer-value">
                    {{ formatAnswer(currentQuestion.answer, currentQuestion.type) }}
                  </div>
                </div>

                <!-- 解析 -->
                <div v-if="currentQuestion.explanation" class="explanation-section">
                  <div class="explanation-header">
                    <span class="explanation-label">解析：</span>
                    <el-button
                        link
                        size="small"
                        @click="showExplanation = !showExplanation"
                    >
                      {{ showExplanation ? '隐藏' : '显示' }}
                    </el-button>
                  </div>
                  <div v-if="showExplanation" class="explanation-text">
                    {{ currentQuestion.explanation }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 题目导航 -->
          <div v-if="generatedQuestions.length > 0" class="question-navigation">
            <!-- 导航按钮 -->
            <div class="nav-buttons">
              <el-button
                  :icon="ArrowLeft"
                  @click="prevQuestion"
                  :disabled="currentQuestionIndex === 0"
              >
                上一题
              </el-button>
              <el-button
                  :icon="ArrowRight"
                  @click="nextQuestion"
                  :disabled="currentQuestionIndex === generatedQuestions.length - 1"
              >
                下一题
              </el-button>
            </div>

            <!-- 题号导航 -->
            <div class="question-indexes">
              <el-scrollbar>
                <button
                    v-for="(q, idx) in generatedQuestions"
                    :key="q.id"
                    class="index-button"
                    :class="{ active: idx === currentQuestionIndex }"
                    @click="goToQuestion(idx)"
                >
                  {{ idx + 1 }}
                </button>
              </el-scrollbar>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick, Refresh, Check, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { Minus, Plus } from '@element-plus/icons-vue'
// 表单数据
const configFormRef = ref(null)
const generating = ref(false)
const showAnswer = ref(false)
const showExplanation = ref(false)
const currentQuestionIndex = ref(0)

const configForm = reactive({
  tags: [],
  selectedFiles: [],
  questionTypes: ['single'],
  difficulty: 'mixed',
  questionSetName: '',
  bindType: 'by_file'
})

const typeCounts = reactive({
  single: 5,
  multi: 3,
  judge: 2,
  fill: 3,
  essay: 2
})
// 题型配置
const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multi', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'essay', label: '简答题' }
]

// 模拟数据
const availableTags = ref(['数学', '物理', '化学', '英语', '编程', '历史', '地理', '生物'])
const allFiles = ref([
  { id: 1, name: '高等数学上册知识点总结', tags: ['数学'], size: 1024000 },
  { id: 2, name: '物理力学公式大全', tags: ['物理'], size: 512000 },
  { id: 3, name: '化学反应方程式汇总', tags: ['化学'], size: 768000 },
  { id: 4, name: '英语语法精讲', tags: ['英语'], size: 1280000 },
  { id: 5, name: 'JavaScript基础教程', tags: ['编程'], size: 2048000 },
  { id: 6, name: '中国历史朝代顺序表', tags: ['历史'], size: 256000 },
  { id: 7, name: '世界地理知识要点', tags: ['地理'], size: 896000 },
  { id: 8, name: '生物学基础知识', tags: ['生物'], size: 640000 }
])

const generatedQuestions = ref([])

// 计算属性
const filteredFiles = computed(() => {
  if (configForm.tags.length === 0) return allFiles.value
  return allFiles.value.filter(file => 
    configForm.tags.some(tag => file.tags.includes(tag))
  )
})

const currentQuestion = computed(() => {
  return generatedQuestions.value[currentQuestionIndex.value] || {}
})

const canGenerate = computed(() => {
  return configForm.tags.length > 0 && 
         configForm.selectedFiles.length > 0 && 
         configForm.questionTypes.length > 0
})

// 工具方法
const getTagType = (type) => {
  const map = { single: '', multi: 'warning', judge: 'success', fill: 'info', essay: 'danger' }
  return map[type] || ''
}
const toggleQuestionType = (type) => {
  const index = configForm.questionTypes.indexOf(type)
  if (index === -1) {
    configForm.questionTypes.push(type)
  } else {
    configForm.questionTypes.splice(index, 1)
    // 如果取消选择，可以重置数量为默认值
    typeCounts[type] = getDefaultCount(type)
  }
}

// 获取默认数量
const getDefaultCount = (type) => {
  const defaults = {
    single: 5,
    multi: 3,
    judge: 2,
    fill: 3,
    essay: 2
  }
  return defaults[type] || 1
}

// 增加数量
const increaseCount = (type) => {
  if (typeCounts[type] < 50) {
    typeCounts[type]++
  }
}

// 减少数量
const decreaseCount = (type) => {
  if (typeCounts[type] > 1) {
    typeCounts[type]--
  }
}


const getDifficultyLabel = (difficulty) => {
  const map = { easy: '简单', medium: '中等', hard: '困难', mixed: '混合' }
  return map[difficulty] || difficulty
}

const formatAnswer = (answer, type) => {
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer
}

const formatFileSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// 事件处理
const handleTagChange = () => {
  configForm.selectedFiles = []
}

const generateQuestions = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请完善生成参数')
    return
  }

  generating.value = true
  // 模拟API请求
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 生成题目
  const questions = []
  let id = Date.now()

  // 根据选择的题型和数量生成题目
  configForm.questionTypes.forEach(type => {
    const count = typeCounts[type]
    for (let i = 0; i < count; i++) {
      questions.push({
        id: id++,
        type,
        difficulty: configForm.difficulty === 'mixed'
            ? ['easy', 'medium', 'hard'][i % 3]
            : configForm.difficulty,
        tags: configForm.tags.slice(0, 2),
        stem: `【${getTypeLabel(type)}】这是一道关于${configForm.tags[0]}的题目，来源于文件：${allFiles.value.find(f => f.id === configForm.selectedFiles[0])?.name}`,
        options: ['single', 'multi'].includes(type)
            ? [
              { key: 'A', text: '选项A内容' },
              { key: 'B', text: '选项B内容' },
              { key: 'C', text: '选项C内容' },
              { key: 'D', text: '选项D内容' }
            ]
            : undefined,
        answer: type === 'judge' ? (i % 2 === 0) : ['A', 'B', 'C', 'D'][i % 4],
        explanation: '这是题目的详细解析，帮助理解知识点和解题思路。'
      })
    }
  })

  generatedQuestions.value = questions
  currentQuestionIndex.value = 0
  showAnswer.value = false
  showExplanation.value = false
  generating.value = false
  ElMessage.success(`成功生成 ${questions.length} 道题目`)
}

const resetConfig = () => {
  configForm.tags = []
  configForm.selectedFiles = []
  configForm.questionTypes = ['single']
  configForm.difficulty = 'mixed'
  configForm.questionSetName = ''
  configForm.bindType = 'by_file'
  generatedQuestions.value = []
  currentQuestionIndex.value = 0
  ElMessage.info('已重置配置')
}

const regenerate = () => {
  generateQuestions()
}

const saveQuestions = () => {
  ElMessageBox.confirm(
      `确认保存 ${generatedQuestions.value.length} 道题目？`,
      '保存题目',
      { type: 'success', confirmButtonText: '确认', cancelButtonText: '取消' }
  ).then(() => {
    ElMessage.success('题目保存成功')
    resetConfig()
  })
}

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    showAnswer.value = false
    showExplanation.value = false
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < generatedQuestions.value.length - 1) {
    currentQuestionIndex.value++
    showAnswer.value = false
    showExplanation.value = false
  }
}

const goToQuestion = (index) => {
  currentQuestionIndex.value = index
  showAnswer.value = false
  showExplanation.value = false
}
</script>

<style scoped>
.question-generator-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #eef5ff 100%);
  padding: 24px;
   margin-left: 30px;
  margin-right: 30px;
  box-sizing: border-box;
}

.page-body {
  display: flex;
  height: 100%;
  gap: 24px;
  height: calc(100vh - 180px);
}

.config-section {
  flex: 0 0 50%;
  min-width: 0;
}

.preview-section {
  flex: 0 0 50%;
  min-width: 0;
}

.config-card, .preview-card {
  height: 100%;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.08);
}

.config-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
}
/* 修复文件选择框的CSS */
.file-checkbox-group {
  max-height: 300px;
  width: 100%;  /* 改为100%，让文件列表占据整个宽度 */
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  background: #fafafa;
}

.file-checkbox {
  display: flex !important;  /* 使用flex布局 */
  align-items: center !important;  /* 垂直居中 */
  margin: 0 !important;
  padding: 16px 20px !important;  /* 调整内边距 */
  border-radius: 10px;
  margin-bottom: 10px !important;
  background: white;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  width: 100% !important;
  min-height: 60px;  /* 设置最小高度，确保一致性 */
}

.file-checkbox:hover {
  border-color: #1a73e8;
  box-shadow: 0 4px 16px rgba(26, 115, 232, 0.15);
  transform: translateY(-2px);
}

.file-checkbox.is-checked {
  border-color: #1a73e8;
  background: #f0f7ff;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

/* 调整复选框位置和大小 */
.file-checkbox :deep(.el-checkbox) {
  display: flex;
  align-items: center;
  width: 100%;
  margin-right: 0;
}

.file-checkbox :deep(.el-checkbox__input) {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;  /* 防止压缩 */
}

.file-checkbox :deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
  width: 100%;
  padding-left: 12px;  /* 在复选框和文件名之间添加间距 */
  cursor: pointer;
  flex: 1;
  min-height: 0;
}

/* 文件信息容器 */
.file-info {
  display: flex;
  flex-direction: column;  /* 改为列布局 */
  gap: 8px;
  flex: 1;
  min-width: 0;  /* 允许收缩 */
  width: 100%;
}

.file-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  display: box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3em;
  flex-shrink: 1;
  min-width: 0;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.file-size {
  font-weight: 500;
  color: #999;
  white-space: nowrap;
  font-size: 13px;
}
/* 题型选择容器 */
.type-list-container {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  background: #fafbfc;
}

/* 每个题型项 */
.type-item {
  padding: 16px 20px;
  background: white;
  border: 2px solid transparent;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-item:last-child {
  margin-bottom: 0;
}

.type-item:hover {
  border-color: #1a73e8;
  background: #f8fafc;
  transform: translateY(-1px);
}

.type-item.selected {
  border-color: #1a73e8;
  background: linear-gradient(to right, #f0f7ff, #e6f7ff);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
}

/* 题型内容容器 */
.type-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}

/* 左侧：复选框 + 题型名称 */
.type-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.type-checkbox-simple {
  flex-shrink: 0;
  margin-right: 0;
}

.type-checkbox-simple :deep(.el-checkbox__label) {
  display: none; /* 隐藏复选框的标签 */
}

.type-checkbox-simple :deep(.el-checkbox__input) {
  width: 20px;
  height: 20px;
}

.type-checkbox-simple :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #1a73e8;
  border-color: #1a73e8;
}

.type-label-text {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  word-break: break-word;
  padding-right: 16px;
}

/* 右侧：数量控制 */
.type-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 4px 8px;
}

.count-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
}

.count-btn:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-display {
  font-size: 15px;
  font-weight: 600;
  color: #1a73e8;
  min-width: 40px;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0 8px 0;
  border-top: 1px solid #eee;
  margin-top: auto;
}

/* 增大标签选择器的字体和尺寸 */
.tag-select {
  font-size: 16px;
}

.tag-select :deep(.el-select__wrapper) {
  height: 56px;
  border-radius: 8px;
}

.tag-select :deep(.el-select__input) {
  font-size: 16px;
  height: 56px;
  line-height: 56px;
  padding: 0 16px;
}

.tag-select :deep(.el-select__placeholder) {
  font-size: 16px;
  color: #999;
}

.tag-select :deep(.el-select__caret) {
  font-size: 20px;
}

.tag-select :deep(.el-select__selected-item) {
  font-size: 14px;
  margin: 4px 8px 4px 0;
  padding: 4px 12px;
  border-radius: 16px;
}

/* 增大选项的字体大小 */
.tag-select :deep(.el-select-dropdown__item) {
  font-size: 15px;
  padding: 12px 16px;
}

.tag-select :deep(.el-select-dropdown__item:hover) {
  background-color: #f0f7ff;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.question-count {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.question-card-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 300px;
}

.question-card {
  width: 100%;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.difficulty-tag {
  background: #e6f7ff;
  color: #1890ff;
}

.question-id {
  margin-left: auto;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.question-content {
  line-height: 1.6;
}

.question-stem {
  font-size: 15px;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.options-list {
  margin: 16px 0;
}

.option-item {
  padding: 10px 14px;
  margin: 6px 0;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #1a73e8;
  display: flex;
  gap: 10px;
}

.option-key {
  font-weight: 600;
  color: #1a73e8;
  min-width: 20px;
}

.answer-section, .explanation-section {
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
}

.answer-header, .explanation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.answer-label, .explanation-label {
  font-weight: 600;
  color: #1a73e8;
}

.answer-value {
  color: #67c23a;
  font-weight: 500;
  padding: 8px;
  background: #f0f9eb;
  border-radius: 6px;
}

.explanation-text {
  color: #666;
  line-height: 1.5;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.question-navigation {
  padding: 16px;
  border-top: 1px solid #eee;
  margin-top: 16px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.question-indexes {
  max-height: 60px;
}

.question-indexes :deep(.el-scrollbar__wrap) {
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
}

.index-button {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.index-button:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.index-button.active {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
}

/* 响应式 */
@media (max-width: 1200px) {
  .page-body {
    flex-direction: column;
    height: auto;
  }
  
  .config-section,
  .preview-section {
    flex: 1 1 100%;
  }
  
  .config-card,
  .preview-card {
    height: auto;
    min-height: 400px;
  }
}
</style>