<!-- src/views/exam/ExamPage.vue -->
<template>
  <div class="exam-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><EditPen /></el-icon>
        智能题卷生成
      </h2>
      <el-steps :active="currentStep" finish-status="success" simple class="page-steps">
        <el-step title="参数配置" />
        <el-step title="题目预览" />
      </el-steps>
    </div>

    <div class="page-body">
      <!-- 步骤1：参数配置 -->
      <el-card v-if="currentStep === 0" class="config-card" shadow="never">
        <el-form
            ref="configFormRef"
            :model="configForm"
            label-position="top"
            class="config-form"
        >
          <el-row :gutter="24">
            <!-- 知识标签选择 -->
            <el-col :xs="24" :md="12">
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
                >
                  <el-option
                      v-for="tag in availableTags"
                      :key="tag"
                      :label="tag"
                      :value="tag"
                  >
                    <span style="float: left">{{ tag }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">
                      {{ tagQuestionCount[tag] || 0 }}题
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 题型选择 -->
            <el-col :xs="24" :md="12">
              <el-form-item label="题型" prop="questionTypes">
                <el-checkbox-group v-model="configForm.questionTypes">
                  <el-checkbox label="single">单选题</el-checkbox>
                  <el-checkbox label="multi">多选题</el-checkbox>
                  <el-checkbox label="judge">判断题</el-checkbox>
                  <el-checkbox label="fill">填空题</el-checkbox>
                  <el-checkbox label="essay">简答题</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>

            <!-- 题目数量 -->
            <el-col :xs="24" :md="8">
              <el-form-item
                  label="题目数量"
                  prop="count"
                  :rules="[
                  { required: true, message: '请输入数量' },
                  { type: 'number', min: 1, max: 50, message: '范围1-50' }
                ]"
              >
                <el-input-number
                    v-model="configForm.count"
                    :min="1"
                    :max="50"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <!-- 难度选择 -->
            <el-col :xs="24" :md="8">
              <el-form-item label="难度分布" prop="difficulty">
                <el-select v-model="configForm.difficulty" style="width: 100%">
                  <el-option label="🟢 简单" value="easy" />
                  <el-option label="🟡 中等" value="medium" />
                  <el-option label="🔴 困难" value="hard" />
                  <el-option label="⚖️ 混合" value="mixed" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 高级选项 -->
            <el-col :xs="24" :md="8">
              <el-form-item label="排除已做">
                <el-switch v-model="configForm.excludeDone" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 生成按钮 -->
          <div class="form-actions">
            <el-button @click="resetConfig">重置</el-button>
            <el-button type="primary" :icon="MagicStick" :loading="generating" @click="generateQuestions">
              {{ generating ? 'AI生成中...' : '✨ 开始生成' }}
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 步骤2：题目预览 -->
      <el-card v-else class="preview-card" shadow="never">
        <div class="preview-header">
          <h3 class="preview-title">生成结果（{{ generatedQuestions.length }}/{{ configForm.count }}）</h3>
          <div class="preview-actions">
            <el-button :icon="Refresh" @click="regenerate">重新生成</el-button>
            <el-button type="success" :icon="Check" @click="confirmAll">全部确认入库</el-button>
          </div>
        </div>

        <el-scrollbar class="question-list">
          <el-card
              v-for="(q, index) in generatedQuestions"
              :key="q.id"
              class="question-card"
              shadow="hover"
          >
            <template #header>
              <div class="question-header">
                <el-tag size="small" :type="getTagType(q.type)">{{ getTypeLabel(q.type) }}</el-tag>
                <el-tag size="small" effect="plain">{{ q.difficulty }}</el-tag>
                <el-tag
                    v-for="tag in q.tags"
                    :key="tag"
                    size="small"
                    class="question-tag"
                >
                  {{ tag }}
                </el-tag>
                <div class="question-ops">
                  <el-button link :icon="Edit" size="small" @click="editQuestion(q)">编辑</el-button>
                  <el-button link :icon="Delete" size="small" type="danger" @click="removeQuestion(q.id)">移除</el-button>
                </div>
              </div>
            </template>

            <!-- 题目内容 -->
            <div class="question-content">
              <p class="question-stem"><strong>Q{{ index + 1 }}.</strong> {{ q.stem }}</p>

              <!-- 选项 -->
              <div v-if="['single', 'multi'].includes(q.type)" class="options-list">
                <div
                    v-for="opt in q.options"
                    :key="opt.key"
                    class="option-item"
                    :class="{ correct: q.answer?.includes(opt.key) }"
                >
                  <span class="option-key">{{ opt.key }}.</span>
                  <span class="option-text">{{ opt.text }}</span>
                </div>
              </div>

              <!-- 答案区域 -->
              <div class="answer-section" v-if="q.answer">
                <span class="answer-label">参考答案：</span>
                <span class="answer-value">{{ formatAnswer(q.answer, q.type) }}</span>
              </div>

              <!-- 解析 -->
              <div v-if="q.explanation" class="explanation-section">
                <span class="explanation-label">解析：</span>
                <p class="explanation-text">{{ q.explanation }}</p>
              </div>
            </div>

            <!-- 编辑对话框 -->
            <el-dialog
                v-model="editDialogVisible"
                title="编辑题目"
                width="700px"
                append-to-body
            >
              <el-form :model="editingQuestion" label-position="top">
                <el-form-item label="题干">
                  <el-input
                      v-model="editingQuestion.stem"
                      type="textarea"
                      :rows="3"
                  />
                </el-form-item>
                <el-form-item label="选项" v-if="['single', 'multi'].includes(editingQuestion.type)">
                  <div v-for="(opt, idx) in editingQuestion.options" :key="idx" class="option-editor">
                    <el-input v-model="opt.text" placeholder="选项内容" />
                  </div>
                </el-form-item>
                <el-form-item label="答案">
                  <el-input v-model="editingQuestion.answer" placeholder="输入答案" />
                </el-form-item>
                <el-form-item label="解析">
                  <el-input
                      v-model="editingQuestion.explanation"
                      type="textarea"
                      :rows="3"
                      placeholder="题目解析..."
                  />
                </el-form-item>
              </el-form>
              <template #footer>
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveEdit">保存修改</el-button>
              </template>
            </el-dialog>
          </el-card>
        </el-scrollbar>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen, MagicStick, Refresh, Check, Edit, Delete
} from '@element-plus/icons-vue'

