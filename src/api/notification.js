import request from './request'

export const getNotifications = (params = {}) => {
  return request({
    url: '/notifications',
    method: 'get',
    params
  })
}

export const getUnreadCount = () => {
  return request({
    url: '/notifications/unread-count',
    method: 'get'
  })
}

export const markNotificationRead = (notificationId) => {
  return request({
    url: `/notifications/${notificationId}/read`,
    method: 'post'
  })
}

export const markAllNotificationsRead = () => {
  return request({
    url: '/notifications/read-all',
    method: 'post'
  })
}

export const deleteNotification = (notificationId) => {
  return request({
    url: `/notifications/${notificationId}`,
    method: 'delete'
  })
}

export const publishNotification = (data) => {
  return request({
    url: '/notifications/publish',
    method: 'post',
    data
  })
}
