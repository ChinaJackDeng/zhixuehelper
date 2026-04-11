// src/api/exam.js
// 考试功能相关 API 调用

import service from '@/api/request'

/**
 * 生成题目
 * @param {Object} data - 请求数据
 * @param {Array} data.question_types - 题型列表（single, multi, fill, judge, essay）
 * @param {Array} data.document_ids - 文档 ID 列表（必需）
 * @param {Array} data.tags - 标签 ID 列表（可选）
 * @param {string} data.difficulty - 难度（easy, medium, hard, mixed），默认 mixed
 * @param {number} data.question_count - 题目数量（1-100），默认 10
 * @param {boolean} data.include_answers - 是否包含答案，默认 true
 * @param {boolean} data.include_analysis - 是否包含解析，默认 true
 * @param {string} data.question_set_name - 题集名称（可选）
 * @param {Object} data.type_counts - 每种题型的数量（可选），如 {single: 5, multi: 3}
 */
export function generateQuestions(data) {
  console.log('===== apiGenerateQuestions 被调用 =====')
  console.log('传入的 data 参数:', data)
  console.log('data.type_counts:', data.type_counts)
  
  const requestData = {
    question_types: data.question_types,
    document_ids: data.document_ids,
    tags: data.tags || [],
    difficulty: data.difficulty || 'mixed',
    question_count: data.question_count || 10,
    include_answers: data.include_answers !== false,
    include_analysis: data.include_analysis !== false,
    question_set_name: data.question_set_name || '',
    type_counts: data.type_counts || undefined
  }
  
  console.log('实际发送给后端的数据:', requestData)
  console.log('发送的 type_counts:', requestData.type_counts)
  console.log('===================================')
  
  return service({
    url: '/exam/questions/generate',
    method: 'post',
    data: requestData
  })
}

/**
 * 查询题目生成进度
 * @param {string} taskId - 任务 ID
 */
export function getGenerationProgress(taskId) {
  return service({
    url: `/exam/questions/generate/${taskId}`,
    method: 'get'
  })
}

/**
 * 分页获取任务生成的题目列表
 * @param {string} taskId - 任务 ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从 1 开始（默认 1）
 * @param {number} params.page_size - 每页数量，最大 50（默认 10）
 */
export function getTaskQuestions(taskId, params = {}) {
  return service({
    url: `/exam/questions/task/${taskId}`,
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 10
    }
  })
}

/**
 * 预览临时生成的题目（从 Redis 读取）
 * @param {string} taskId - 任务 ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从 1 开始（默认 1）
 * @param {number} params.page_size - 每页数量，最大 50（默认 10）
 * 
 * 说明：
 * - 用于题目生成完成后、保存前的预览阶段
 * - 生成状态为 "ready" 时调用此接口
 * - 返回 Redis 中的临时题目，不包括已保存的数据库题目
 * - 用户确认后调用 confirmSaveQuestions() 保存到数据库
 */
export function getQuestionPreview(taskId, params = {}) {
  return service({
    url: `/exam/questions/preview/${taskId}`,
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 10
    }
  })
}

/**
 * 确认保存题目
 * @param {string} taskId - 任务 ID（路径参数）
 */
export function confirmSaveQuestions(taskId) {
  return service({
    url: `/exam/questions/confirm/${taskId}`,
    method: 'post'
  })
}

/**
 * 取消题目生成任务
 * @param {string} taskId - 任务 ID（路径参数）
 */
export function cancelGeneration(taskId) {
  return service({
    url: `/exam/questions/cancel/${taskId}`,
    method: 'post'
  })
}

// ==================== 练习和考试相关接口 ====================

/**
 * 获取题集列表
 * @returns {Promise} 返回题集列表，每项包含 id, name, question_count, created_at
 */
export function getQuestionSets() {
  return service({
    url: '/exam/question-sets',
    method: 'get'
  })
}

/**
 * 获取题集详情
 * @param {number} questionSetId - 题集 ID
 * @returns {Promise} 返回题集详情及包含的题目
 */
export function getQuestionSetDetail(questionSetId) {
  return service({
    url: `/exam/question-sets/${questionSetId}`,
    method: 'get'
  })
}

