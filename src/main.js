// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'

// 导入图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 抑制 ResizeObserver 警告
const debounce = (fn) => {
  let frame
  return (...params) => {
    if (frame) {
      cancelAnimationFrame(frame)
    }
    frame = requestAnimationFrame(() => {
      fn(...params)
    })
  }
}

const originalResizeObserver = window.ResizeObserver
window.ResizeObserver = class ResizeObserver extends originalResizeObserver {
  constructor(callback) {
    super(debounce(callback))
  }
}

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 配置 Element Plus
app.use(ElementPlus, {
    size: 'default',
    zIndex: 2000
})

app.use(store)
app.use(router)

// 全局样式
import './styles/global.css'

app.mount('#app')