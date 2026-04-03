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
            <div class="config-quick-stats">
              <el-tag effect="plain" type="info">已选标签 {{ configForm.tags.length }}</el-tag>
              <el-tag effect="plain" type="success">已选文件 {{ configForm.selectedFiles.length }}</el-tag>
              <el-tag effect="plain" type="warning">计划题数 {{ totalQuestionCount }}</el-tag>
            </div>

            <div class="config-form-content">
            <!-- 1. 标签检索 -->
            <el-form-item
                prop="tags"
                class="tag-form-item"
            >
              <div class="tag-form-item-header">
                <span class="tag-label">知识标签</span>
                <el-button
                    v-if="configForm.tags.length > 0"
                    type="text"
                    size="small"
                    class="clear-tags-btn"
                    @click="clearAllTags"
                >
                    取消选择
                </el-button>
              </div>
              <div class="tag-select-container">
                <el-select
                    v-model="configForm.tags"
                    multiple
                    filterable
                    placeholder="选择知识点标签"
                    style="width: 100%"
                    @change="handleTagChange"
                    size="large"
                    class="tag-select"
                    :loading="loadingTags"
                    collapse-tags
                    collapse-tags-tooltip
                    max-collapse-tags="8"
                >
                <el-option
                    v-for="tag in availableTags"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.id"
                >
                  <div class="tag-option">
                    <span class="tag-option-name">{{ tag.name }}</span>
                    <el-tag
                        v-if="tag.color"
                        :color="tag.color"
                        size="small"
                        effect="plain"
                    />
                  </div>
                </el-option>
              </el-select>
              </div>
            </el-form-item>

            <!-- 2. 文件选择 -->
            <el-form-item
                label="知识文件"
                prop="selectedFiles"
                :rules="{ required: true, message: '请至少选择一个文件', trigger: 'change' }"
            >
              <div class="file-toolbar" v-if="!loadingFiles && filteredFiles.length > 0">
                <span class="file-toolbar-text">共 {{ filteredFiles.length }} 个可选文件</span>
                <div class="file-toolbar-actions">
                  <el-button link size="small" @click="selectAllFilteredFiles">全选当前</el-button>
                  <el-button link size="small" @click="clearSelectedFiles">清空文件</el-button>
                </div>
              </div>
              <div v-if="loadingFiles" class="loading-container">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span>加载文件中...</span>
              </div>
              <el-checkbox-group v-else v-model="configForm.selectedFiles" class="file-checkbox-group">
                <el-checkbox
                    v-for="file in filteredFiles"
                    :key="file.id"
                    :label="file.id"
                    class="file-checkbox"
                >
                  <div class="file-info">
                    <div class="file-name">{{ file.name || file.title }}</div>
                    <div class="file-meta">
                      <span class="file-size">{{ formatFileSize(file.file_size ?? file.size ?? file.metadata?.file_size ?? 0) }}</span>
                    </div>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
              <el-empty v-if="!loadingFiles && filteredFiles.length === 0" description="暂无匹配的知识文件" />
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
            </div>

            <!-- 生成按钮 -->
            <div class="form-actions">
              <el-button @click="resetConfig" size="large" :disabled="generating">重置</el-button>
              <el-button
                  v-if="generating"
                  type="danger"
                  :icon="Close"
                  @click="stopGeneration"
                  size="large"
              >
                停止生成
              </el-button>
              <el-button
                  v-else
                  type="primary"
                  :icon="MagicStick"
                  @click="generateQuestions"
                  :disabled="!canGenerate"
                  size="large"
              >
                开始生成
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
              <el-button :icon="Refresh" @click="regenerate" :disabled="generating || !canGenerate">重新生成</el-button>
              <el-button type="success" :icon="Check" @click="saveQuestions" :disabled="generatedQuestions.length === 0">
                保存题目
              </el-button>
            </div>
          </div>

          <!-- 题目卡片 -->
          <div class="question-card-container" :class="{ 'is-generating': generating }">
            <!-- 加载动画 -->
            <div v-if="generating" class="loading-animation">
              <div class="loading-spinner"></div>
              <div class="loading-text">
                <div class="loading-title">正在生成题目</div>
                <div class="loading-subtitle">{{ localizedCurrentStep }}</div>
                <div class="loading-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: generationProgress + '%' }"></div>
                  </div>
                  <div class="progress-text">{{ generationProgress }}%</div>
                </div>
              </div>
            </div>
            
            <el-empty v-else-if="generatedQuestions.length === 0" description="生成题目后将显示在此处" />
            
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
                <div class="question-index-columns">
                  <div
                      v-for="(column, columnIndex) in questionIndexColumns"
                      :key="`col-${columnIndex}`"
                      class="question-index-column"
                  >
                    <button
                        v-for="item in column"
                        :key="item.id"
                        class="index-button"
                        :class="{ active: item.index === currentQuestionIndex }"
                        @click="goToQuestion(item.index)"
                    >
                      {{ item.index + 1 }}
                    </button>
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import {
  MagicStick, Refresh, Check, ArrowLeft, ArrowRight, Loading, Close
} from '@element-plus/icons-vue'
import { Minus, Plus } from '@element-plus/icons-vue'
import {
  getTagList,
  getDocumentList,
  searchDocumentsByTags,
  getDocumentDetail
} from '@/api/knowledge'
import {
  generateQuestions as apiGenerateQuestions,
  getGenerationProgress,
  getQuestionPreview,
  cancelGeneration,
  saveQuestions as apiSaveQuestions
} from '@/api/exam'

