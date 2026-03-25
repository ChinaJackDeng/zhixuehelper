// src/composables/useTagColor.js

/**
 * 🔹 标签颜色管理组合式函数
 * 作用：为标签生成一致的颜色，相同标签名始终返回相同颜色
 */

// 🔸 预定义颜色池（与主题色协调）
const COLOR_PALETTE = [
    '#1a73e8',  // 主蓝色
    '#67c23a',  // 绿色
    '#e6a23c',  // 橙色
    '#f56c6c',  // 红色
    '#909399',  // 灰色
    '#409eff',  // 亮蓝
    '#626aef',  // 紫蓝
    '#8d90f5',  // 浅紫
    '#b3b6f9',  // 淡紫
    '#d9dbfc',  // 极淡紫
    '#37c4dd',  // 青色
    '#a486f5',  // 紫色
    '#f89898',  // 粉红
    '#95d475',  // 浅绿
    '#eebe77'   // 浅橙
]

// 🔸 颜色缓存（相同标签名返回相同颜色）
const colorCache = new Map()

/**
 * 🔹 根据标签名生成哈希值
 * @param {string} str - 标签名称
 * @returns {number} - 哈希值
 */
const hashCode = (str) => {
    let hash = 0
    if (!str || str.length === 0) return hash

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash  // 转换为 32 位整数
    }

    return Math.abs(hash)
}

/**
 * 🔹 获取标签颜色
 * @param {string} tagName - 标签名称
 * @returns {string} - 十六进制颜色值
 */
export const getTagColor = (tagName) => {
    if (!tagName) return COLOR_PALETTE[0]

    // 检查缓存
    if (colorCache.has(tagName)) {
        return colorCache.get(tagName)
    }

    // 生成颜色
    const hash = hashCode(tagName)
    const colorIndex = hash % COLOR_PALETTE.length
    const color = COLOR_PALETTE[colorIndex]

    // 存入缓存
    colorCache.set(tagName, color)

    return color
}

/**
 * 🔹 获取标签的浅色背景（用于卡片背景）
 * @param {string} tagName - 标签名称
 * @param {number} opacity - 透明度 (0-1)
 * @returns {string} - RGBA 颜色值
 */
export const getTagBgColor = (tagName, opacity = 0.15) => {
    const color = getTagColor(tagName)
    // 将十六进制转换为 RGBA
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * 🔹 获取标签的边框颜色
 * @param {string} tagName - 标签名称
 * @returns {string} - RGBA 颜色值
 */
export const getTagBorderColor = (tagName) => {
    const color = getTagColor(tagName)
    return color + '40'  // 25% 透明度
}

/**
 * 🔹 组合式函数主入口
 * @returns {Object} - 包含所有标签颜色相关方法
 */
export function useTagColor() {
    /**
     * 🔸 获取单个标签颜色
     * @param {string} tagName - 标签名称
     * @returns {string} - 颜色值
     */
    const getTagColor = (tagName) => {
        return getTagColor(tagName)
    }

    /**
     * 🔸 获取多个标签的颜色映射
     * @param {string[]} tagNames - 标签名称数组
     * @returns {Object} - { tagName: color }
     */
    const getTagColors = (tagNames) => {
        const colors = {}
        tagNames.forEach(name => {
            colors[name] = getTagColor(name)
        })
        return colors
    }

    /**
     * 🔸 获取标签样式对象
     * @param {string} tagName - 标签名称
     * @returns {Object} - CSS 样式对象
     */
    const getTagStyle = (tagName) => {
        const color = getTagColor(tagName)
        return {
            backgroundColor: color + '15',  // 8% 透明度背景
            color: color,
            borderColor: color + '40'       // 25% 透明度边框
        }
    }

    /**
     * 🔸 清除颜色缓存（用于标签删除后）
     * @param {string} tagName - 标签名称
     */
    const clearTagColor = (tagName) => {
        colorCache.delete(tagName)
    }

    /**
     * 🔸 清除所有缓存
     */
    const clearAllColors = () => {
        colorCache.clear()
    }

    return {
        getTagColor,
        getTagColors,
        getTagStyle,
        clearTagColor,
        clearAllColors
    }
}

// 🔹 默认导出（方便按需导入）
export default useTagColor