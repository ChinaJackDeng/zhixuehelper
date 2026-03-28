// src/api/index.js

// 🔹 导入各业务模块
import * as knowledge from './knowledge'
import * as practice from './practice'
import * as analytics from './analytics'


// 🔹 导出 api 对象（按模块组织）
export const api = {
    knowledge,
    practice,
    analytics
}

// 🔹 默认导出 axios 实例（方便特殊需求直接使用）
export { default as request } from './request'

// // 🔹 导出工具函数（可选）
// export * from './utils/errorCode'