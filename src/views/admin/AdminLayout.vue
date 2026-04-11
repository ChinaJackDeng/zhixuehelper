<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="logo-wrap">
        <img class="logo-image" :src="logoUrl" alt="智学助手" />
        <span class="logo-text">智学管理</span>
      </div>
      <el-menu
        :default-active="activePath"
        class="admin-menu"
        background-color="#0b1f3a"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>系统总览</span>
        </el-menu-item>
        <el-menu-item index="/admin/incidents">
          <el-icon><Warning /></el-icon>
          <span>异常处置中心</span>
        </el-menu-item>
        <el-menu-item index="/admin/quality">
          <el-icon><TrendCharts /></el-icon>
          <span>题目质量运营台</span>
        </el-menu-item>
        <el-menu-item index="/admin/reach">
          <el-icon><Promotion /></el-icon>
          <span>通知与触达</span>
        </el-menu-item>
        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知运营</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/logs">
          <el-icon><Document /></el-icon>
          <span>日志管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/ai-config">
          <el-icon><Setting /></el-icon>
          <span>AI配置</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <span class="admin-user">{{ adminName }}</span>
          <el-button type="danger" link @click="handleLogout">退出</el-button>
        </div>
      </header>
      <section class="admin-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Bell, User, Warning, TrendCharts, Promotion, Document, Setting } from '@element-plus/icons-vue'
import logoUrl from '@/assets/images/ZhiXue.jpg'

const route = useRoute()
const router = useRouter()

const activePath = computed(() => route.path)
const pageTitle = computed(() => {
  if (route.path.includes('/admin/incidents')) return '异常处置中心'
  if (route.path.includes('/admin/quality')) return '题目质量运营台'
  if (route.path.includes('/admin/reach')) return '通知与触达'
  if (route.path.includes('/admin/notifications')) return '通知运营'
  if (route.path.includes('/admin/users')) return '用户管理'
  if (route.path.includes('/admin/logs')) return '日志管理'
  if (route.path.includes('/admin/ai-config')) return 'AI 配置'
  return '系统总览'
})
const adminName = computed(() => {
  const raw = localStorage.getItem('userInfo')
  if (!raw) return '管理员'
  try {
    const info = JSON.parse(raw)
    return info?.username || '管理员'
  } catch {
    return '管理员'
  }
})

const handleLogout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('userInfo')
  ElMessage.success('已退出管理端')
  router.replace('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #ffffff;
  --el-color-primary: #1f4f8a;
  --el-color-primary-light-3: #3f6799;
  --el-color-primary-light-5: #5f7fa8;
  --el-color-primary-dark-2: #173e6f;
  --el-font-size-base: 17px;
}

.admin-sidebar {
  width: 220px;
  background: #0b1f3a;
  color: #fff;
  flex-shrink: 0;
}

.logo-wrap {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-image {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  object-fit: cover;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.admin-menu {
  border-right: none;
}

:deep(.admin-menu .el-menu-item) {
  font-size: 16px;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f3f6fb;
}

.admin-header {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e5eaf3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-title {
  font-size: 19px;
  font-weight: 600;
  color: #1f2d3d;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-user {
  color: #4a5568;
}

.admin-content {
  padding: 16px;
  color: #1f2d3d;
  background: #f3f6fb;
}

:deep(.el-card) {
  border: 1px solid #dbe5f3;
  box-shadow: 0 2px 8px rgba(16, 42, 77, 0.06);
}

:deep(.el-table) {
  --el-table-header-bg-color: #f5f8fd;
  --el-table-border-color: #e4ebf5;
  --el-table-text-color: #1f2d3d;
  --el-table-header-text-color: #334155;
}

@media (max-width: 900px) {
  .admin-sidebar {
    width: 180px;
  }
}
</style>
