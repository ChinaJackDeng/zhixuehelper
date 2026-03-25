<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <Header v-if="!isAuthPage" />
    
    <!-- 页面内容区域 -->
    <div class="page-content" :class="{ 'no-header': isAuthPage }">
      <router-view />
    </div>
    
    <!-- 全局浮动按钮 -->
    <FloatingButton v-if="!isAuthPage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/common/Header.vue'
import FloatingButton from '@/components/common/FloatingButton.vue'

const route = useRoute()

// 判断是否为登录/注册页面
const isAuthPage = computed(() => {
  const path = route.path
  return path === '/login' || path === '/register' || path === '/forgot-password' || path === '/reset-password'
})


</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: Arial, sans-serif;
}

.page-content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.page-content.no-header {
  margin-top: 0;
  min-height: 100vh;
}
</style>