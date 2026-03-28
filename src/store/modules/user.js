import { api } from '@/api'
import { ElMessage } from 'element-plus'

const ACCESS_TOKEN_KEY = 'access_token'

export default {
    namespaced: true,

    state: () => ({
        userInfo: null,
        token: localStorage.getItem(ACCESS_TOKEN_KEY) || null,
        isLoggedIn: !!localStorage.getItem(ACCESS_TOKEN_KEY),
        loading: false
    }),

    getters: {
        username: (state) => state.userInfo?.username || '学员',
        avatar: (state) => state.userInfo?.avatar || '',
        email: (state) => state.userInfo?.email || '',
        userId: (state) => state.userInfo?.id || null
    },

    mutations: {
        SET_USER_INFO(state, userInfo) {
            state.userInfo = userInfo
        },

        SET_TOKEN(state, token) {
            state.token = token
            if (token) {
                localStorage.setItem(ACCESS_TOKEN_KEY, token)
            } else {
                localStorage.removeItem(ACCESS_TOKEN_KEY)
            }
        },

        SET_LOGIN_STATUS(state, isLoggedIn) {
            state.isLoggedIn = isLoggedIn
            // login 状态以 token 为准；兼容旧字段但不再作为权威来源
            if (isLoggedIn) {
                localStorage.setItem('isLoggedIn', 'true')
            } else {
                localStorage.removeItem('isLoggedIn')
            }
        },

        SET_LOADING(state, loading) {
            state.loading = loading
        },

        CLEAR_USER(state) {
            state.userInfo = null
            state.token = null
            state.isLoggedIn = false
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem('token')
            localStorage.removeItem('isLoggedIn')
        }
    },

    actions: {
        // 登录
        async login({ commit }, { username, password }) {
            commit('SET_LOADING', true)
            try {
                const { token, user } = await api.user.login({ username, password })
                commit('SET_TOKEN', token)
                commit('SET_USER_INFO', user)
                commit('SET_LOGIN_STATUS', true)
                ElMessage.success('登录成功')
                return user
            } catch (error) {
                ElMessage.error('登录失败：' + error.message)
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        // 获取用户信息
        async fetchUserInfo({ commit, state }) {
            if (!state.token) return
            try {
                const userInfo = await api.user.profile()
                commit('SET_USER_INFO', userInfo)
            } catch (error) {
                console.error('获取用户信息失败', error)
            }
        },

        // 更新用户信息
        async updateUserInfo({ commit }, data) {
            try {
                const userInfo = await api.user.updateProfile(data)
                commit('SET_USER_INFO', userInfo)
                ElMessage.success('更新成功')
            } catch (error) {
                ElMessage.error('更新失败')
                throw error
            }
        },

        // 退出登录
        logout({ commit }) {
            commit('CLEAR_USER')
            ElMessage.success('已退出登录')
        },

        // 检查登录状态
        checkLogin({ state, dispatch }) {
            if (state.isLoggedIn && !state.userInfo) {
                dispatch('fetchUserInfo')
            }
        }
    }
}