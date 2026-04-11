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
          <el-button type="primary" :disabled="!selectedSetId" @click="openExportDialog" :icon="Download">导出</el-button>
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
          :percentage="Math.round((answeredCount / questions.length) * 100)" 
          :stroke-width="12"
          striped
          striped-flow
          :color="mode === 'exam' ? '#409eff' : '#67c23a'"
        />
        <span class="progress-text">进度: {{ answeredCount }}/{{ questions.length }}</span>
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
          :statusMap="questionStatusMap"
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
            <span class="practice-info">练习模式</span>
            <el-button type="success" @click="saveProgress" :icon="DocumentChecked">保存进度</el-button>
            <el-button type="primary" @click="finishPractice" :icon="Finished">完成练习</el-button>
          </div>
        </div>
        <div class="status-summary-bar" v-if="questions.length > 0">
          <div class="summary-item">
            <span class="label">已作答</span>
            <strong>{{ statusSummary.answered }}</strong>
          </div>
          <div class="summary-item success">
            <span class="label">正确</span>
            <strong>{{ statusSummary.correct }}</strong>
          </div>
          <div class="summary-item danger">
            <span class="label">错误</span>
            <strong>{{ statusSummary.wrong }}</strong>
          </div>
          <div class="summary-item neutral">
            <span class="label">未作答</span>
            <strong>{{ statusSummary.unanswered }}</strong>
          </div>
          <el-tag size="small" :type="currentQuestionStatusTagType">
            当前题：{{ currentQuestionStatusLabel }}
          </el-tag>
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
                    <el-tag size="small" :type="getQuestionStatusTagType(question)">
                      {{ getQuestionStatusLabel(question) }}
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
                      <h4>你的答案</h4>
                      <p>{{ formatUserAnswer(question, getUserAnswer(question.id)) }}</p>
                    </div>
                    <div v-if="question.type === 'essay' && essayEvaluationMap[question.id]" class="explanation-section">
                      <h4>AI 批改</h4>
                      <p>得分：{{ Math.round(essayEvaluationMap[question.id].score || 0) }} 分</p>
                      <p>{{ essayEvaluationMap[question.id].feedback || '暂无反馈' }}</p>
                      <p>关键词命中：{{ formatKeywordList(essayEvaluationMap[question.id].keywordsMatched) }}</p>
                      <p>关键词缺失：{{ formatKeywordList(essayEvaluationMap[question.id].keywordsMissing) }}</p>
                    </div>
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
                      <p>{{ formatKnowledgePointNames(question.knowledge_points) }}</p>
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
                  v-if="currentQuestion.id"
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
                <p class="knowledge-points">{{ formatKnowledgePointNames(currentQuestion.knowledge_points) }}</p>
                <template v-if="currentQuestion.type === 'essay' && currentEssayEvaluation">
                  <h3>AI 批改</h3>
                  <p class="knowledge-points">得分：{{ Math.round(currentEssayEvaluation.score) }} 分</p>
                  <p class="explanation-text">{{ currentEssayEvaluation.feedback || '暂无反馈' }}</p>
                  <p class="knowledge-points">关键词命中：{{ formatKeywordList(currentEssayEvaluation.keywordsMatched) }}</p>
                  <p class="knowledge-points">关键词缺失：{{ formatKeywordList(currentEssayEvaluation.keywordsMissing) }}</p>
                </template>
              </el-card>
            </div>
          </div>
          <div v-else class="single-view">
            <transition name="fade" mode="out-in">
              <div class="question-frame" :class="questionFrameClass">
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
              </div>
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
            <el-button type="warning" @click="addedMistakesSet.has(currentQuestion?.id) ? removeFromMistakes(currentQuestion.id) : addToMistakes()" :icon="Star">
              {{ addedMistakesSet.has(currentQuestion?.id) ? '取消加入' : '加入错题集' }}
            </el-button>
            <el-button type="info" @click="openReviewDialog" :icon="Edit">复核题目</el-button>
          </div>
        </div>

        <div v-if="showReport" class="report-floating" :class="{ collapsed: reportCollapsed }">
          <div class="report-header">
            <span>{{ mode === 'practice' ? '练习报告' : '考试报告' }}</span>
            <div class="report-header-actions">
              <el-button link type="primary" @click="toggleReportCollapse">
                {{ reportCollapsed ? '展开' : '收起' }}
              </el-button>
              <el-button link type="info" @click="closeReport">关闭</el-button>
            </div>
          </div>
          <div v-show="!reportCollapsed" class="report-body">
            <p>总题数：{{ questions.length }}</p>
            <p>最终得分：{{ formatScore(report.score) }} 分</p>
            <p>占总分：{{ formatScore(report.score) }} / {{ formatScore(report.totalScore) }}</p>
            <p>用时：{{ report.timeUsed }} 秒</p>
            <div class="report-actions">
              <el-button type="primary" @click="viewAllExplanations">查看全部解析</el-button>
              <el-button type="success" @click="addAllWrongToMistakes" :disabled="report.wrongCount === 0">
                批量加入错题集{{ report.wrongCount > 0 ? `(${report.wrongCount})` : '' }}
              </el-button>
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
          <el-select
            v-model="reviewingQuestion.knowledge_point_ids"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择知识点"
            style="width: 100%"
          >
            <el-option
              v-for="point in knowledgePointOptions"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
          <div v-if="knowledgePointCandidates.length > 0" class="knowledge-candidates">
            <span class="candidate-label">候选：</span>
            <el-tag
              v-for="candidate in knowledgePointCandidates"
              :key="candidate.name"
              class="candidate-tag"
              @click="addCandidateKnowledgePoint(candidate.name)"
            >
              {{ candidate.name }}({{ candidate.count }})
            </el-tag>
          </div>
          <div class="knowledge-actions">
            <el-button text type="primary" @click="openKnowledgePointMetaDialog">编辑已选知识点元信息</el-button>
            <el-button text type="primary" @click="refreshKnowledgePointCandidates">智能生成候选</el-button>
          </div>
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

    <el-dialog v-model="knowledgePointMetaDialogVisible" title="编辑知识点元信息" width="640px" append-to-body>
      <el-form :model="knowledgePointMetaForm" label-position="top">
        <el-form-item label="选择知识点">
          <el-select
            v-model="selectedKnowledgePointMetaId"
            filterable
            placeholder="请选择要编辑的知识点"
            style="width: 100%"
            @change="syncKnowledgePointMetaFormById"
          >
            <el-option
              v-for="point in editableKnowledgePointOptions"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="knowledgePointMetaForm.name" placeholder="知识点名称" />
        </el-form-item>
        <el-form-item label="编码（留空自动生成）">
          <el-input v-model="knowledgePointMetaForm.code" placeholder="如 KP_MARXISM_FOUNDATION" />
        </el-form-item>
        <el-form-item label="父知识点">
          <el-select
            v-model="knowledgePointMetaForm.parent_id"
            clearable
            filterable
            placeholder="不选择表示根节点"
            style="width: 100%"
          >
            <el-option
              v-for="point in parentKnowledgePointOptions"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="knowledgePointMetaForm.description" type="textarea" :rows="3" placeholder="知识点描述" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="knowledgePointMetaForm.sort_order" :min="0" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启停状态">
              <el-radio-group v-model="knowledgePointMetaForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="knowledgePointMetaDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="knowledgePointMetaSaving" @click="saveKnowledgePointMeta">保存元信息</el-button>
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
          <el-table-column prop="question_set_name" label="练习名称" width="200" />
          <el-table-column prop="total_questions" label="总题数" width="90" />
          <el-table-column prop="correct_count" label="正确" width="70" />
          <el-table-column prop="wrong_count" label="错误" width="70" />
          <el-table-column label="正确率" width="100">
            <template #default="{ row }">
              {{ calcAccuracy(row.correct_count, row.total_questions || row.correct_count + row.wrong_count) }}
            </template>
          </el-table-column>
          <el-table-column label="用时" width="100">
            <template #default="{ row }">
              {{ formatTime(row.time_used) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="考试时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
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
            :prev-text="'上一页'"
            :next-text="'下一页'"
            @size-change="loadExamHistory"
            @current-change="loadExamHistory"
          >
            <template #total>
              共 {{ examHistoryTotal }} 条
            </template>
          </el-pagination>
        </div>
      </div>
      <template #footer>
        <el-button @click="examHistoryVisible = false">关闭</el-button>
      </template>
    </el-dialog>

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
        <el-button type="primary" :loading="exportingPaper" @click="exportCurrentSet">开始导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection, Timer, Check, DocumentChecked, Document,
  ArrowLeft, ArrowRight, Close, Finished,
  Star, Edit, Delete, Clock, VideoPlay, Download
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
  clearExamState,
  deleteQuestionSet,
  exportQuestionSet,
  getExamHistory,
  startExamWithConfig,
  getQuestionSetQuestions,
  checkExamModeSwitch,
  getQuestionDetail,
  evaluateEssayAnswer,
  addMistake,
  batchAddMistakes,
  getMistakes,
  removeMistake,
  getKnowledgePoints,
  getKnowledgePointCandidates,
  batchUpsertKnowledgePoints,
  updateKnowledgePoint
} from '@/api/exam'
import { analyticsApi } from '@/api/analytics'

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
const questionStatusMap = reactive({})
const essayEvaluationMap = reactive({})
const addedMistakesSet = reactive(new Set())
const showExplanationSplit = ref(false)
const showAllExplanations = ref(false)

const showReport = ref(false)
const reportCollapsed = ref(false)
const report = reactive({ correctCount: 0, wrongCount: 0, score: 0, totalScore: 0, timeUsed: 0, examId: null })

const reviewDialogVisible = ref(false)
const reviewingQuestion = ref({})
const knowledgePointOptions = ref([])
const knowledgePointCandidates = ref([])
const knowledgePointMetaDialogVisible = ref(false)
const knowledgePointMetaSaving = ref(false)
const selectedKnowledgePointMetaId = ref(null)
const knowledgePointMetaForm = reactive({
  id: null,
  name: '',
  code: '',
  parent_id: null,
  description: '',
  sort_order: 0,
  status: 1
})

const examHistoryVisible = ref(false)
const examHistory = ref([])
const exportDialogVisible = ref(false)
const exportingPaper = ref(false)
const exportForm = reactive({
  format: 'pdf',
  include_answers: true,
  include_analysis: true
})
const examHistoryTotal = ref(0)
const examHistoryPage = ref(1)
const examHistoryPageSize = ref(10)

const customDuration = ref(0)
const randomOrder = ref(false)
const restoringState = ref(false)
const practiceStartAt = ref(Date.now())
const antiCheatLeaveCount = ref(0)
const antiCheatMaxLeaves = 3
let autosaveTimer = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const questionIndexMap = computed(() => {
  const indexMap = Object.create(null)
  for (let i = 0; i < questions.value.length; i += 1) {
    const id = questions.value[i]?.id
    if (id === undefined || id === null) continue
    indexMap[id] = i
    indexMap[String(id)] = i
  }
  return indexMap
})
const editableKnowledgePointOptions = computed(() => {
  const selectedIds = Array.isArray(reviewingQuestion.value.knowledge_point_ids)
    ? reviewingQuestion.value.knowledge_point_ids
    : []
  return knowledgePointOptions.value.filter(item => selectedIds.includes(item.id))
})
const parentKnowledgePointOptions = computed(() => {
  return knowledgePointOptions.value.filter(item => item.id !== selectedKnowledgePointMetaId.value)
})

// 缓存相关变量
const questionCache = reactive({})
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟缓存过期时间
const questionDetailCache = reactive({})
const questionDetailPending = new Map()
let detailPrefetchTimer = null

// 辅助函数：统一处理 API 响应结构
function handleResponse(response, defaultValue = null) {
  if (!response) return defaultValue
  if (response.data?.data !== undefined) return response.data.data
  if (response.data !== undefined) return response.data
  return response || defaultValue
}

function clearReactiveObject(target) {
  Object.keys(target).forEach(key => delete target[key])
}

function resetAnswerState() {
  clearReactiveObject(userAnswers)
  clearReactiveObject(feedbackMap)
  clearReactiveObject(correctMap)
  clearReactiveObject(questionStatusMap)
  clearReactiveObject(essayEvaluationMap)
}

function resetPracticeViewState(resetAllExplanations = false) {
  showExplanationSplit.value = false
  showReport.value = false
  currentIndex.value = 0
  examStarted.value = false
  if (resetAllExplanations) {
    showAllExplanations.value = false
  }
}

function extractQuestionList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.questions)) return data.questions
  if (Array.isArray(data?.data?.questions)) return data.data.questions
  return []
}

