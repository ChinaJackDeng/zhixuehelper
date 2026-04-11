<!-- src/components/common/Header.vue -->
<template>
  <header class="header">
    <!-- Logo -->
    <div class="header-left">
      <div class="logo" @click="goToDashboard">
        <img src="@/assets/images/ZhiXue.jpg" class="logo-image" />
        <span class="logo-text">智学助手</span>
      </div>
    </div>

    <!-- 导航（重点） -->
    <nav class="nav-container">
      <div class="nav-buttons">
        <el-button
          class="nav-btn"
          :class="{ active: activeNav === 'knowledge' }"
          @click="goToKnowledge"
        >
          <el-icon><Collection /></el-icon>
          <span class="btn-text">知识库</span>
        </el-button>

        <el-button
          class="nav-btn"
          :class="{ active: activeNav === 'exam' }"
          @click="goToExam"
        >
          <el-icon><Edit /></el-icon>
          <span class="btn-text">题卷生成</span>
        </el-button>

        <el-button
          class="nav-btn"
          :class="{ active: activeNav === 'practice' }"
          @click="goToPractice"
        >
          <el-icon><Check /></el-icon>
          <span class="btn-text">练习考试</span>
        </el-button>

        <el-button
          class="nav-btn"
          :class="{ active: activeNav === 'wrong' }"
          @click="goToWrongQuestions"
        >
          <el-icon><DocumentDelete /></el-icon>
          <span class="btn-text">错题本</span>
        </el-button>

        <el-button
          class="nav-btn"
          :class="{ active: activeNav === 'analytics' }"
          @click="goToAnalytics"
        >
          <el-icon><TrendCharts /></el-icon>
          <span class="btn-text">个人数据</span>
        </el-button>
      </div>
    </nav>

    <!-- 用户区 -->
    <div class="user-area">
      <el-popover
        v-model:visible="notificationVisible"
        trigger="click"
        placement="bottom-end"
        :width="380"
        popper-class="notification-popover"
        @show="handleNotificationOpen"
      >
        <div class="notification-panel">
          <div class="notification-header">
            <span class="notification-title">通知中心</span>
            <el-button
              v-if="unreadCount > 0"
              link
              type="primary"
              :loading="markAllLoading"
              @click="markAllAsRead"
            >
              全部已读
            </el-button>
          </div>
          <el-skeleton v-if="notificationLoading" :rows="4" animated />
          <div v-else-if="notifications.length === 0" class="notification-empty">暂无通知</div>
          <div v-else class="notification-list">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.read }"
              @click="markAsRead(item)"
            >
              <div class="notification-item-header">
                <el-tag size="small" :type="getLevelType(item.level)">
                  {{ getLevelName(item.level) }}
                </el-tag>
                <div class="notification-item-actions">
                  <span class="notification-time">{{ formatNotificationTime(item.created_at) }}</span>
                  <el-button
                    text
                    class="notification-close-btn"
                    @click.stop="removeNotification(item)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="notification-item-title">{{ item.title }}</div>
              <div class="notification-item-content">{{ item.content }}</div>
            </div>
          </div>
        </div>
        <template #reference>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-button circle class="icon-btn">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
        </template>
      </el-popover>

      <el-dropdown @command="handleUserCommand">
        <div class="avatar-dropdown">
          <el-avatar :size="44" :src="avatarUrl" class="user-avatar">
            {{ username.charAt(0) }}
          </el-avatar>
          <span class="username">{{ username }}</span>
          <el-icon class="arrow-down"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="account">
              <el-icon><User /></el-icon> 账户设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/api/notification'

import {
  Collection,
  Edit,
  Check,
  TrendCharts,
  Bell,
  DocumentDelete,
  User,
  SwitchButton,
  ArrowDown,
  Close
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useStore()

const userInfo = computed(() => store.getters['auth/userInfo'] || {})
const username = computed(() => userInfo.value?.username || '用户')
const avatarUrl = computed(() => {
  const avatar = String(userInfo.value?.avatar || '').trim()
  if (!avatar) return ''
  return `/images/${avatar}`
})
const notifications = ref([])
const notificationVisible = ref(false)
const notificationLoading = ref(false)
const markAllLoading = ref(false)
const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)
let notificationTimer = null
let delayedRefreshTimer = null

const activeNav = computed(() => {
  if (route.path === '/knowledge-graph') return 'knowledge-graph'
  if (route.path.startsWith('/knowledge')) return 'knowledge'
  if (route.path.startsWith('/exam')) return 'exam'
  if (route.path.startsWith('/practice')) return 'practice'
  if (route.path.startsWith('/wrong-questions')) return 'wrong'
  if (route.path.startsWith('/reinforcement-practice')) return 'wrong'
  if (route.path.startsWith('/analytics')) return 'analytics'
  return 'knowledge'
})