export function exportQuestionSet(questionSetId, params = {}) {
  return service({
    url: `/exam/question-sets/${questionSetId}/export`,
    method: 'get',
    responseType: 'blob',
    params: {
      format: params.format || 'txt',
      include_answers: params.include_answers !== false,
      include_analysis: params.include_analysis !== false
    }
  })
}

/**
 * 保存练习进度
 * @param {Object} data - 请求数据
 * @param {number} data.question_set_id - 题集 ID
 * @param {Object} data.answers - 答案对象，key 为题目 ID，value 为答案
 * @returns {Promise} 后端会合并增量答案，不会覆盖整个历史
 */
export function savePracticeProgress(data) {
  return service({
    url: '/exam/practice-progress',
    method: 'post',
    data: data
  })
}

/**
 * 恢复练习进度
 * @param {number} questionSetId - 题集 ID
 * @returns {Promise} 返回 data.answers + data.updated_at，没进度会返回空 answers
 */
export function getPracticeProgress(questionSetId) {
  return service({
    url: `/exam/practice-progress/${questionSetId}`,
    method: 'get'
  })
}

/**
 * 提交考试
 * @param {Object} data - 请求数据
 * @param {number} data.question_set_id - 题集 ID
 * @param {Object} data.answers - 答案对象
 * @param {number} data.time_used - 用时（秒）
 * @returns {Promise} 返回 exam_id, correct_count, wrong_count, score, total_score, time_used
 */
export function submitExam(data) {
  return service({
    url: '/exam/exams',
    method: 'post',
    data: data
  })
}

/**
 * 获取考试报告
 * @param {number} examId - 考试 ID
 * @returns {Promise} 返回 exam_id, question_set_id, correct_count, wrong_count, score, total_score, time_used, answers, correctness, created_at
 */
export function getExamReport(examId) {
  return service({
    url: `/exam/exams/${examId}`,
    method: 'get'
  })
}

// ==================== 题目管理相关接口 ====================

/**
 * 获取题目详情
 * @param {number} questionId - 题目 ID
 */
export function getQuestionDetail(questionId) {
  return service({
    url: `/exam/questions/${questionId}`,
    method: 'get'
  })
}

export function evaluateEssayAnswer(questionId, data) {
  return service({
    url: `/exam/questions/${questionId}/evaluate-essay`,
    method: 'post',
    data
  })
}

/**
 * 保存题目到题库
 * @param {Object} data - 请求数据
 * @param {Array} data.questions - 题目列表
 * @param {string} data.save_mode - 保存模式：append（追加）或 replace（替换）
 * @param {string} data.question_set_name - 题目集名称（可选）
 * @param {Array} data.document_ids - 关联文档 ID 列表（可选）
 */
export function saveQuestions(data, legacySaveMode) {
  const payload = Array.isArray(data)
    ? {
        questions: data,
        save_mode: legacySaveMode || 'append'
      }
    : {
        questions: data?.questions || [],
        save_mode: data?.save_mode || 'append',
        question_set_name: data?.question_set_name,
        document_ids: data?.document_ids
      }

  return service({
    url: '/exam/questions/save',
    method: 'post',
    data: payload
  })
}

/**
 * 获取题库统计信息
 * @param {Object} params - 查询参数
 * @param {Array} params.tags - 标签 ID 列表（可选）
 * @param {Array} params.document_ids - 文档 ID 列表（可选）
 */
export function getQuestionStatistics(params = {}) {
  return service({
    url: '/exam/questions/statistics',
    method: 'get',
    params: {
      tags: params.tags ? params.tags.join(',') : undefined,
      document_ids: params.document_ids ? params.document_ids.join(',') : undefined
    }
  })
}

/**
 * 生成试卷（开发中）
 * @param {Object} data - 请求数据
 */
export function generatePaper(data) {
  return service({
    url: '/exam/papers/generate',
    method: 'post',
    data: {
      title: data.title,
      description: data.description,
      tags: data.tags,
      question_distribution: data.question_distribution,
      total_score: data.total_score,
      duration_minutes: data.duration_minutes,
      document_ids: data.document_ids
    }
  })
}

// ==================== 新增功能接口 ====================