function filterValidQuestions(questionList) {
  return questionList.filter(question => {
    try {
      validateQuestionData(question)
      return true
    } catch (error) {
      console.warn('题目数据验证失败:', error.message)
      return false
    }
  })
}

function getLoadQuestionErrorMessage(error) {
  const message = error?.message || ''
  if (message.includes('超时')) return '网络连接超时，请检查网络后重试'
  if (message.includes('404')) return '题集不存在或已被删除'
  if (message.includes('401')) return '登录已过期，请重新登录'
  return '加载题目失败，请稍后重试'
}

async function clearPersistedExamState() {
  if (!selectedSetId.value) return
  try {
    await clearExamState(selectedSetId.value)
  } catch (error) {
    try {
      await saveExamState({
        question_set_id: selectedSetId.value,
        answers: {},
        time_used: 0,
        time_left: 0,
        current_question_index: 0
      })
    } catch {
      console.log('清除考试状态失败，继续流程')
    }
  }
}

// 增强的数据验证函数
function validateQuestionData(question) {
  if (!question || typeof question !== 'object') {
    throw new Error('题目数据格式错误')
  }
  
  const requiredFields = ['id', 'stem', 'type']
  const missingFields = requiredFields.filter(field => !question[field])
  
  if (missingFields.length > 0) {
    throw new Error(`题目数据缺少必要字段: ${missingFields.join(', ')}`)
  }
  
  // 验证题型
  const validTypes = ['single', 'multi', 'judge', 'fill', 'essay']
  if (!validTypes.includes(question.type)) {
    throw new Error(`无效的题型: ${question.type}`)
  }
  
  // 验证选项格式
  if (['single', 'multi'].includes(question.type)) {
    if (!question.options || (typeof question.options === 'object' && Object.keys(question.options).length === 0)) {
      throw new Error('选择题必须包含选项')
    }
  }
  
  return true
}

