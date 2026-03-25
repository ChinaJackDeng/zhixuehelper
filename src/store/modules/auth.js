// src/store/modules/auth.js
import { userLogin, userLogout, getUserInfo } from '@/api/user'

// 安全的 JSON 解析函数
const safeParse = (str, defaultValue = null) => {
	if (!str || str === 'undefined' || str === 'null') {
		console.log('安全解析: 空值或无效值，返回默认值')
		return defaultValue
	}
	try {
		return JSON.parse(str)
	} catch (error) {
		console.error('JSON 解析错误:', error, '字符串:', str)
		// 如果解析失败，清除无效数据
		localStorage.removeItem('userInfo')
		return defaultValue
	}
}

const state = {
	token: localStorage.getItem('access_token') || '',
	userInfo: safeParse(localStorage.getItem('userInfo'))
}

const getters = {
	isLoggedIn: state => !!state.token,
	token: state => state.token,
	userInfo: state => state.userInfo
}

const mutations = {
	SET_TOKEN(state, token) {
		state.token = token
		try {
			if (token) {
				localStorage.setItem('access_token', token)
			} else {
				localStorage.removeItem('access_token')
			}
		} catch (error) {
			console.error('保存 token 到 localStorage 失败:', error)
		}
	},

	SET_USER_INFO(state, userInfo) {
		state.userInfo = userInfo
		try {
			if (userInfo) {
				localStorage.setItem('userInfo', JSON.stringify(userInfo))
			} else {
				localStorage.removeItem('userInfo')
			}
		} catch (error) {
			console.error('保存 userInfo 到 localStorage 失败:', error)
		}
	},

	CLEAR_AUTH(state) {
		state.token = ''
		state.userInfo = null
		try {
			localStorage.removeItem('access_token')
			localStorage.removeItem('userInfo')
		} catch (error) {
			console.error('清除 localStorage 失败:', error)
		}
	}
}

const actions = {
	// 登录
	async login({ commit }, loginData) {
		try {
			console.log('调用登录接口，数据:', loginData)

			const response = await userLogin(loginData)

			if (response.data && response.data.data) {
				const { token, userInfo } = response.data.data

				commit('SET_TOKEN', token)
				commit('SET_USER_INFO', userInfo)

				return { success: true, data: response.data.data }
			}
			throw new Error('登录响应格式错误')
		} catch (error) {
			console.error('登录失败:', error)
			console.error('错误详情:', error.response?.data)
			throw error
		}
	},

	// 获取用户信息
	async fetchUserInfo({ commit, state }) {
		if (!state.token) return

		try {
			const response = await getUserInfo()
			if (response.data && response.data.data) {
				commit('SET_USER_INFO', response.data.data)
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
		}
	},

	// 登出
	async logout({ commit }) {
		try {
			// 调用后端登出接口，删除 Redis 中的 token
			await userLogout()
		} catch (error) {
			console.error('后端登出失败:', error)
			// 即使后端失败，也要清除前端状态
		} finally {
			commit('CLEAR_AUTH')
		}
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
}