const goToDashboard = () => {}
const goToKnowledge = () => router.push('/knowledge')
const goToExam = () => router.push('/exam')
const goToPractice = () => router.push('/practice')
const goToWrongQuestions = () => router.push('/wrong-questions')
const goToAnalytics = () => router.push('/analytics')

const resolveNotificationItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  return []
}

const loadNotifications = async (silent = true) => {
  try {
    if (!silent) {
      notificationLoading.value = true
    }
    const data = await getNotifications({ offset: 0, limit: 20 })
    notifications.value = resolveNotificationItems(data)
  } catch (error) {
    if (!silent) {
      ElMessage.error('通知加载失败，请稍后重试')
    }
  } finally {
    notificationLoading.value = false
  }
}

const markAsRead = async (item) => {
  if (!item || item.read) return
  try {
    await markNotificationRead(item.id)
    item.read = true
  } catch (error) {
    ElMessage.error('标记已读失败，请稍后重试')
  }
}

const markAllAsRead = async () => {
  try {
    markAllLoading.value = true
    await markAllNotificationsRead()
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
  } catch (error) {
    ElMessage.error('全部已读失败，请稍后重试')
  } finally {
    markAllLoading.value = false
  }
}

const removeNotification = async (item) => {
  if (!item?.id) return
  try {
    await deleteNotification(item.id)
    notifications.value = notifications.value.filter(current => current.id !== item.id)
  } catch (error) {
    ElMessage.error('删除通知失败，请稍后重试')
  }
}

const handleNotificationOpen = async () => {
  await loadNotifications(false)
}

const handleNotificationRefresh = () => {
  loadNotifications(true)
}

const handleWindowFocus = () => {
  loadNotifications(true)
}

const handleVisibilityChange = () => {
  if (!document.hidden) {
    loadNotifications(true)
  }
}

const formatNotificationTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const getLevelType = (level) => {
  const mapping = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger'
  }
  return mapping[level] || 'info'
}

const getLevelName = (level) => {
  const mapping = {
    info: '信息',
    success: '成功',
    warning: '提醒',
    error: '紧急'
  }
  return mapping[level] || '通知'
}

const handleUserCommand = async (cmd) => {
  if (cmd === 'account') router.push('/profile')
  if (cmd === 'logout') {
    try {
      await store.dispatch('auth/logout')
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      ElMessage.error('退出登录失败，请重试')
    }
  }
}

onMounted(() => {
  loadNotifications(true)
  window.addEventListener('notification-refresh', handleNotificationRefresh)
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  notificationTimer = setInterval(() => {
    loadNotifications(true)
  }, 10000)
  delayedRefreshTimer = setTimeout(() => {
    loadNotifications(true)
  }, 1500)
})

onBeforeUnmount(() => {
  window.removeEventListener('notification-refresh', handleNotificationRefresh)
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (notificationTimer) {
    clearInterval(notificationTimer)
    notificationTimer = null
  }
  if (delayedRefreshTimer) {
    clearTimeout(delayedRefreshTimer)
    delayedRefreshTimer = null
  }
})
</script>

<style scoped>
.header {
  height: 64px;
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.35);
}

/* Logo */
.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}

/* ===== 导航按钮（重点） ===== */
.nav-container {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  padding: 6px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.nav-btn {
  height: 40px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: white;
  transition: all 0.25s ease;
}

.nav-btn .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

/* Hover */
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 选中态（大气核心） */
.nav-btn.active {
  background: white;
  color: #1a73e8;
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 18px rgba(255, 255, 255, 0.35);
}

/* 用户区 */
.user-area {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  transition: all 0.2s ease;
  font-size: 24px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.05);
}

:deep(.notification-popover) {
  padding: 0 !important;
}

.notification-panel {
  max-height: 440px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  height: 48px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.notification-list {
  max-height: 392px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  cursor: pointer;
  transition: background 0.2s ease;
}

.notification-item:hover {
  background: var(--el-fill-color-light);
}

.notification-item.unread {
  background: #ecf5ff;
}

.notification-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-close-btn {
  padding: 2px;
  min-height: auto;
  color: var(--el-text-color-secondary);
}

.notification-close-btn:hover {
  color: var(--el-color-danger);
}

.notification-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.notification-item-content {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}

.avatar-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.2s;
}

.avatar-dropdown:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}

.username {
  color: white;
  font-size: 18px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-down {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
    height: 56px;
  }

  .logo-text,
  .username {
    display: none;
  }

  .nav-btn .btn-text {
    display: none;
  }

  .nav-buttons {
    gap: 6px;
    padding: 6px 10px;
  }
}
</style>
