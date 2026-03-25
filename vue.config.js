const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  // 为了兼容意外注入的 `@vue/composition-api`（来自某些 babel sugar 插件）
  // 在 Vue 3 项目中将其别名到内置的 `vue`，避免安装不兼容的 Vue 2 包。
    configureWebpack: {
      resolve: {
        alias: {
          // 如果某些编译器/插件注入了 `@vue/composition-api`，让它解析到 `vue` 包
          '@vue/composition-api': path.resolve(__dirname, 'node_modules/vue')
        }
      }
    }
})

module.exports = {
  devServer: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
};