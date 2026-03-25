<!-- src/views/dashboard/Dashboard.vue -->
<template>
  <div class="dashboard">
    <!-- 主内容区域 - 显示当前页面 -->
    <main class="main-content">
      <!-- 路由视图将在这里渲染 -->
      <router-view />
    </main>
  </div>
</template>

<script setup>
// 可以添加全局共享的逻辑
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
</style>
