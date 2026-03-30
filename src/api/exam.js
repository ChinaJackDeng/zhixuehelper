// src/api/exam.js
// 考试功能相关 API 调用

import service from '@/api/request'

/**
 * 生成题目
 * @param {Object} data - 请求数据
 * @param {Array} data.question_types - 题型列表（choice, fill, judge, short_answer）
 * @param {Array} data.document_ids - 文档 ID 列表（必需）
 * @param {Array} data.tags - 标签 ID 列表（可选）
 * @param {string} data.difficulty - 难度（easy, medium, hard），默认 medium
 * @param {number} data.question_count - 题目数量（1-50），默认 10
 * @param {boolean} data.include_answers - 是否包含答案，默认 true
 * @param {boolean} data.include_analysis - 是否包含解析，默认 true
 */
export function generateQuestions(data) {
  return service({
    url: '/exam/questions/generate',
    method: 'post',
    data: {
      question_types: data.question_types,
      document_ids: data.document_ids,
      tags: data.tags || [],
      difficulty: data.difficulty || 'medium',
      question_count: data.question_count || 10,
      include_answers: data.include_answers !== false,
      include_analysis: data.include_analysis !== false
    }
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
 * 获取题目详情
 * @param {number} questionId - 题目 ID
 */
export function getQuestionDetail(questionId) {
  return service({
    url: `/exam/questions/${questionId}`,
    method: 'get'
  })
}

/**
 * 保存题目到题库
 * @param {Array} questions - 题目列表
 * @param {string} saveMode - 保存模式（append, replace），默认 append
 */
export function saveQuestions(questions, saveMode = 'append') {
  return service({
    url: '/exam/questions/save',
    method: 'post',
    data: {
      questions: questions,
      save_mode: saveMode
    }
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