// 路由相关
const router = useRouter()
const route = useRoute()
let removeRouteGuard = null

// 表单数据
const configFormRef = ref(null)
const generating = ref(false)
const showAnswer = ref(false)
const showExplanation = ref(false)
const currentQuestionIndex = ref(0)
const pollTimer = ref(null) // 轮询定时器 ID
const shouldStopPolling = ref(false) // 是否应该停止轮询
const currentTaskId = ref('')

// 加载状态
const loadingTags = ref(false)
const loadingFiles = ref(false)
const generationProgress = ref(0) // 生成进度百分比
const currentStep = ref('') // 当前生成步骤

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

// 真实数据
const availableTags = ref([])
const allFiles = ref([])
const generatedQuestions = ref([])

// 计算属性
const filteredFiles = computed(() => {
  if (configForm.tags.length === 0) return allFiles.value
  return allFiles.value.filter(file => 
    file.tags && configForm.tags.some(tagId => 
      file.tags.some(tag => tag.id === tagId)
    )
  )
})

const currentQuestion = computed(() => {
  return generatedQuestions.value[currentQuestionIndex.value] || {}
})

const selectedTypeCounts = computed(() => {
  return configForm.questionTypes.reduce((acc, type) => {
    acc[type] = typeCounts[type] || 1
    return acc
  }, {})
})

const totalQuestionCount = computed(() => {
  return Object.values(selectedTypeCounts.value).reduce((sum, count) => sum + count, 0)
})

const localizedCurrentStep = computed(() => {
  const step = (currentStep.value || '').trim()
  if (!step) return 'AI 正在分析文档并创建题目...'
  const typeMap = {
    single: '单选题',
    multi: '多选题',
    judge: '判断题',
    fill: '填空题',
    essay: '简答题',
    short_answer: '简答题',
    choice: '单选题'
  }
  let localized = step
  Object.entries(typeMap).forEach(([key, label]) => {
    localized = localized.replace(new RegExp(`\\b${key}\\b`, 'gi'), label)
  })
  localized = localized.replace(/正在生成\s*([^\s（(]+)\s*[（(]\s*([^)）]+)\s*[)）]/, '正在生成$1 $2')
  return localized
})

const questionIndexColumns = computed(() => {
  const columns = []
  const columnSize = 5
  generatedQuestions.value.forEach((q, idx) => {
    const columnIndex = Math.floor(idx / columnSize)
    if (!columns[columnIndex]) {
      columns[columnIndex] = []
    }
    columns[columnIndex].push({
      id: q.id ?? `question-${idx}`,
      index: idx
    })
  })
  return columns
})

