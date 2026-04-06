/**
 * 考试功能相关 API 调用
 * 此文件已废弃，所有接口已迁移到 exam.js
 * 请使用 import { xxx } from '@/api/exam'
 */

import * as examApi from './exam'

export default {
  // 题集相关 - 重新映射到正确路径
  getQuestionSet: examApi.getQuestionSetDetail,
  getQuestionSets: examApi.getQuestionSets,
  getQuestionSetDetail: examApi.getQuestionSetDetail,
  getQuestionSetQuestions: examApi.getQuestionSetQuestions,

  // 练习进度 - 重新映射到正确路径
  saveAnswer: examApi.savePracticeProgress,
  savePracticeProgress: examApi.savePracticeProgress,
  getPracticeProgress: examApi.getPracticeProgress,

  // 考试相关 - 重新映射到正确路径
  submit: examApi.submitExam,
  submitExam: examApi.submitExam,
  getExamReport: examApi.getExamReport,
  getReport: examApi.getExamReport,
  getExamHistory: examApi.getExamHistory,

  // 考试状态
  saveExamState: examApi.saveExamState,
  restoreExamState: examApi.restoreExamState,
  clearExamState: examApi.clearExamState,
  startExam: examApi.startExamWithConfig,
  checkExamModeSwitch: examApi.checkExamModeSwitch,

  // 题目管理
  getQuestionDetail: examApi.getQuestionDetail,
  updateQuestion: examApi.updateQuestion,

  // 题目生成
  generateQuestions: examApi.generateQuestions,
  getGenerationProgress: examApi.getGenerationProgress,
  getTaskQuestions: examApi.getTaskQuestions,
  getQuestionPreview: examApi.getQuestionPreview,
  confirmSaveQuestions: examApi.confirmSaveQuestions,
  cancelGeneration: examApi.cancelGeneration,
  saveQuestions: examApi.saveQuestions,

  // 错题相关 - 需要后端添加对应接口
  /* eslint-disable-next-line no-unused-vars */
  addToWrongBook: (...args) => {
    console.warn('addToWrongBook 需要后端实现 /api/exam/mistakes 接口')
    return { data: { code: 501, message: '接口开发中' } }
  },
  getWrongBook: () => {
    console.warn('getWrongBook 需要后端实现 /api/exam/mistakes 接口')
    return { data: { code: 501, message: '接口开发中' } }
  },
  /* eslint-disable-next-line no-unused-vars */
  batchAddMistakes: (...args) => {
    console.warn('batchAddMistakes 需要后端实现 /api/exam/mistakes/batch 接口')
    return { data: { code: 501, message: '接口开发中' } }
  },

  // 题库统计
  getQuestionStatistics: examApi.getQuestionStatistics,

  // 试卷生成
  generatePaper: examApi.generatePaper
}