// 表单数据
const currentStep = ref(0)
const generating = ref(false)
const configFormRef = ref(null)

const configForm = reactive({
  tags: [],
  questionTypes: ['single'],
  count: 10,
  difficulty: 'mixed',
  excludeDone: true
})

const availableTags = ref(['数学', '物理', '化学', '英语', '编程', '历史', '地理', '生物'])
const tagQuestionCount = ref({ 数学: 156, 物理: 89, 化学: 67, 英语: 234 })

const generatedQuestions = ref([])
const editDialogVisible = ref(false)
const editingQuestion = ref({})

// 工具方法
const getTagType = (type) => {
  const map = { single: '', multi: 'warning', judge: 'success', fill: 'info', essay: 'danger' }
  return map[type] || ''
}

const getTypeLabel = (type) => {
  const map = { single: '单选题', multi: '多选题', judge: '判断题', fill: '填空题', essay: '简答题' }
  return map[type] || type
}

const formatAnswer = (answer, type) => {
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer
}

// 生成题目（模拟）
const generateQuestions = async () => {
  if (!configForm.tags.length) {
    ElMessage.warning('请至少选择一个知识标签')
    return
  }

  generating.value = true
  // 模拟API请求
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 模拟生成结果
  generatedQuestions.value = Array.from({ length: configForm.count }, (_, i) => ({
    id: Date.now() + i,
    type: configForm.questionTypes[0] || 'single',
    difficulty: configForm.difficulty === 'mixed'
        ? ['easy', 'medium', 'hard'][i % 3]
        : configForm.difficulty,
    tags: configForm.tags.slice(0, 2),
    stem: `【示例】这是一道关于${configForm.tags[0] || '知识点'}的第${i + 1}道题目？`,
    options: configForm.questionTypes.includes('single') || configForm.questionTypes.includes('multi')
        ? [
          { key: 'A', text: '选项A content' },
          { key: 'B', text: '选项B content' },
          { key: 'C', text: '选项C content' },
          { key: 'D', text: '选项D content' }
        ]
        : undefined,
    answer: configForm.questionTypes[0] === 'judge' ? (i % 2 === 0) : ['A', 'B'][i % 2],
    explanation: '这是题目的详细解析，帮助理解知识点和解题思路。'
  }))

  generating.value = false
  currentStep.value = 1
  ElMessage.success(`成功生成 ${generatedQuestions.value.length} 道题目`)
}