/**
 * 编辑题目
 * @param {number} questionId - 题目 ID
 * @param {Object} data - 请求数据
 * @param {string} data.stem - 题目描述
 * @param {string} data.type - 题型（single|multi|judge|fill|essay）
 * @param {Object} data.options - 选项对象 { A: "选项A", B: "选项B", ... }
 * @param {string} data.answer - 正确答案
 * @param {string} data.explanation - 题目解析
 * @param {string} data.knowledge - 知识点
 * @param {string} data.difficulty - 难度（easy|medium|hard）
 */
export function updateQuestion(questionId, data) {
  return service({
    url: `/exam/questions/${questionId}`,
    method: 'put',
    data: data
  })
}

export function getKnowledgePoints(params = {}) {
  return service({
    url: '/exam/knowledge-points',
    method: 'get',
    params: {
      keyword: params.keyword || undefined
    }
  })
}

export function getKnowledgePointTree() {
  return service({
    url: '/exam/knowledge-points/tree',
    method: 'get'
  })
}

export function batchUpsertKnowledgePoints(data) {
  return service({
    url: '/exam/knowledge-points/batch-upsert',
    method: 'post',
    data
  })
}

export function updateKnowledgePoint(knowledgePointId, data = {}) {
  return service({
    url: `/exam/knowledge-points/${knowledgePointId}`,
    method: 'patch',
    data
  })
}

export function getKnowledgePointCandidates(data = {}) {
  return service({
    url: '/exam/knowledge-points/candidates',
    method: 'post',
    data: {
      question_set_id: data.question_set_id || undefined,
      limit: data.limit || 30
    }
  })
}

export function bindQuestionKnowledgePoints(questionId, knowledgePointIds = []) {
  return service({
    url: `/exam/questions/${questionId}/knowledge-points`,
    method: 'post',
    data: {
      knowledge_point_ids: knowledgePointIds
    }
  })
}

export function getQuestionsByKnowledgePoint(knowledgePointId, params = {}) {
  return service({
    url: `/exam/questions/by-knowledge-point/${knowledgePointId}`,
    method: 'get',
    params: {
      limit: params.limit || 100
    }
  })
}

/**
 * 保存考试状态
 * @param {Object} data - 请求数据
 * @param {number} data.question_set_id - 题集 ID
 * @param {Object} data.answers - 答案对象
 * @param {number} data.time_used - 已用时（秒）
 * @param {number} data.time_left - 剩余时间（秒）
 * @param {number} data.current_question_index - 当前题目索引
 */
export function saveExamState(data) {
  return service({
    url: '/exam/exams/save-state',
    method: 'post',
    data: data
  })
}

/**
 * 恢复考试状态
 * @param {number} questionSetId - 题集 ID
 */
export function restoreExamState(questionSetId) {
  return service({
    url: `/exam/exams/restore-state/${questionSetId}`,
    method: 'get',
    silentError: true
  })
}

/**
 * 删除题集
 * @param {number} questionSetId - 题集 ID
 */
export function deleteQuestionSet(questionSetId) {
  return service({
    url: `/exam/question-sets/${questionSetId}`,
    method: 'delete'
  })
}

/**
 * 清除考试状态
 * @param {number} questionSetId - 题集 ID
 */
export function clearExamState(questionSetId) {
  return service({
    url: `/exam/exams/clear-state/${questionSetId}`,
    method: 'delete',
    silentError: true
  })
}

/**
 * 获取成绩历史
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.page_size - 每页数量（默认10）
 * @param {number} params.question_set_id - 题集ID（可选）
 */
export function getExamHistory(params = {}) {
  return service({
    url: '/exam/exams/history',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 10,
      question_set_id: params.question_set_id || undefined
    }
  })
}

/**
 * 开始考试（支持自定义时间和随机排序）
 * @param {Object} data - 请求数据
 * @param {number} data.question_set_id - 题集 ID
 * @param {number} data.custom_duration - 自定义考试时间（秒），可选
 * @param {boolean} data.random_order - 是否随机排序题目，可选
 */
export function startExamWithConfig(data) {
  return service({
    url: '/exam/exams/start',
    method: 'post',
    data: data
  })
}

/**
 * 获取题集题目（支持随机排序）
 * @param {number} questionSetId - 题集 ID
 * @param {Object} params - 查询参数
 * @param {boolean} params.random - 是否随机排序
 */
export function getQuestionSetQuestions(questionSetId, params = {}) {
  return service({
    url: `/exam/question-sets/${questionSetId}/questions`,
    method: 'get',
    params: {
      random: params.random || false
    }
  })
}