const canGenerate = computed(() => {
  return configForm.selectedFiles.length > 0 && 
         configForm.questionTypes.length > 0 &&
         totalQuestionCount.value > 0
})

// 加载标签列表
const loadTags = async () => {
  loadingTags.value = true
  try {
    // 加载所有标签（智能标签和自定义标签）
    const smartResponse = await getTagList('smart')
    const customResponse = await getTagList('custom')
    
    const smartTags = smartResponse.data?.tags || smartResponse.tags || []
    const customTags = customResponse.data?.tags || customResponse.tags || []
    
    // 合并标签并去重
    const allTags = [...smartTags, ...customTags]
    availableTags.value = allTags
  } catch (error) {
    console.error('加载标签失败:', error)
    ElMessage.error('加载标签失败')
  } finally {
    loadingTags.value = false
  }
}

// 加载文件列表
const loadFiles = async (tagIds = []) => {
  loadingFiles.value = true
  try {
    if (tagIds.length > 0) {
      // 按标签筛选文件
      const response = await searchDocumentsByTags({
        tag_ids: tagIds,
        match_mode: 'or',
        page: 1,
        page_size: 50
      })
      
      allFiles.value = response.data?.documents || response.documents || []
    } else {
      // 获取所有文件
      const response = await getDocumentList({
        page: 1,
        page_size: 50
      })
      
      allFiles.value = response.data?.documents || response.documents || []
    }
  } catch (error) {
    console.error('加载文件失败:', error)
    ElMessage.error('加载文件失败')
  } finally {
    loadingFiles.value = false
  }
}

const removeFileExtension = (filename = '') => {
  return filename.replace(/\.[^./\\]+$/, '')
}

