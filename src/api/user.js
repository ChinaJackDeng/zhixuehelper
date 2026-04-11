// src/api/user.js
import service from '@/utils/request'

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱（如果需要）
 * @param {string} data.code - 验证码（如果需要）
 * @returns {Promise}
 */
export function userRegister(data) {
  return service({
    url: '/user/register',
    method: 'post',
    data: data
  })
}

/**
 * 用户登录
 * @param {Object} data - 登录信息
 * @param {string} data.identifier - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise}
 */
export function userLogin(data) {
  return service({
    url: '/user/login',
    method: 'post',
    data: data
  })
}

/**
 * 用户登出
 * @returns {Promise}
 */
export function userLogout() {
  return service({
    url: '/user/logout',
    method: 'post'
  })
}

/**
 * 获取当前用户信息（需要token）
 * @returns {Promise}
 */
export function getUserInfo() {
  return service({
    url: '/user/info',
    method: 'get'
  })
}

/**
 * 更新用户信息（需要token）
 * @param {Object} data - 更新的用户信息
 * @param {string} [data.nickname] - 昵称
 * @param {string} [data.email] - 邮箱
 * @param {string} [data.avatar] - 头像
 * @returns {Promise}
 */
export function updateUserInfo(data) {
  return service({
    url: '/user/update',
    method: 'put',
    data: data
  })
}

export function updateUserEmail(data) {
  return service({
    url: '/user/update_email',
    method: 'post',
    data
  })
}

/**
 * 修改密码（需要token）
 * @param {Object} data - 密码信息
 * @param {string} data.old_password - 旧密码
 * @param {string} data.new_password - 新密码
 * @returns {Promise}
 */
export function changePassword(data) {
  return service({
    url: '/user/password',
    method: 'put',
    data: data
  })
}

/**
 * 发送验证码
 * @param {Object} data - 邮箱信息
 * @param {string} data.email - 接收验证码的邮箱
 * @param {string} [data.purpose=注册] - 验证码用途（注册/找回密码等）
 * @returns {Promise}
 */
export function sendVerificationCode(data) {
  return service({
    url: '/user/send_code',
    method: 'post',
    data: data
  })
}

/**
 * 验证验证码
 * @param {Object} data - 验证码信息
 * @param {string} data.email - 邮箱地址
 * @param {string} data.code - 邮箱验证码
 * @returns {Promise}
 */
export function verifyCode(data) {
  return service({
    url: '/user/verify_code',
    method: 'post',
    data: data
  })
}

/**
 * 找回密码
 * @param {Object} data - 重置密码信息
 * @param {string} data.email - 邮箱地址
 * @param {string} data.code - 邮箱验证码
 * @param {string} data.new_password - 新密码
 * @returns {Promise}
 */
export function forgotPassword(data) {
  return service({
    url: '/user/forgot_password',
    method: 'post',
    data: data
  })
}

/**
 * 获取用户统计信息
 * @returns {Promise}
 */
export function getUserStats() {
  return service({
    url: '/user/stats',
    method: 'get'
  })
}

/**
 * 导出用户数据
 * @param {string} format - 导出格式 (csv/json)
 * @returns {Promise}
 */
export function exportUserData(format = 'csv') {
  return service({
    url: `/user/export?format=${format}`,
    method: 'get',
    responseType: 'blob'
  })
}

/**
 * 更新用户偏好设置
 * @param {Object} data - 设置数据
 * @returns {Promise}
 */
export function updateUserSettings(data) {
  return service({
    url: '/user/settings',
    method: 'put',
    data: data
  })
}

export function getUserSettings() {
  return service({
    url: '/user/settings',
    method: 'get'
  })
}
