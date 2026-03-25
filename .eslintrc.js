// .eslintrc.js
module.exports = {
    root: true,
    env: {
        node: true,
        // ✅ 添加 browser 环境
        browser: true
    },
    extends: [
        'plugin:vue/vue3-essential',
        'eslint:recommended'
    ],
    parserOptions: {
        parser: '@babel/eslint-parser',
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        // ✅ 允许 Vue3 编译器宏
        'vue/multi-word-component-names': 'off',
        'no-undef': 'off'  // ⚠️ 临时关闭，或用方案 B
    },
    // ✅ 关键：声明 Vue 编译器宏为全局变量
    globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
    }
}