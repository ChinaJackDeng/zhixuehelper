																																													import axios from 'axios'

// 简单的 axios 实例封装。默认 baseURL 指向 /api，
// 可通过环境变量 VUE_APP_BASE_API 覆盖。
const service = axios.create({
	baseURL: process.env.VUE_APP_BASE_API || 'http://127.0.0.1:8000/api',
	timeout: 10000
})

// 请求拦截：自动附带 access_token（如果存在）
service.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('access_token')
		if (token) {
			config.headers = config.headers || {}
			config.headers['Authorization'] = `Bearer ${token}`
		}
		return config
	},
	(error) => Promise.reject(error)
)

// 响应拦截：直接返回响应体或抛出错误
service.interceptors.response.use(
	(response) => response,
	(error) => {
		// 处理 401 错误（token 过期或无效）
		if (error.response?.status === 401) {
			localStorage.removeItem('access_token')
			// 跳转到登录页面
			if (window.location.pathname !== '/login') {
				window.location.href = '/login'
			}
		}
		return Promise.reject(error)
	}
)

export default service
