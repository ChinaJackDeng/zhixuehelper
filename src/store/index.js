import { createStore } from 'vuex'
import knowledge from './modules/knowledge'
import user from './modules/user'
import auth from './modules/auth'
import getters from './getters'

export default createStore({
  modules: {
    knowledge,
    user,
    auth
  },
  getters,
  state: {
    // 全局状态
    appVersion: '1.0.0',
    isLoading: false
  },
  mutations: {
    SET_LOADING(state, payload) {
      state.isLoading = payload
    }
  },
  actions: {
    // 全局 action
    showLoading({ commit }) {
      commit('SET_LOADING', true)
    },
    hideLoading({ commit }) {
      commit('SET_LOADING', false)
    }
  }
})