const formatTimestamp = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hour}${minute}${second}`
}

const initializeFromRoute = async () => {
  const rawDocId = route.query.docId
  if (!rawDocId) return
  const docId = Number(rawDocId)
  if (!Number.isFinite(docId) || docId <= 0) return
  const docTitle = typeof route.query.docTitle === 'string' ? route.query.docTitle : ''
  
  configForm.bindType = 'by_file'
  configForm.tags = []
  configForm.selectedFiles = [docId]
  if (!configForm.questionSetName && docTitle) {
    const baseName = removeFileExtension(docTitle).trim() || `文档${docId}`
    configForm.questionSetName = `${baseName}_题目集_${formatTimestamp()}`
  }
  
  const existsInList = allFiles.value.some(file => Number(file.id) === docId)
  if (!existsInList) {
    try {
      const response = await getDocumentDetail(docId)
      const detail = response.data || response
      if (detail && detail.id) {
        allFiles.value = [{
          id: detail.id,
          title: detail.title || docTitle || `文档 ${docId}`,
          name: detail.title || docTitle || `文档 ${docId}`,
          file_size: detail.file_size || detail.size || 0,
          size: detail.size || detail.file_size || 0,
          tags: detail.tags || []
        }, ...allFiles.value]
      }
    } catch (error) {
      console.warn('根据路由参数加载文档详情失败:', error)
    }
  }
  
  ElMessage.success('已选中来源文档，请配置参数后点击开始生成')
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadTags()
  await loadFiles()
  await initializeFromRoute()
  
  // 添加路由守卫
  removeRouteGuard = router.beforeEach((to, from, next) => {
    if (generating.value) {
      ElMessageBox.confirm(
        '题目正在生成中，确定要离开吗？离开后生成过程将继续，但您无法在这里查看进度。',
        '确认离开',
        {
          confirmButtonText: '确定离开',
          cancelButtonText: '继续等待',
          type: 'warning'
        }
      ).then(() => {
        // 清除轮询
        if (pollTimer.value) {
          clearTimeout(pollTimer.value)
          pollTimer.value = null
        }
        shouldStopPolling.value = true
        next()
      }).catch(() => {
        next(false)
      })
    } else {
      next()
    }
  })
})

onUnmounted(() => {
  // 移除路由守卫
  if (removeRouteGuard) {
    removeRouteGuard()
  }
  // 清除轮询
  if (pollTimer.value) {
    clearTimeout(pollTimer.value)
  }
})

// 工具方法
const getTagType = (type) => {
  const map = { single: '', multi: 'warning', judge: 'success', fill: 'info', essay: 'danger' }
  return map[type] || ''
}

const getTypeLabel = (type) => {
  const map = { 
    single: '单选题', 
    multi: '多选题', 
    judge: '判断题', 
    fill: '填空题', 
    essay: '简答题' 
  }
  return map[type] || type
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


const normalizeDifficulty = (difficulty) => {
  const raw = String(difficulty ?? '').trim().toLowerCase()
  const map = {
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
    mixed: 'mixed',
    简单: 'easy',
    中等: 'medium',
    困难: 'hard',
    混合: 'mixed'
  }
  return map[raw] || ''
}

const getDifficultyLabel = (difficulty) => {
  const normalized = normalizeDifficulty(difficulty) || normalizeDifficulty(configForm.difficulty) || 'medium'
  const map = { easy: '简单', medium: '中等', hard: '困难', mixed: '混合' }
  return map[normalized] || '中等'
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
const handleTagChange = async () => {
  configForm.selectedFiles = []
  await loadFiles(configForm.tags)
}

// 取消全选标签
const clearAllTags = async () => {
  configForm.tags = []
  configForm.selectedFiles = []
  await loadFiles([])
}

const selectAllFilteredFiles = () => {
  configForm.selectedFiles = filteredFiles.value.map(file => file.id)
}

const clearSelectedFiles = () => {
  configForm.selectedFiles = []
}

const generateQuestions = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请完善生成参数')
    return
  }

  shouldStopPolling.value = false
  currentTaskId.value = ''
  generating.value = true
  generationProgress.value = 0
  currentStep.value = '准备生成题目...'
  
  try {
    // 调用 API 生成题目
    const response = await apiGenerateQuestions({
      question_types: configForm.questionTypes,
      document_ids: configForm.selectedFiles,
      tags: configForm.tags,
      difficulty: configForm.difficulty,
      question_count: totalQuestionCount.value,
      include_answers: true,
      include_analysis: true,
      question_set_name: configForm.questionSetName,
      bind_type: configForm.bindType,
      type_counts: selectedTypeCounts.value
    })

    console.log('生成题目响应:', response)

    // 如果立即返回了题目
    if (response.questions && response.questions.length > 0) {
      // 转换题型和字段：后端返回 choice -> 前端使用 single, content -> stem
      const convertedQuestions = response.questions.map(q => {
        console.log('原始题目数据:', q)
        return {
          ...q,
          type: q.type === 'choice' ? 'single' : q.type,
          stem: q.content,  // 将 content 映射为 stem
          options: q.options ? Object.entries(q.options).map(([key, text]) => ({ key, text })) : [],
          difficulty: normalizeDifficulty(q.difficulty) || normalizeDifficulty(configForm.difficulty) || 'medium'
        }
      })
      
      console.log('转换后的题目数据:', convertedQuestions)
      generatedQuestions.value = convertedQuestions
      currentQuestionIndex.value = 0
      showAnswer.value = false
      showExplanation.value = false
      // 题目数据准备好后才关闭加载动画
      generating.value = false
      generationProgress.value = 0
      currentStep.value = ''
      ElMessage.success(`成功生成 ${convertedQuestions.length} 道题目`)
    } else if (response.task_id) {
      // 如果是异步任务，轮询查询进度（直到获取到题目）
      currentTaskId.value = response.task_id
      if (shouldStopPolling.value) {
        await cancelGeneration(response.task_id)
        generating.value = false
        generationProgress.value = 0
        currentStep.value = ''
        currentTaskId.value = ''
        ElMessage.info('已停止生成题目')
        return
      }
      currentStep.value = '题目生成中...'
      await pollGenerationProgress(response.task_id)
      // pollGenerationProgress 内部会在获取到题目后关闭加载动画
    } else {
      ElMessage.error('生成失败，请稍后重试')
      generating.value = false
      generationProgress.value = 0
      currentStep.value = ''
      currentTaskId.value = ''
    }

  } catch (error) {
    console.error('生成题目失败:', error)
    ElMessage.error(error.response?.data?.detail || '生成题目失败，请稍后重试')
    generating.value = false
    generationProgress.value = 0
    currentStep.value = ''
    currentTaskId.value = ''
  }
}

// 轮询生成进度
const pollGenerationProgress = async (taskId) => {
  const maxAttempts = 300 // 最多轮询 300 次
  const interval = 6000 // 每 6 秒查询一次
  let attempts = 0

  // 初始进度
  generationProgress.value = 10
  currentStep.value = '正在分析文档...'
  shouldStopPolling.value = false

  const poll = async () => {
    // 检查是否应该停止
    if (shouldStopPolling.value) {
      console.log('用户取消生成')
      return
    }

    try {
      const progress = await getGenerationProgress(taskId)
      console.log('生成进度:', progress)

      // 更新进度显示
      if (progress.progress !== undefined) {
        // 确保进度至少为 10%，避免进度条不显示
        generationProgress.value = Math.max(10, progress.progress)
      }
      if (progress.current_step) {
        currentStep.value = progress.current_step
      }

      // 处理 ready 状态：题目已生成，等待用户确认
      if (progress.status === 'ready') {
        console.log('题目生成完成，状态为 ready，调用预览接口获取题目')
        
        // 设置进度为 100%
        generationProgress.value = 100
        currentStep.value = '题目生成完成，等待用户确认'
        
        try {
          // 调用预览接口获取所有题目
          const previewResult = await getQuestionPreview(taskId, { page: 1, page_size: 50 })
          console.log('预览接口返回结果:', previewResult)
          
          if (previewResult.data && previewResult.data.length > 0) {
            // 转换题型和字段：后端返回 choice -> 前端使用 single, content -> stem
            const convertedQuestions = previewResult.data.map(q => {
              console.log('原始题目数据 (预览):', q)
              return {
                ...q,
                type: q.type === 'choice' ? 'single' : q.type,
                stem: q.stem,  // 将 content 映射为 stem
                options: q.options ? Object.entries(q.options).map(([key, text]) => ({ key, text })) : [],
                explanation: q.explanation,  // analysis -> explanation
                difficulty: normalizeDifficulty(q.difficulty) || normalizeDifficulty(configForm.difficulty) || 'medium'
              }
            })
            
            console.log('转换后的题目数据 (预览):', convertedQuestions)
            generatedQuestions.value = convertedQuestions
            currentQuestionIndex.value = 0
            showAnswer.value = false
            showExplanation.value = false
            
            // 关闭加载动画，但保持题目数据供用户预览和保存
            generating.value = false
            generationProgress.value = 0
            currentStep.value = ''
            currentTaskId.value = ''
            ElMessage.success(`成功生成 ${convertedQuestions.length} 道题目，请预览并确认保存`)
          } else {
            ElMessage.warning('题目生成完成，但未获取到题目数据')
            generating.value = false
            generationProgress.value = 0
            currentStep.value = ''
            currentTaskId.value = ''
          }
        } catch (error) {
          console.error('获取题目预览失败:', error)
          ElMessage.error('获取题目预览失败，请稍后重试')
          generating.value = false
          generationProgress.value = 0
          currentStep.value = ''
          currentTaskId.value = ''
        }
        return
      }

      if (progress.status === 'completed' && progress.questions) {
        // 设置进度为 100%
        generationProgress.value = 100
        currentStep.value = '题目生成完成'
        
        // 稍微延迟显示结果，让用户看到 100% 的进度
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 转换题型和字段：后端返回 choice -> 前端使用 single, content -> stem
        const convertedQuestions = progress.questions.map(q => {
          console.log('原始题目数据 (轮询):', q)
          return {
            ...q,
            type: q.type === 'choice' ? 'single' : q.type,
            stem: q.content,  // 将 content 映射为 stem
            options: q.options ? Object.entries(q.options).map(([key, text]) => ({ key, text })) : [],
            difficulty: normalizeDifficulty(q.difficulty) || normalizeDifficulty(configForm.difficulty) || 'medium'
          }
        })
        
        console.log('转换后的题目数据 (轮询):', convertedQuestions)
        generatedQuestions.value = convertedQuestions
        currentQuestionIndex.value = 0
        showAnswer.value = false
        showExplanation.value = false
        // 题目数据准备好后才关闭加载动画
        generating.value = false
        generationProgress.value = 0
        currentStep.value = ''
        currentTaskId.value = ''
        ElMessage.success(`成功生成 ${convertedQuestions.length} 道题目`)
        return
      }

      if (progress.status === 'cancelled') {
        generating.value = false
        generationProgress.value = 0
        currentStep.value = ''
        currentTaskId.value = ''
        ElMessage.info('题目生成已停止')
        return
      }

      if (progress.status === 'failed') {
        ElMessage.error(progress.error_message || '生成失败')
        generating.value = false
        generationProgress.value = 0
        currentStep.value = ''
        currentTaskId.value = ''
        return
      }

      attempts++
      if (attempts >= maxAttempts) {
        ElMessage.warning('生成超时，请稍后重试')
        generating.value = false
        generationProgress.value = 0
        currentStep.value = ''
        currentTaskId.value = ''
        return
      }

      // 继续轮询
      pollTimer.value = setTimeout(poll, interval)

    } catch (error) {
      console.error('查询进度失败:', error)
      ElMessage.error('查询进度失败')
      generating.value = false
      generationProgress.value = 0
      currentStep.value = ''
      currentTaskId.value = ''
    }
  }

  // 启动轮询
  poll()
}

// 停止生成
const stopGeneration = async () => {
  // 设置停止标志
  shouldStopPolling.value = true
  
  // 清除定时器
  if (pollTimer.value) {
    clearTimeout(pollTimer.value)
    pollTimer.value = null
  }
  
  try {
    if (currentTaskId.value) {
      await cancelGeneration(currentTaskId.value)
    }
    generating.value = false
    generationProgress.value = 0
    currentStep.value = ''
    currentTaskId.value = ''
    ElMessage.info('已停止生成题目')
  } catch (error) {
    console.error('停止生成失败:', error)
    ElMessage.error(error.response?.data?.detail || '停止生成失败，请稍后重试')
  }
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

const saveQuestions = async () => {
  if (generatedQuestions.value.length === 0) {
    ElMessage.warning('没有可保存的题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认保存 ${generatedQuestions.value.length} 道题目？`,
      '保存题目',
      { type: 'success', confirmButtonText: '确认', cancelButtonText: '取消' }
    )

    // 转换题目格式为后端要求的格式
    const formattedQuestions = generatedQuestions.value.map(q => {
      // 转换题型：前端 single -> 后端 choice
      const backendType = q.type === 'single' ? 'choice' : q.type
      
      // 转换选项格式：数组 -> 对象
      let options = null
      if (q.options && Array.isArray(q.options)) {
        options = {}
        q.options.forEach(opt => {
          options[opt.key] = opt.text
        })
      }

      return {
        content: q.stem,  // stem -> content
        type: backendType,
        options: options,
        answer: q.answer,
        analysis: q.explanation,  // explanation -> analysis
        difficulty: q.difficulty || 'medium',
        tags: configForm.tags,  // 直接使用当前选择的标签ID数组
        source_document_id: configForm.selectedFiles[0] ? Number(configForm.selectedFiles[0]) : null
      }
    })

    // 调试信息
    console.log('准备保存的题目格式:', {
      questions: formattedQuestions,
      save_mode: 'append'
    })

    // 调用 API 保存题目
    const response = await apiSaveQuestions({
      questions: formattedQuestions,
      save_mode: 'append',
      question_set_name: configForm.questionSetName || undefined,
      document_ids: configForm.selectedFiles.map(id => Number(id))
    })
    
    console.log('保存题目响应:', response)
    
    ElMessage.success(`成功保存 ${response.saved_count || generatedQuestions.value.length} 道题目`)
    resetConfig()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存题目失败:', error)
      console.error('错误详情:', error.response?.data)
      ElMessage.error(error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || '保存题目失败，请稍后重试')
    }
  }
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
  height: calc(100vh - 140px);
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

