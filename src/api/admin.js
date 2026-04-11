import request from './request'
import { publishNotification } from './notification'

export const adminLogin = (data) => {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

export const adminMe = () => {
  return request({
    url: '/admin/me',
    method: 'get'
  })
}

export const getAdminUsers = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export const updateAdminUserRole = (userId, role) => {
  return request({
    url: `/admin/users/${userId}/role`,
    method: 'post',
    data: { role }
  })
}

export const getOpsOverview = () => {
  return request({
    url: '/admin/ops/overview',
    method: 'get'
  })
}

export const pauseGeneration = (target = 'question') => {
  return request({
    url: '/admin/ops/generation/pause',
    method: 'post',
    data: { target }
  })
}

export const resumeGeneration = (target = 'question') => {
  return request({
    url: '/admin/ops/generation/resume',
    method: 'post',
    data: { target }
  })
}

export const retryGenerationTask = (taskId) => {
  return request({
    url: `/admin/ops/tasks/${taskId}/retry`,
    method: 'post'
  })
}

export const getQualityOverview = (params) => {
  return request({
    url: '/admin/quality/overview',
    method: 'get',
    params
  })
}

export const getQualitySamples = (params) => {
  return request({
    url: '/admin/quality/samples',
    method: 'get',
    params
  })
}

export const updateQualityPolicy = (data) => {
  return request({
    url: '/admin/quality/policy',
    method: 'post',
    data
  })
}

export const createNotificationCampaign = (data) => {
  return request({
    url: '/admin/notifications/campaigns',
    method: 'post',
    data
  })
}

export const getNotificationCampaigns = () => {
  return request({
    url: '/admin/notifications/campaigns',
    method: 'get'
  })
}

export const getAdminAIConfig = () => {
  return request({
    url: '/admin/ai/config',
    method: 'get'
  })
}

export const updateAdminAIConfig = (data) => {
  return request({
    url: '/admin/ai/config',
    method: 'post',
    data
  })
}

export const getPerformanceSummary = () => {
  return request({
    url: '/system/performance/summary',
    method: 'get'
  })
}

export const getAdminLogStats = () => {
  return request({
    url: '/admin/logs/stats',
    method: 'get'
  })
}

export const getAdminAILogsStats = () => {
  return request({
    url: '/admin/logs/ai-stats',
    method: 'get'
  })
}

export const getAdminUsersAILogs = () => {
  return request({
    url: '/admin/logs/users-stats',
    method: 'get'
  })
}

export const getAdminLogHistory = (params) => {
  return request({
    url: '/admin/logs/history',
    method: 'get',
    params
  })
}

export const exportAdminLogs = (params) => {
  return request({
    url: '/admin/logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export const resetPerformanceSummary = () => {
  return request({
    url: '/system/performance/reset',
    method: 'post'
  })
}

export const evaluateQuality = (data) => {
  return request({
    url: '/exam/quality/evaluate',
    method: 'post',
    data
  })
}

export const publishSystemNotification = (data) => publishNotification(data)
