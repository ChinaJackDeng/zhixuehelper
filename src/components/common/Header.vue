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
          :class="{ active: activeNav === 'knowledge-graph' }"
          @click="goToKnowledgeGraph"
        >
          <el-icon><Connection /></el-icon>
          <span class="btn-text">知识图谱</span>
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
      <el-badge :value="unreadCount" :hidden="unreadCount === 0">
        <el-button circle class="icon-btn" @click="handleNotification">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>

      <el-dropdown @command="handleUserCommand">
        <div class="avatar-dropdown">
          <el-avatar :size="44" class="user-avatar">
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

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
  Connection
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useStore()

const username = computed(() => store.getters['auth/userInfo']?.username || '用户')
const unreadCount = ref(0)

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
const goToKnowledgeGraph = () => router.push('/knowledge-graph')
const goToExam = () => router.push('/exam')
const goToPractice = () => router.push('/practice')
const goToWrongQuestions = () => router.push('/wrong-questions')
const goToAnalytics = () => router.push('/analytics')

const handleNotification = () => ElMessage.info('暂无新通知')

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

// 用户名通过 computed 从 store 中获取，无需手动初始化
// onMounted(() => {
//   const info = localStorage.getItem('userInfo')
//   if (info) username.value = JSON.parse(info).username || '用户'
// })
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