.config-card :deep(.el-card__body),
.preview-card :deep(.el-card__body) {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.config-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}

.config-quick-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.config-form-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fafafa;
  color: #666;
  font-size: 14px;
}

.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.file-toolbar-text {
  font-size: 13px;
  color: #606266;
}

.file-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-icon {
  margin-right: 10px;
  font-size: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  padding: 14px 0 4px;
  border-top: 1px solid #eee;
  margin-top: 12px;
  background: #fff;
}

/* 标签表单项目 */
.tag-form-item {
  position: relative;
  margin-bottom: 16px;
}

/* 标签表单项目头部 */
.tag-form-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  height: 24px;
}

/* 标签文本 */
.tag-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 24px;
}

/* 标签选择器容器 */
.tag-select-container {
  position: relative;
  width: 100%;
  margin-top: 0; /* 不需要上边距，因为已经在tag-form-item-header中设置了margin-bottom */
}

/* 增大标签选择器的字体和尺寸 */
.tag-select {
  font-size: 16px;
  width: 100%;
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
  font-size: 15px; /* 增大1px */
  margin: 4px 8px 4px 0;
  padding: 5px 12px;
  border-radius: 16px;
  font-weight: 500;
}

/* 增大选项的字体大小 */
.tag-select :deep(.el-select-dropdown__item) {
  font-size: 15px;
  padding: 8px 16px;
  height: auto;
  min-height: 32px;
  display: flex;
  align-items: center;
}