const resetConfig = () => {
  configForm.tags = []
  configForm.questionTypes = ['single']
  configForm.count = 10
  configForm.difficulty = 'mixed'
  ElMessage.info('已重置配置')
}

const regenerate = () => {
  currentStep.value = 0
  ElMessage.info('调整参数后重新生成')
}

const confirmAll = () => {
  ElMessageBox.confirm(
      `确认将 ${generatedQuestions.value.length} 道题目加入题库？`,
      '确认入库',
      { type: 'success', confirmButtonText: '确认', cancelButtonText: '取消' }
  ).then(() => {
    ElMessage.success('题目已成功入库')
    generatedQuestions.value = []
    currentStep.value = 0
  })
}

const removeQuestion = (id) => {
  generatedQuestions.value = generatedQuestions.value.filter(q => q.id !== id)
  ElMessage.info('已移除该题目')
}

const editQuestion = (q) => {
  editingQuestion.value = JSON.parse(JSON.stringify(q))
  editDialogVisible.value = true
}

const saveEdit = () => {
  const idx = generatedQuestions.value.findIndex(q => q.id === editingQuestion.value.id)
  if (idx !== -1) {
    generatedQuestions.value[idx] = { ...editingQuestion.value }
    ElMessage.success('修改已保存')
  }
  editDialogVisible.value = false
}
</script>

<style scoped>
.exam-page {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8f9fa 0%, #eef5ff 100%);
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  padding: 16px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.08);
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 600;
  color: #1a73e8;
  margin: 0 0 16px 0;
}

.page-steps {
  max-width: 500px;
  margin: 0 auto;
}

.page-body {
  flex: 1;
  min-height: 0;
}

.config-card, .preview-card {
  height: 100%;
  border-radius: 16px;
  border: none;
}

.config-form {
  padding: 8px 8px 0 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 8px 8px 8px;
  border-top: 1px solid #eee;
  margin-top: 8px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 16px 8px;
  border-bottom: 1px solid #eee;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.question-list {
  padding: 16px 8px;
  height: calc(100% - 70px);
}

.question-card {
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid #eee;
}

.question-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #fafafa;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.question-tag {
  background: #f0f7ff;
  color: #1a73e8;
}

.question-ops {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.question-content {
  padding: 8px 4px;
}

.question-stem {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 12px 0;
}

.options-list {
  margin: 12px 0;
}

.option-item {
  padding: 10px 14px;
  margin: 6px 0;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  display: flex;
  gap: 10px;
}

.option-item:hover {
  background: #f0f7ff;
}

.option-item.correct {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.option-key {
  font-weight: 600;
  color: #1a73e8;
  min-width: 20px;
}

.answer-section, .explanation-section {
  margin-top: 12px;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
}

.answer-label, .explanation-label {
  font-weight: 600;
  color: #1a73e8;
  margin-right: 6px;
}

.answer-value {
  color: #67c23a;
  font-weight: 500;
}

.explanation-text {
  margin: 6px 0 0 0;
  color: #666;
  line-height: 1.5;
}

.option-editor {
  margin-bottom: 10px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
  }
  .config-form {
    padding: 0;
  }
}
</style>