// 网络请求超时和重试机制
async function apiRequestWithRetry(apiCall, maxRetries = 3, timeout = 10000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), timeout)
      })
      
      const response = await Promise.race([apiCall(), timeoutPromise])
      return response
    } catch (error) {
      console.warn(`API请求失败 (尝试 ${attempt}/${maxRetries}):`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}

// 缓存管理函数
function getCachedQuestions(questionSetId) {
  const cache = questionCache[questionSetId]
  if (!cache) return null
  
  const now = Date.now()
  if (now - cache.timestamp > CACHE_EXPIRY) {
    // 缓存过期，删除
    delete questionCache[questionSetId]
    return null
  }
  
  return cache.data
}

function setCachedQuestions(questionSetId, data) {
  questionCache[questionSetId] = {
    data: JSON.parse(JSON.stringify(data)), // 深拷贝
    timestamp: Date.now()
  }
}

// 清除缓存函数（备用）
// function clearCache() {
//   Object.keys(questionCache).forEach(key => {
//     delete questionCache[key]
//   })
//   lastLoadTime.value = 0
// }

// 防抖函数（备用）
// function debounce(func, wait) {
//   let timeout
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout)
//       func(...args)
//     }
//     clearTimeout(timeout)
//     timeout = setTimeout(later, wait)
//   }
// }

const formattedAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q) return ''
  const { answer, type } = q
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
})

function isAnsweredValue(answer) {
  if (answer === undefined || answer === null) return false
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'string') return answer.trim() !== ''
  return true
}

function getUserAnswer(questionId) {
  return userAnswers[questionId] ?? userAnswers[String(questionId)] ?? userAnswers[Number(questionId)]
}

const answeredCount = computed(() => Object.values(userAnswers).filter(answer => isAnsweredValue(answer)).length)

const statusSummary = computed(() => {
  const summary = { answered: 0, correct: 0, wrong: 0, unanswered: 0 }
  for (const q of questions.value) {
    const status = questionStatusMap[q.id]
    if (status === 'correct') {
      summary.answered += 1
      summary.correct += 1
    } else if (status === 'wrong') {
      summary.answered += 1
      summary.wrong += 1
    } else if (status === 'unanswered') {
      summary.unanswered += 1
    } else if (isAnsweredValue(userAnswers[q.id])) {
      summary.answered += 1
    } else {
      summary.unanswered += 1
    }
  }
  return summary
})

const currentQuestionStatusLabel = computed(() => {
  const qid = currentQuestion.value?.id
  const status = qid ? questionStatusMap[qid] : null
  if (status === 'correct') return '正确'
  if (status === 'wrong') return '错误'
  if (status === 'unanswered') return '未作答'
  return isAnsweredValue(qid ? userAnswers[qid] : undefined) ? '已作答待检查' : '未作答'
})

const currentQuestionStatusTagType = computed(() => {
  const qid = currentQuestion.value?.id
  const status = qid ? questionStatusMap[qid] : null
  if (status === 'correct') return 'success'
  if (status === 'wrong') return 'danger'
  if (status === 'unanswered') return 'info'
  return isAnsweredValue(qid ? userAnswers[qid] : undefined) ? 'warning' : 'info'
})

const questionFrameClass = computed(() => {
  const qid = currentQuestion.value?.id
  const status = qid ? questionStatusMap[qid] : null
  return {
    'is-correct': status === 'correct',
    'is-wrong': status === 'wrong',
    'is-unanswered': status === 'unanswered'
  }
})

const currentEssayEvaluation = computed(() => {
  const qid = currentQuestion.value?.id
  if (!qid) return null
  return essayEvaluationMap[qid] || null
})

function getQuestionStatus(question) {
  if (!question) return 'unanswered'
  const qid = question.id
  const fromMap = questionStatusMap[qid] ?? questionStatusMap[String(qid)]
  if (fromMap) return fromMap
  const answer = getUserAnswer(qid)
  if (!isAnsweredValue(answer)) return 'unanswered'
  const correctness = correctMap[qid] ?? correctMap[String(qid)]
  if (correctness === true) return 'correct'
  if (correctness === false) return 'wrong'
  return 'answered'
}

function getQuestionStatusLabel(question) {
  const status = getQuestionStatus(question)
  if (status === 'correct') return '正确'
  if (status === 'wrong') return '错误'
  if (status === 'answered') return '已作答'
  return '未作答'
}

function getQuestionStatusTagType(question) {
  const status = getQuestionStatus(question)
  if (status === 'correct') return 'success'
  if (status === 'wrong') return 'danger'
  if (status === 'answered') return 'warning'
  return 'info'
}

function formatUserAnswer(question, answer) {
  if (!isAnsweredValue(answer)) return '未作答'
  if (question?.type === 'judge') {
    return String(answer).toUpperCase() === 'TRUE' ? '正确' : String(answer).toUpperCase() === 'FALSE' ? '错误' : String(answer)
  }
  if (Array.isArray(answer)) return answer.join(', ')
  return String(answer)
}

function formatKeywordList(list) {
  if (!Array.isArray(list) || list.length === 0) return '暂无'
  return list.join('、')
}

function formatKnowledgePointNames(points) {
  if (!Array.isArray(points) || points.length === 0) return '暂无知识点'
  return points.map(p => p?.name).filter(Boolean).join('、') || '暂无知识点'
}

function getFormattedAnswer(question) {
  if (!question) return ''
  const { answer, type } = question
  if (type === 'judge') return answer ? '正确' : '错误'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer || '（未设置）'
}

function formatScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return '0'
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function calcAccuracy(correct, total) {
  const c = Number(correct) || 0
  const t = Number(total) || 1
  const rate = Math.round((c / t) * 100)
  return `${rate}%`
}

