// src/api/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 🔹 兼容 Vue CLI (process.env) 和 Vite (import.meta.env)
const getEnvVar = (key) => {
    if (import.meta?.env?.[key]) return import.meta.env[key]
    if (process?.env?.[key]) return process.env[key]
    return null
}

// 🔹 创建 axios 实例
const service = axios.create({
    baseURL: getEnvVar('VUE_APP_API_BASE_URL') ||
        getEnvVar('VITE_API_BASE_URL') ||
        'http://localhost:8000/api',
    timeout: parseInt(getEnvVar('VUE_APP_API_TIMEOUT')) || 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
})

// 🔹 请求拦截器
service.interceptors.request.use(
    config => {
        // 添加 token
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 开发环境日志
        if (import.meta?.env?.DEV || process?.env?.NODE_ENV === 'development') {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data
            })
        }

        return config
    },
    error => {
        console.error('Request Error:', error)
        ElMessage.error('请求发送失败')
        return Promise.reject(error)
    }
)

// 🔹 响应拦截器
service.interceptors.response.use(
    response => {
        const res = response.data

        // 🔸 情况1: 后端返回统一格式 { code: 200, data: ..., message: 'success' }
        if (res?.code !== undefined) {
            if (res.code === 200 || res.code === 0) {
                // 成功：只返回 data
                return res.data !== undefined ? res.data : res
            }

            // 业务错误处理
            const errorMsg = res.message || '请求失败'

            // 401: 未登录/令牌过期
            if (res.code === 401) {
                localStorage.removeItem('access_token')
                ElMessage.warning('登录已过期，请重新登录')
                router.replace('/login')
                return Promise.reject(new Error(errorMsg))
            }

            // 403: 无权限
            if (res.code === 403) {
                ElMessage.warning('无权限访问')
                return Promise.reject(new Error(errorMsg))
            }

            // 404: 资源不存在
            if (res.code === 404) {
                return Promise.reject(new Error('资源不存在'))
            }

            // 其他业务错误
            console.error(`🔴 API Error [${res.code}]:`, errorMsg)
            ElMessage.error(errorMsg)
            return Promise.reject(new Error(errorMsg))
        }

        // 🔸 情况2: 后端直接返回数据（无 code 字段）
        // 直接返回响应数据
        return res
    },
    error => {
        // 网络/超时等错误
        let errorMsg = '网络错误'

        if (error.message?.includes('timeout')) {
            errorMsg = '请求超时，请检查网络'
        } else if (error.message?.includes('Network Error')) {
            errorMsg = '网络连接失败'
        } else if (error.response?.status === 404) {
            errorMsg = '接口不存在'
        } else if (error.response?.status === 500) {
            errorMsg = '服务器内部错误'
        }

        console.error('🔴 Response Error:', error)
        ElMessage.error(errorMsg)

        return Promise.reject(error)
    }
)

export default service