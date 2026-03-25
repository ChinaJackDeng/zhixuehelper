import request from './request'

export default {
    // 📈 获取学习统计数据
    getStats: (params = { period: 'week' }) => request.get('/analytics/stats', { params }),

    // 🎯 获取知识点掌握雷达图数据
    getKnowledgeRadar: () => request.get('/analytics/knowledge-radar'),

    // 📊 获取学习趋势数据（折线图）
    getTrendData: (params = {}) => request.get('/analytics/trend', { params }),

    // ❌ 获取错题分布数据（饼图）
    getErrorDistribution: () => request.get('/analytics/error-distribution'),

    // 🤖 生成 AI 学习建议
    generateAdvice: (data) => request.post('/analytics/generate-advice', data),

    // 📄 生成周期性学习报告
    generateReport: (params = { period: 'week' }) => request.post('/analytics/report', params)
}