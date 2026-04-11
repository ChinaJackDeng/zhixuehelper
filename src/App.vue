<template>
  <div id="app">
    <Header v-if="!hideGlobalChrome" />
    <div class="page-content" :class="{ 'no-header': hideGlobalChrome }">
      <router-view />
    </div>
    <FloatingButton v-if="!hideGlobalChrome" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/common/Header.vue'
import FloatingButton from '@/components/common/FloatingButton.vue'

const route = useRoute()

const hideGlobalChrome = computed(() => {
  const path = route.path
  if (path.startsWith('/admin')) return true
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
