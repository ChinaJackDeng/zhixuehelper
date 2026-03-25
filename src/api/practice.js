import request from './request'

export default {
    // 📦 获取题目集详情
    getQuestionSet: (setId) => request.get(`/practice/sets/${setId}`),

    // 💾 保存单题答案（练习模式即时保存）
    saveAnswer: (data) => request.post('/practice/answers', data),

    // 📝 批量提交答案（考试交卷）
    submit: (data) => request.post('/practice/submit', data),

    // 📊 获取练习报告
    getReport: (practiceId) => request.get(`/practice/${practiceId}/report`),

    // 📚 获取已完成的练习记录
    getCompletedSets: (params = {}) => request.get('/practice/completed', { params }),

    // ✏️ 更新题目标记/备注
    updateQuestion: (questionId, data) => request.put(`/practice/questions/${questionId}`, data),

    // ➕ 将题目加入错题本
    addToWrongBook: (questionId, data) => request.post(`/practice/wrong/${questionId}`, data),

    // 📋 获取错题本列表
    getWrongBook: (params = {}) => request.get('/practice/wrong', { params })
}