/**
 * 检查考试模式切换
 * @param {Object} data - 请求数据
 * @param {number} data.question_set_id - 题集 ID
 * @param {string} data.current_mode - 当前模式（practice|exam）
 * @param {string} data.target_mode - 目标模式（practice|exam）
 */
export function checkExamModeSwitch(data) {
  return service({
    url: '/exam/exams/check-switch',
    method: 'post',
    data: data
  })
}

// ==================== 错题集接口 ====================

/**
 * 添加错题
 * @param {Object} data - 请求数据
 * @param {number} data.question_id - 题目 ID
 * @param {number} data.question_set_id - 来源题集 ID
 * @param {Object} data.user_answer - 用户的错误答案
 */
export function addMistake(data) {
  return service({
    url: '/exam/mistakes',
    method: 'post',
    data: data
  })
}

/**
 * 批量添加错题
 * @param {Object} data - 请求数据
 * @param {Array} data.questions - 错题列表 [{question_id, question_set_id, user_answer}, ...]
 */
export function batchAddMistakes(data) {
  return service({
    url: '/exam/mistakes/batch',
    method: 'post',
    data: data
  })
}

/**
 * 获取用户的错题列表
 * @param {number} questionSetId - 题集 ID（可选）
 * @returns {Promise} 包含错题列表的响应
 */
export function getMistakes(questionSetId) {
  return service({
    url: '/exam/mistakes',
    method: 'get',
    params: questionSetId ? { question_set_id: questionSetId } : undefined
  })
}

/**
 * 从错题集移除题目
 * @param {number} questionId - 题目 ID
 * @param {number} questionSetId - 题集 ID（可选）
 */
export function removeMistake(questionId, questionSetId) {
  return service({
    url: `/exam/mistakes/${questionId}`,
    method: 'delete',
    params: questionSetId ? { question_set_id: questionSetId } : undefined
  })
}

/**
 * 获取错题详情
 * @param {number} mistakeId - 错题 ID
 * @returns {Promise} 包含错题详情的响应
 */
export function getMistakeDetail(mistakeId) {
  return service({
    url: `/exam/mistakes/${mistakeId}`,
    method: 'get'
  })
}

/**
 * 重新生成错题 AI 解析
 * @param {number} mistakeId - 错题 ID
 * @returns {Promise} 包含 AI 解析结果的响应
 */
export function regenerateMistakeAnalysis(mistakeId) {
  return service({
    url: `/exam/mistakes/${mistakeId}/regenerate-analysis`,
    method: 'post'
  })
}

export function markMistakeMastered(mistakeId) {
  return service({
    url: `/exam/mistakes/${mistakeId}/mastered`,
    method: 'post'
  })
}

export function getRelatedDocuments(params = {}) {
  return service({
    url: '/exam/documents/related',
    method: 'get',
    params: params
  })
}

export function getRelatedQuestions(params = {}) {
  return service({
    url: '/exam/questions/related',
    method: 'get',
    params: params
  })
}

export function startReinforcement(data) {
  return service({
    url: '/exam/reinforcement',
    method: 'post',
    data: data,
    timeout: 120000
  })
}

export function selectReinforcementQuestion(reinforcementQuestionId, selected = true) {
  return service({
    url: `/exam/reinforcement/questions/${reinforcementQuestionId}/select`,
    method: 'post',
    data: { selected }
  })
}

export function getReinforcementSessionQuestions(sessionId, params = {}) {
  return service({
    url: `/exam/reinforcement/sessions/${sessionId}/questions`,
    method: 'get',
    params
  })
}
export function getLatestReinforcementSession(mistakeId) {
  return service({
    url: `/exam/reinforcement/mistakes/${mistakeId}/latest-session`,
    method: 'get'
  })
}
 export function addReinforcementQuestion(mistakeId, data) {
  return service({
    url: `/exam/reinforcement/mistakes/${mistakeId}/questions`,
    method: 'post',
    data
  })
}

export function createReinforcementAttempt(data) {
  return service({
    url: '/exam/reinforcement/attempts',
    method: 'post',
    data
  })
}

export function deleteReinforcementQuestion(reinforcementQuestionId) {
  return service({
    url: `/exam/reinforcement/questions/${reinforcementQuestionId}`,
    method: 'delete'
  })
}