function formatTime(seconds) {
  const s = Number(seconds) || 0
  if (s < 60) return `${s}秒`
  const min = Math.floor(s / 60)
  const sec = s % 60
  return `${min}分${sec}秒`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

function resolveAnalyticsKnowledge(question, index) {
  const list = Array.isArray(question?.knowledge_points) ? question.knowledge_points : []
  const first = list.find(item => item && (item.name || item.code))
  if (first?.name) return String(first.name)
  if (typeof question?.knowledge === 'string' && question.knowledge.trim()) return question.knowledge.trim()
  return `知识点${index + 1}`
}

function buildQuestionsForAnalytics(correctnessMap = {}) {
  return questions.value.map((question, index) => {
    const qid = String(question.id)
    const answer = userAnswers[qid]
    const hasAnswer = isAnsweredValue(answer)
    return {
      id: question.id,
      knowledge: resolveAnalyticsKnowledge(question, index),
      category: question.type || 'single',
      is_correct: hasAnswer ? Boolean(correctnessMap[qid] ?? correctnessMap[question.id]) : false
    }
  })
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

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') return
  if (mode.value !== 'exam' || !examStarted.value) return
  antiCheatLeaveCount.value += 1
  if (antiCheatLeaveCount.value >= antiCheatMaxLeaves) {
    ElMessage.error('检测到多次离开考试页面，系统已自动交卷')
    submitExam({ skipConfirm: true, reason: 'anti-cheat' })
    return
  }
  ElMessage.warning(`检测到离开考试页面（${antiCheatLeaveCount.value}/${antiCheatMaxLeaves}）`)
}

onMounted(async () => {
  await loadQuestionSets()
  await loadMistakes()
  await loadKnowledgePointOptions()
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
  if (autosaveTimer) clearTimeout(autosaveTimer)
  if (detailPrefetchTimer) clearTimeout(detailPrefetchTimer)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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

async function loadMistakes() {
  try {
    const response = await getMistakes(selectedSetId.value || undefined)
    const data = handleResponse(response, [])
    const mistakeList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
    mistakeList.forEach(m => {
      if (m.question?.id) {
        addedMistakesSet.add(m.question.id)
      }
    })
  } catch (error) {
    console.error('加载错题集失败:', error)
  }
}

async function loadKnowledgePointOptions(keyword = '') {
  try {
    const response = await getKnowledgePoints({ keyword })
    const data = handleResponse(response, [])
    knowledgePointOptions.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载知识点失败:', error)
    knowledgePointOptions.value = []
  }
}

async function refreshKnowledgePointCandidates() {
  try {
    const response = await getKnowledgePointCandidates({
      question_set_id: selectedSetId.value || undefined,
      limit: 20
    })
    const data = handleResponse(response, { candidates: [] })
    knowledgePointCandidates.value = Array.isArray(data?.candidates) ? data.candidates : []
  } catch (error) {
    console.error('加载候选知识点失败:', error)
    knowledgePointCandidates.value = []
  }
}

async function addCandidateKnowledgePoint(name) {
  try {
    const response = await batchUpsertKnowledgePoints({ names: [name] })
    const data = handleResponse(response, { created: [], existing: [] })
    const points = [...(data.created || []), ...(data.existing || [])]
    if (points.length === 0) return
    await loadKnowledgePointOptions()
    const ids = new Set(Array.isArray(reviewingQuestion.value.knowledge_point_ids) ? reviewingQuestion.value.knowledge_point_ids : [])
    points.forEach(p => ids.add(p.id))
    reviewingQuestion.value.knowledge_point_ids = [...ids]
  } catch (error) {
    console.error('添加候选知识点失败:', error)
    ElMessage.error('添加候选知识点失败')
  }
}

function syncKnowledgePointMetaFormById(pointId) {
  const point = knowledgePointOptions.value.find(item => item.id === pointId)
  if (!point) return
  knowledgePointMetaForm.id = point.id
  knowledgePointMetaForm.name = point.name || ''
  knowledgePointMetaForm.code = point.code || ''
  knowledgePointMetaForm.parent_id = point.parent_id ?? null
  knowledgePointMetaForm.description = point.description || ''
  knowledgePointMetaForm.sort_order = Number(point.sort_order ?? 0)
  knowledgePointMetaForm.status = Number(point.status ?? 1)
}

function openKnowledgePointMetaDialog() {
  const selectedIds = Array.isArray(reviewingQuestion.value.knowledge_point_ids)
    ? reviewingQuestion.value.knowledge_point_ids
    : []
  if (selectedIds.length === 0) {
    ElMessage.warning('请先在上方选择至少一个知识点')
    return
  }
  const fallbackId = editableKnowledgePointOptions.value[0]?.id || selectedIds[0]
  if (!fallbackId) {
    ElMessage.warning('未找到可编辑的知识点数据，请先刷新知识点列表')
    return
  }
  selectedKnowledgePointMetaId.value = fallbackId
  syncKnowledgePointMetaFormById(fallbackId)
  knowledgePointMetaDialogVisible.value = true
}

async function saveKnowledgePointMeta() {
  const pointId = selectedKnowledgePointMetaId.value
  if (!pointId) {
    ElMessage.warning('请先选择知识点')
    return
  }
  const payload = {
    name: (knowledgePointMetaForm.name || '').trim(),
    code: (knowledgePointMetaForm.code || '').trim() || null,
    parent_id: knowledgePointMetaForm.parent_id ?? null,
    description: (knowledgePointMetaForm.description || '').trim() || null,
    sort_order: Number(knowledgePointMetaForm.sort_order ?? 0),
    status: Number(knowledgePointMetaForm.status ?? 1)
  }
  if (!payload.name) {
    ElMessage.warning('知识点名称不能为空')
    return
  }

  try {
    knowledgePointMetaSaving.value = true
    const response = await updateKnowledgePoint(pointId, payload)
    const updated = handleResponse(response, null)
    if (!updated || !updated.id) {
      throw new Error('更新响应异常')
    }
    const idx = knowledgePointOptions.value.findIndex(item => item.id === updated.id)
    if (idx !== -1) {
      knowledgePointOptions.value[idx] = { ...knowledgePointOptions.value[idx], ...updated }
    } else {
      knowledgePointOptions.value.push(updated)
    }
    if (Number(updated.status) !== 1) {
      reviewingQuestion.value.knowledge_point_ids = (reviewingQuestion.value.knowledge_point_ids || []).filter(id => id !== updated.id)
    }
    syncKnowledgePointMetaFormById(updated.id)
    await refreshKnowledgePointCandidates()
    ElMessage.success('知识点元信息已更新')
    knowledgePointMetaDialogVisible.value = false
  } catch (error) {
    console.error('更新知识点元信息失败:', error)
    ElMessage.error(error?.response?.data?.detail || '更新知识点元信息失败')
  } finally {
    knowledgePointMetaSaving.value = false
  }
}

function onSelectSet() {
  practiceStartAt.value = Date.now()
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
    knowledge: q.knowledge ?? null,
    knowledge_points: Array.isArray(q.knowledge_points) ? q.knowledge_points : []
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
    
    // 检查缓存
    const cachedData = getCachedQuestions(selectedSetId.value)
    if (cachedData && !randomOrder.value) {
      questions.value = cachedData.map(q => normalizeQuestion(q))
      ElMessage.success(`从缓存加载 ${questions.value.length} 道题目`)
    } else {
      // 使用增强的API请求机制
      const response = await apiRequestWithRetry(
        () => getQuestionSetQuestions(selectedSetId.value, { random: randomOrder.value }),
        3,
        10000
      )
      
      const data = handleResponse(response)
      const questionList = extractQuestionList(data)
      const validQuestionList = filterValidQuestions(questionList)
      questions.value = validQuestionList.map(q => normalizeQuestion(q))
      
      // 缓存数据（非随机排序时）
      if (!randomOrder.value && questions.value.length > 0) {
        setCachedQuestions(selectedSetId.value, questions.value)
      }
      
      ElMessage.success(`成功加载 ${questions.value.length} 道题目`)
    }
    
    resetAnswerState()
    resetPracticeViewState()
    
    // 加载恢复状态和进度
    await Promise.allSettled([
      checkAndRestoreExamState(),
      loadPracticeProgress()
    ])
    
    if (questions.value.length > 0) {
      ensureQuestionDetail(questions.value[0].id)
      scheduleDetailPrefetch(0)
    }
    
  } catch (error) {
    console.error('加载题目失败:', error)
    ElMessage.error(getLoadQuestionErrorMessage(error))
    questions.value = []
  } finally {
    loading.value = false
  }
}

async function checkAndRestoreExamState() {
  if (!selectedSetId.value) return
  
  try {
    // 检查是否有 token
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.warn('未找到 access_token，跳过恢复考试状态检查')
      return
    }
    
    const response = await restoreExamState(selectedSetId.value)
    const stateData = handleResponse(response)
    
    if (stateData?.answers) {
      ElMessageBox.confirm(
        `检测到您有未完成的考试，已答 ${Object.keys(stateData.answers).length} 题。是否恢复考试？`,
        '恢复考试',
        { confirmButtonText: '恢复考试', cancelButtonText: '开始新考试', type: 'info' }
      ).then(() => {
        restoringState.value = true
        Object.assign(userAnswers, stateData.answers)
        setTimeout(() => { restoringState.value = false }, 0)
        currentIndex.value = stateData.current_question_index || 0
        timeLeft.value = stateData.time_left || 0
        examStarted.value = true
        startTimer()
        ElMessage.success('考试已恢复')
      }).catch(async () => {
        await clearPersistedExamState()
        resetAnswerState()
        resetPracticeViewState(true)
        timeLeft.value = 0
        ElMessage.success('已开始新考试')
      })
    }
  } catch (error) {
    // 404 代表没有可恢复状态或后端未启用该接口，按无状态处理
    if (error.response?.status === 404 || error.message?.includes('404')) {
      console.log('恢复考试状态接口可能未实现，跳过检查')
      return
    }
    
    console.error('检查考试状态失败:', error)
    
    // 如果是 422 错误（缺少 Authorization 头），提供更具体的提示
    if (error.response?.status === 422 || error.message?.includes('422')) {
      console.error('Authorization 头可能未正确发送，请检查登录状态')
      // 尝试重新获取 token 或提示用户重新登录
      const token = localStorage.getItem('access_token')
      if (!token) {
        ElMessage.warning('请先登录后再进行操作')
      } else {
        console.warn('token 存在但可能已过期，建议重新登录')
      }
    }
    // 其他错误视为正常情况，没有可恢复的状态
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
      }).catch(() => {})
    }
    
    if (timeLeft.value <= 0) {
      clearInterval(timer.value)
      timer.value = null
      submitExam({ skipConfirm: true, reason: 'timeout' })
    }
  }, 1000)
}

