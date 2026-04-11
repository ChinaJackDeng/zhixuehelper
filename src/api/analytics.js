import service from '@/utils/request'

export const analyticsApi = {
  getStats() {
    return service.get('/analytics/stats')
  },

  getDailyRecords(days = 30) {
    return service.get(`/analytics/daily-records?days=${days}`)
  },

  getTrendData(period = 'week') {
    return service.get(`/analytics/trend?period=${period}`)
  },

  getKnowledgeMastery() {
    return service.get('/analytics/knowledge-mastery')
  },

  getMistakeDistribution() {
    return service.get('/analytics/mistake-distribution')
  },

  updateAfterExam(examData) {
    return service.post('/analytics/update', examData)
  },

  getReports(reportType = null, limit = 10) {
    const params = new URLSearchParams({ limit })
    if (reportType) params.append('report_type', reportType)
    return service.get(`/analytics/reports?${params.toString()}`)
  },

  generateReport(reportType = 'weekly') {
    return service.post(`/analytics/reports/generate?report_type=${reportType}`)
  },

  getReportDetail(reportId) {
    return service.get(`/analytics/reports/${reportId}`)
  },

  getSuggestions() {
    return service.get('/analytics/suggestions')
  },

  getSettings() {
    return service.get('/analytics/settings')
  },

  updateSettings(settings) {
    return service.put('/analytics/settings', settings)
  },

  exportData(format = 'csv', period = 'week') {
    return service.get(`/analytics/export?format=${format}&period=${period}`, {
      responseType: 'blob'
    })
  }
}