/* 可选标签的透明蓝色背景 */
.tag-select :deep(.el-select-dropdown__item) {
  background-color: transparent;
  border-radius: 4px;
  margin: 2px 8px;
  transition: all 0.3s ease;
}

.tag-select :deep(.el-select-dropdown__item:hover) {
  background-color: rgba(64, 158, 255, 0.1); /* 透明的蓝色 */
  border-radius: 4px;
}

/* 确保背景与标签名高度吻合 */
.tag-select :deep(.el-select-dropdown__item span) {
  display: inline-block;
  line-height: 1.4;
}

/* 标签选项样式 */
.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  margin: 0;
  height: 100%;
}

.tag-option-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.tag-option :deep(.el-tag) {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 增大已选标签的字体 */
.tag-select :deep(.el-select__tags) {
  font-size: 15px;
}

.tag-select :deep(.el-select__tags .el-tag) {
  font-size: 15px; /* 增大1px */
  padding: 6px 12px;
  margin: 4px 6px 4px 0;
  font-weight: 500;
}

/* 取消全选按钮 */
.clear-tags-btn {
  font-size: 13.5px;
  font-weight: 500;
  color: #409EFF;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  background-color: #ecf5ff; /* 淡蓝色背景 */
  margin-left: 20px;
}

.clear-tags-btn:hover {
  color: #409EFF;
  background-color: #d9ecff;
  border-color: #c6e2ff;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
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
  align-items: stretch;
  justify-content: stretch;
  padding: 16px 20px;
  min-height: 0;
  overflow: hidden;
}

.question-card-container.is-generating {
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.question-card {
  width: 100%;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
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
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: #fff;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  margin-top: 0;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.question-indexes {
  max-height: 240px;
  overflow: hidden;
}

.question-indexes :deep(.el-scrollbar__wrap) {
  overflow-x: auto;
  overflow-y: auto;
  padding-bottom: 10px;
}

.question-index-columns {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: max-content;
}

.question-index-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

  .question-generator-page {
    margin-left: 0;
    margin-right: 0;
    padding: 16px;
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

/* 加载动画样式 */
.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 320px;
  padding: 36px 32px;
  text-align: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  border: 1px solid #e3efff;
  box-shadow: 0 8px 24px rgba(26, 115, 232, 0.12);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-title {
  font-size: 26px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.loading-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.4;
  line-height: 1.6;
}

.loading-progress {
  width: 100%;
  max-width: 300px;
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #409EFF;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
</style>