async function loadPracticeProgress() {
  if (!selectedSetId.value) return
  
  try {
    const response = await getPracticeProgress(selectedSetId.value)
    const data = handleResponse(response)
    if (data?.answers) {
      restoringState.value = true
      Object.assign(userAnswers, data.answers)
      setTimeout(() => { restoringState.value = false }, 0)
    }
  } catch (error) {
    console.error('加载练习进度失败:', error)
  }
}

async function deleteSet() {
  if (!selectedSetId.value) return
  
  try {
    await deleteQuestionSet(selectedSetId.value)
    ElMessage.success('题集已删除')
    
    const idx = sets.value.findIndex(s => s.id === selectedSetId.value)
    if (idx >= 0) sets.value.splice(idx, 1)
    selectedSetId.value = null
    questions.value = []
  } catch (error) {
    console.error('删除题集失败:', error)
    ElMessage.error('删除题集失败')
  }
}

function openExportDialog() {
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  exportDialogVisible.value = true
}

async function exportCurrentSet() {
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  try {
    exportingPaper.value = true
    const blob = await exportQuestionSet(selectedSetId.value, {
      format: exportForm.format,
      include_answers: exportForm.include_answers,
      include_analysis: exportForm.include_analysis
    })
    const selectedSet = sets.value.find(item => item.id === selectedSetId.value)
    const baseName = (selectedSet?.name || `question_set_${selectedSetId.value}`).replace(/[\\/:*?"<>|]/g, '_')
    const ext = exportForm.format === 'json' ? 'json' : exportForm.format === 'pdf' ? 'pdf' : 'txt'
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${baseName}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
    exportDialogVisible.value = false
    window.dispatchEvent(new Event('notification-refresh'))
    setTimeout(() => {
      window.dispatchEvent(new Event('notification-refresh'))
    }, 1200)
    ElMessage.success('试卷导出成功')
  } catch (error) {
    console.error('导出试卷失败:', error)
    let errorMsg = error?.message || '导出试卷失败'
    const blobData = error?.response?.data
    if (blobData instanceof Blob) {
      try {
        const text = await blobData.text()
        const parsed = JSON.parse(text)
        if (parsed?.detail) {
          errorMsg = parsed.detail
        } else if (parsed?.message) {
          errorMsg = parsed.message
        }
      } catch (e) {
        errorMsg = error?.message || '导出试卷失败'
      }
    }
    ElMessage.error(errorMsg)
  } finally {
    exportingPaper.value = false
  }
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
    scheduleDetailPrefetch(idx)
  }
}

function scheduleDetailPrefetch(index) {
  if (detailPrefetchTimer) {
    clearTimeout(detailPrefetchTimer)
  }
  detailPrefetchTimer = setTimeout(() => {
    const neighbors = [index + 1, index - 1]
    neighbors.forEach((targetIndex) => {
      if (targetIndex >= 0 && targetIndex < questions.value.length) {
        const targetId = questions.value[targetIndex]?.id
        if (targetId !== undefined && targetId !== null) {
          ensureQuestionDetail(targetId)
        }
      }
    })
  }, 120)
}

async function ensureQuestionDetail(questionId) {
  const idx = questionIndexMap.value[questionId] ?? questionIndexMap.value[String(questionId)]
  if (idx === -1) return
  const q = questions.value[idx]
  const hasKnowledgePoints = Array.isArray(q.knowledge_points) && q.knowledge_points.length > 0
  const needDetail = q.answer == null || !q.explanation || !hasKnowledgePoints || !q.difficulty
  if (!needDetail) return

  const cachedDetail = questionDetailCache[questionId] || questionDetailCache[String(questionId)]
  if (cachedDetail) {
    questions.value[idx] = normalizeQuestion({ ...q, ...cachedDetail })
    return
  }

  const pending = questionDetailPending.get(String(questionId))
  if (pending) {
    await pending
    return
  }

  const pendingTask = (async () => {
    try {
      const response = await getQuestionDetail(questionId)
      const detail = handleResponse(response)
      if (!detail) return
      const merged = normalizeQuestion({ ...q, ...detail })
      questionDetailCache[questionId] = merged
      const latestIndex = questionIndexMap.value[questionId] ?? questionIndexMap.value[String(questionId)]
      if (latestIndex === undefined || latestIndex === null || latestIndex < 0) return
      questions.value[latestIndex] = merged
    } catch (error) {
      console.error('加载题目详情失败:', error)
    } finally {
      questionDetailPending.delete(String(questionId))
    }
  })()
  questionDetailPending.set(String(questionId), pendingTask)

  await pendingTask
}

async function toggleExplanation() {
  if (!showExplanationSplit.value) {
    await ensureQuestionDetail(currentQuestion.value.id)
  }
  showExplanationSplit.value = !showExplanationSplit.value
}

async function checkAnswer() {
  const qid = currentQuestion.value.id
  if (!isAnsweredValue(userAnswers[qid])) {
    questionStatusMap[qid] = 'unanswered'
    feedbackMap[qid] = false
    ElMessage.warning('当前题目尚未作答')
    return
  }
  feedbackMap[qid] = true
  const aiJudged = await computeEssayCorrectnessFor(qid)
  if (!aiJudged) {
    computeCorrectnessFor(qid)
  }

  // 如果回答正确，自动显示解析
  if (correctMap[qid]) {
    ensureQuestionDetail(qid).then(() => {
      if (!showExplanationSplit.value) {
        showExplanationSplit.value = true
      }
    })
  }
}

async function computeEssayCorrectnessFor(qid) {
  const q = questions.value.find(x => String(x.id) === String(qid))
  if (!q || q.type !== 'essay') return false
  const ans = userAnswers[qid]
  if (!isAnsweredValue(ans)) {
    correctMap[qid] = false
    questionStatusMap[qid] = 'unanswered'
    return true
  }
  try {
    const response = await evaluateEssayAnswer(q.id, {
      question_id: q.id,
      user_answer: String(ans).trim()
    })
    const data = handleResponse(response)
    const isCorrect = Boolean(data?.is_correct)
    correctMap[qid] = isCorrect
    questionStatusMap[qid] = isCorrect ? 'correct' : 'wrong'
    essayEvaluationMap[qid] = {
      score: Number(data?.score || 0),
      feedback: data?.feedback || '',
      keywordsMatched: Array.isArray(data?.keywords_matched) ? data.keywords_matched : [],
      keywordsMissing: Array.isArray(data?.keywords_missing) ? data.keywords_missing : []
    }
    return true
  } catch (error) {
    console.error('简答题 AI 批改失败:', error)
    return false
  }
}

async function ensureEssayEvaluationsForAll() {
  const tasks = questions.value.filter(q => {
    if (q.type !== 'essay') return false
    const qid = q.id
    if (essayEvaluationMap[qid]) return false
    const answer = getUserAnswer(qid)
    return isAnsweredValue(answer)
  })
  if (tasks.length === 0) return
  await Promise.all(tasks.map(async (q) => {
    try {
      const response = await evaluateEssayAnswer(q.id, {
        question_id: q.id,
        user_answer: String(getUserAnswer(q.id)).trim()
      })
      const data = handleResponse(response)
      essayEvaluationMap[q.id] = {
        score: Number(data?.score || 0),
        feedback: data?.feedback || '',
        keywordsMatched: Array.isArray(data?.keywords_matched) ? data.keywords_matched : [],
        keywordsMissing: Array.isArray(data?.keywords_missing) ? data.keywords_missing : []
      }
      if (!questionStatusMap[q.id]) {
        questionStatusMap[q.id] = data?.is_correct ? 'correct' : 'wrong'
      }
    } catch (error) {
      console.error('加载简答题 AI 批改详情失败:', error)
    }
  }))
}

function toggleReportCollapse() {
  reportCollapsed.value = !reportCollapsed.value
}

function closeReport() {
  showReport.value = false
  if (mode.value === 'practice') {
    resetAnswerState()
    showExplanationSplit.value = false
    showAllExplanations.value = false
    currentIndex.value = 0
    report.examId = null
  }
}

async function resetPracticeProgressForSet() {
  if (!selectedSetId.value) return
  try {
    await savePracticeProgress({
      question_set_id: selectedSetId.value,
      answers: {},
      reset: true
    })
  } catch (error) {
    console.error('重置练习进度失败:', error)
  }
}

async function finishPractice() {
  const answeredIds = questions.value
    .map(q => String(q.id))
    .filter(qid => isAnsweredValue(userAnswers[qid]))
  
  if (answeredIds.length === 0) {
    ElMessage.warning('请先完成一些题目')
    return
  }

  let correctCount = 0
  let wrongCount = 0
  
  for (const q of questions.value) {
    const qid = String(q.id)
    if (isAnsweredValue(userAnswers[qid])) {
      feedbackMap[qid] = true
      const aiJudged = await computeEssayCorrectnessFor(qid)
      if (!aiJudged) {
        computeCorrectnessFor(qid)
      }
      if (correctMap[qid] === true) {
        questionStatusMap[qid] = 'correct'
        correctCount++
      } else {
        questionStatusMap[qid] = 'wrong'
        wrongCount++
      }
    } else {
      feedbackMap[qid] = false
      correctMap[qid] = false
      questionStatusMap[qid] = 'unanswered'
    }
  }

  try {
    const timeUsed = Math.max(1, Math.floor((Date.now() - practiceStartAt.value) / 1000))
    const durationMinutes = Math.ceil(timeUsed / 60)
    const allAnswers = Object.fromEntries(
      questions.value.map(q => {
        const qid = String(q.id)
        return [qid, isAnsweredValue(userAnswers[qid]) ? userAnswers[qid] : '']
      })
    )
    
    const submitResponse = await submitExamApi({
      question_set_id: selectedSetId.value,
      answers: allAnswers,
      time_used: timeUsed
    })
    const submitData = handleResponse(submitResponse)
    if (submitData?.exam_id) {
      report.examId = submitData.exam_id
      try {
        const reportResponse = await getExamReport(submitData.exam_id)
        const reportData = handleResponse(reportResponse)
        if (reportData?.correctness) {
          clearReactiveObject(correctMap)
          Object.assign(correctMap, reportData.correctness)
          for (const q of questions.value) {
            const qid = String(q.id)
            if (!isAnsweredValue(allAnswers[qid])) {
              questionStatusMap[qid] = 'unanswered'
            } else if (reportData.correctness[qid] === true) {
              questionStatusMap[qid] = 'correct'
            } else {
              questionStatusMap[qid] = 'wrong'
            }
          }
          correctCount = Object.values(reportData.correctness).filter(Boolean).length
          wrongCount = questions.value.length - correctCount
        }
      } catch (error) {
        console.error('获取练习 AI 批改报告失败:', error)
      }
    }
    
    const analyticsQuestions = buildQuestionsForAnalytics(correctMap)
    await analyticsApi.updateAfterExam({
      question_set_id: selectedSetId.value,
      correct_count: correctCount,
      wrong_count: wrongCount,
      time_used: timeUsed,
      duration_minutes: durationMinutes,
      total_questions: questions.value.length,
      questions: analyticsQuestions
    })

    report.correctCount = correctCount
    report.wrongCount = wrongCount
    report.totalScore = Number(submitData?.total_score ?? questions.value.length)
    report.score = Number(submitData?.score ?? correctCount)
    report.timeUsed = timeUsed
    report.examId = submitData?.exam_id || null
    await resetPracticeProgressForSet()
    practiceStartAt.value = Date.now()
    
    showReport.value = true
    reportCollapsed.value = false
    ElMessage.success(`练习完成！得分：${formatScore(report.score)} / ${formatScore(report.totalScore)}`)
  } catch (e) {
    console.error('更新学习统计失败:', e)
    ElMessage.error('保存练习结果失败')
  }
}

function computeCorrectnessFor(qid) {
  const idx = questionIndexMap.value[qid] ?? questionIndexMap.value[String(qid)]
  const q = typeof idx === 'number' ? questions.value[idx] : null
  if (!q) {
    return
  }
  const ans = userAnswers[qid]
  if (!isAnsweredValue(ans)) {
    correctMap[qid] = false
    questionStatusMap[qid] = 'unanswered'
    return
  }
  let ok = false
  if (q.type === 'single') {
    const userAns = String(ans || '').trim().toUpperCase()
    const correctAns = String(q.answer || '').trim().toUpperCase()
    ok = userAns === correctAns
  } else if (q.type === 'multi') {
    // 将答案转为统一格式的数组
    const normalizeAnswer = (answer) => {
      if (Array.isArray(answer)) {
        return [...answer].map(a => String(a).trim().toUpperCase()).sort()
      }
      if (typeof answer === 'string') {
        return answer.split(",").map(a => a.trim().toUpperCase()).sort()
      }
      return []
    }
    const a = normalizeAnswer(ans)
    const b = normalizeAnswer(q.answer)
    ok = JSON.stringify(a) === JSON.stringify(b)
  } else if (q.type === 'fill') {
    // 填空题：支持 | 分隔的多个正确答案
    const normalizeFillAnswer = (answer) => {
      if (!answer) return ''
      return String(answer).trim().toLowerCase()
    }
    const userAnsStr = normalizeFillAnswer(ans)
    const correctAnswers = String(q.answer || '').split('|').map(a => a.trim().toLowerCase())
    // 精确匹配任意一个答案
    ok = correctAnswers.some(correct => correct === userAnsStr)
    // 部分匹配（包含关系）
    if (!ok) {
      ok = correctAnswers.some(correct => correct.includes(userAnsStr) || userAnsStr.includes(correct))
    }
  } else if (q.type === 'judge') {
    ok = String(ans || '').trim().toUpperCase() === String(q.answer || '').trim().toUpperCase()
  } else if (q.type === 'essay') {
    // 简答题：前端只做基础判定，详细评分由后端 AI 完成
    // 如果答案非空，标记为待 AI 评分
    ok = ans && String(ans).trim().length >= 10
  } else {
    ok = String(ans || '').trim().toUpperCase() === String(q.answer || '').trim().toUpperCase()
  }
  correctMap[qid] = ok
  questionStatusMap[qid] = ok ? 'correct' : 'wrong'
}

async function addToMistakes() {
  const q = currentQuestion.value
  if (!q) return

  if (addedMistakesSet.has(q.id)) {
    ElMessage({ message: '该题目已在错题集中', type: 'warning' })
    return
  }

  addedMistakesSet.add(q.id)
  ElMessage({ message: '已加入错题集', type: 'success' })

  try {
    const response = await addMistake({
      question_id: q.id,
      question_set_id: selectedSetId.value,
      user_answer: userAnswers[q.id]
    })
    const data = handleResponse(response)
    if (data?.already_exists) {
      ElMessage({ message: '该题目已在错题集中', type: 'warning' })
    }
  } catch (error) {
    addedMistakesSet.delete(q.id)
    console.error('加入错题集失败:', error)
    ElMessage({ message: '加入错题集失败', type: 'error' })
  }
}

async function removeFromMistakes(questionId) {
  if (!questionId) return

  addedMistakesSet.delete(questionId)
  ElMessage({ message: '已取消加入', type: 'info' })

  try {
    await removeMistake(questionId, selectedSetId.value)
  } catch (error) {
    addedMistakesSet.add(questionId)
    console.error('取消加入错题集失败:', error)
    ElMessage({ message: '取消加入失败', type: 'error' })
  }
}

async function startExam() {
  if (!questions.value.length || !selectedSetId.value) return
  
  try {
    await clearPersistedExamState()
    
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
    
    resetAnswerState()
    resetPracticeViewState()
    antiCheatLeaveCount.value = 0
    examStarted.value = true
    startTimer()
    ElMessage.success('考试开始')
  } catch (error) {
    console.error('开始考试失败:', error)
    ElMessage.error('开始考试失败')
  }
}

async function submitExam(options = {}) {
  const skipConfirm = Boolean(options?.skipConfirm)
  // 添加确认对话框，防止误操作
  if (!skipConfirm && mode.value === 'exam' && examStarted.value) {
    try {
      await ElMessageBox.confirm(
        `确定要交卷吗？\n已答 ${answeredCount.value}/${questions.value.length} 题`,
        '确认交卷',
        {
          confirmButtonText: '确定交卷',
          cancelButtonText: '继续答题',
          type: 'warning'
        }
      )
    } catch {
      return // 用户取消交卷
    }
  }
  
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  
  // 显示提交中状态
    const loadingMessage = ElMessage({
      message: '正在提交考试...',
      type: 'info',
      duration: 0
    })
   
   try {
     const configuredTotal = customDuration.value > 0
       ? customDuration.value
       : (questions.value.length * timePerQuestion.value)
     const timeUsed = Math.max(0, configuredTotal - timeLeft.value)
     
     const allAnswers = Object.fromEntries(
      questions.value.map(q => {
        const qid = String(q.id)
        return [qid, isAnsweredValue(userAnswers[qid]) ? userAnswers[qid] : '']
      })
    )
     
     const response = await apiRequestWithRetry(
       () => submitExamApi({
         question_set_id: selectedSetId.value,
         answers: allAnswers,
         time_used: timeUsed
       }),
       2,
       15000
     )
     
     const data = handleResponse(response)
     const totalQuestions = questions.value.length
     const correctCount = data?.correct_count || 0
     const wrongCount = data?.wrong_count ?? Math.max(totalQuestions - correctCount, 0)
     let correctnessForAnalytics = { ...correctMap }
     if (data) {
       report.correctCount = correctCount
       report.wrongCount = wrongCount
       report.totalScore = Number(data.total_score ?? totalQuestions)
       report.score = Number(data.score ?? correctCount)
       report.timeUsed = data.time_used || timeUsed
       report.examId = data.exam_id
       
       try {
         const durationMinutes = Math.ceil(timeUsed / 60)
         const examData = {
           question_set_id: selectedSetId.value,
           correct_count: correctCount,
           wrong_count: wrongCount,
           time_used: timeUsed,
           duration_minutes: durationMinutes,
          total_questions: totalQuestions,
          questions: buildQuestionsForAnalytics(correctnessForAnalytics)
         }
         await analyticsApi.updateAfterExam(examData)
       } catch (e) {
         console.error('更新学习统计失败:', e)
       }
     } else {
       report.correctCount = 0
       report.wrongCount = 0
       report.totalScore = totalQuestions
       report.score = 0
       report.timeUsed = timeUsed
     }

    if (data?.exam_id) {
      try {
        const reportResponse = await getExamReport(data.exam_id)
        const reportData = handleResponse(reportResponse)
        if (reportData?.correctness) {
          correctnessForAnalytics = { ...reportData.correctness }
          clearReactiveObject(correctMap)
          Object.assign(correctMap, reportData.correctness)
          for (const q of questions.value) {
            const qid = String(q.id)
            if (!isAnsweredValue(allAnswers[qid])) {
              questionStatusMap[qid] = 'unanswered'
            } else if (reportData.correctness[qid] === true) {
              questionStatusMap[qid] = 'correct'
            } else {
              questionStatusMap[qid] = 'wrong'
            }
          }
        }
      } catch (error) {
        console.error('获取考试判题详情失败:', error)
      }
    }
     
    await clearPersistedExamState()
    
    showReport.value = true
    reportCollapsed.value = false
    examStarted.value = false
    antiCheatLeaveCount.value = 0
    loadingMessage.close() // 关闭加载提示
    ElMessage.success('考试提交成功')
  } catch (error) {
    console.error('提交考试失败:', error)
    loadingMessage.close() // 关闭加载提示
    ElMessage.error('提交考试失败')
  }
}

async function viewAllExplanations() {
  if (report.examId) {
    try {
      const response = await getExamReport(report.examId)
      const reportData = handleResponse(response)

      if (reportData) {
        report.score = Number(reportData.score ?? report.score)
        report.totalScore = Number(reportData.total_score ?? report.totalScore)
        if (reportData.answers) {
          clearReactiveObject(userAnswers)
          Object.assign(userAnswers, reportData.answers)
        }
        if (reportData.correctness) {
          clearReactiveObject(correctMap)
          Object.assign(correctMap, reportData.correctness)
        }
        for (const q of questions.value) {
          const qid = String(q.id)
          if (!isAnsweredValue(reportData?.answers?.[qid])) {
            questionStatusMap[qid] = 'unanswered'
          } else if (reportData?.correctness?.[qid] === true) {
            questionStatusMap[qid] = 'correct'
          } else {
            questionStatusMap[qid] = 'wrong'
          }
        }
        if (reportData.questions) questions.value = reportData.questions.map(q => normalizeQuestion(q))
      }
    } catch (error) {
      console.error('加载考试报告失败:', error)
    }
  }

  // 为缺少数据的题目并发获取详情
  const questionsNeedingDetails = questions.value.filter(
    q => q.answer === null || q.explanation === null
  )

  if (questionsNeedingDetails.length > 0) {
    try {
      const detailPromises = questionsNeedingDetails.map(q =>
        getQuestionDetail(q.id)
          .then(detailResponse => ({ q, detailData: handleResponse(detailResponse) }))
          .catch(() => ({ q, detailData: null }))
      )

      const results = await Promise.all(detailPromises)

      const detailMap = new Map()
      results.forEach(({ q, detailData }) => {
        if (detailData) {
          detailMap.set(q.id, normalizeQuestion({ ...q, ...detailData }))
        }
      })

      questions.value = questions.value.map(q => detailMap.get(q.id) || q)
    } catch (error) {
      console.error('批量加载题目详情失败:', error)
    }
  }

  await ensureEssayEvaluationsForAll()

  showAllExplanations.value = true
}

async function addAllWrongToMistakes() {
  const wrongQuestions = questions.value.filter(q => correctMap[q.id] === false && !addedMistakesSet.has(q.id))
  if (wrongQuestions.length === 0) {
    ElMessage({ message: '所有错题已在错题集中', type: 'info' })
    return
  }

  try {
    const mistakesData = wrongQuestions.map(q => ({
      question_id: q.id,
      question_set_id: selectedSetId.value,
      user_answer: userAnswers[q.id]
    }))

    const response = await batchAddMistakes({ questions: mistakesData })
    const data = handleResponse(response)
    if (data) {
      wrongQuestions.forEach(q => addedMistakesSet.add(q.id))
      ElMessage({ message: `已添加 ${data.added_count || wrongQuestions.length} 道错题到错题集`, type: 'success' })
    }
  } catch (error) {
    console.error('批量加入错题集失败:', error)
    ElMessage({ message: '批量加入错题集失败', type: 'error' })
  }
}

async function saveProgress() {
  if (!selectedSetId.value) {
    ElMessage.warning('请先选择题集')
    return
  }
  
  try {
    await savePracticeProgress({
      question_set_id: selectedSetId.value,
      answers: { ...userAnswers }
    })
    
    ElMessage({ message: '进度已保存', type: 'success' })
  } catch (error) {
    console.error('保存进度失败:', error)
    ElMessage.error('保存进度失败')
  }
}

watch(userAnswers, () => {
  if (restoringState.value || !selectedSetId.value) return
  const qid = currentQuestion.value?.id
  if (qid && questionStatusMap[qid] && questionStatusMap[qid] !== 'unanswered') {
    delete questionStatusMap[qid]
  }
  if (mode.value !== 'practice') return
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(async () => {
    try {
      await savePracticeProgress({
        question_set_id: selectedSetId.value,
        answers: { ...userAnswers }
      })
    } catch (error) {
      console.error('自动保存练习进度失败:', error)
    }
  }, 800)
}, { deep: true })

function openReviewDialog() {
  const q = currentQuestion.value
  if (!q) return
  
  reviewingQuestion.value = JSON.parse(JSON.stringify(q))
  reviewingQuestion.value.knowledge_point_ids = Array.isArray(q.knowledge_points)
    ? q.knowledge_points.map(item => item.id).filter(Boolean)
    : []
  refreshKnowledgePointCandidates()
  reviewDialogVisible.value = true
}

async function saveReview() {
  try {
    const qid = reviewingQuestion.value.id
    const enabledKnowledgePointIds = (reviewingQuestion.value.knowledge_point_ids || []).filter(id => {
      const target = knowledgePointOptions.value.find(item => item.id === id)
      return target && Number(target.status ?? 1) === 1
    })
    await updateQuestion(qid, {
      stem: reviewingQuestion.value.stem,
      type: reviewingQuestion.value.type,
      options: reviewingQuestion.value.options,
      answer: reviewingQuestion.value.answer,
      explanation: reviewingQuestion.value.explanation,
      knowledge_point_ids: enabledKnowledgePointIds,
      difficulty: reviewingQuestion.value.difficulty
    })
    
    const idx = questions.value.findIndex(q => q.id === qid)
    if (idx !== -1) {
      const selectedPoints = knowledgePointOptions.value.filter(item =>
        enabledKnowledgePointIds.includes(item.id)
      )
      questions.value[idx] = normalizeQuestion({
        ...reviewingQuestion.value,
        knowledge_point_ids: enabledKnowledgePointIds,
        knowledge_points: selectedPoints
      })
    }
    
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

.status-summary-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-color);
  background: #f8fbff;
}

.summary-item {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
}

.summary-item .label {
  color: #475569;
}

.summary-item.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.summary-item.danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.summary-item.neutral {
  border-color: #e5e7eb;
  background: #ffffff;
  color: #6b7280;
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

.question-frame {
  border: 2px solid transparent;
  border-radius: 14px;
  padding: 10px;
  transition: all 0.25s ease;
  background: #ffffff;
}

.question-frame.is-correct {
  border-color: #67c23a;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.18);
}

.question-frame.is-wrong {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.14);
}

.question-frame.is-unanswered {
  border-color: #dcdfe6;
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

.knowledge-candidates {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.candidate-label {
  color: var(--text-muted);
  font-size: 12px;
}

.candidate-tag {
  cursor: pointer;
}

.knowledge-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
