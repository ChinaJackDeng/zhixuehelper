// src/api/knowledge.js
// 知识库相关 API 调用

import service from '@/utils/request'

/**
 * 获取文档列表
 * @param {Object} params - 查询参数
 */
export function getDocumentList(params = {}) {
  return service({
    url: '/knowledge/documents',
    method: 'get',
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      status: params.status || null,
      file_type: params.file_type || null
    }
  })
}

/**
 * 获取文档详情
 * @param {number} docId - 文档 ID
 */
export function getDocumentDetail(docId) {
  return service({
    url: `/knowledge/documents/${docId}`,
    method: 'get'
  })
}

/**
 * 上传文档
 * @param {File} file - 文件对象
 * @param {string} title - 文档标题（可选）
 */
export function uploadDocument(file, title) {
  const formData = new FormData()
  formData.append('file', file)
  if (title) {
    formData.append('title', title)
  }
  
  return service({
    url: '/knowledge/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 创建文本文档
 * @param {Object} data - 文档数据
 */
export function createTextDocument(data) {
  return service({
    url: '/knowledge/documents/text',
    method: 'post',
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags // 字符串，多个标签 ID 用逗号分隔
    }
  })
}

/**
 * 搜索文档
 * @param {string} query - 查询文本
 * @param {string} searchType - 搜索类型：keyword, vector, hybrid
 * @param {number} topK - 返回结果数量
 */
export function searchDocuments(query, searchType = 'hybrid', topK = 10) {
  return service({
    url: '/knowledge/search',
    method: 'get',
    params: { query, search_type: searchType, top_k: topK }
  })
}

/**
 * 删除文档
 * @param {number} docId - 文档 ID
 */
export function deleteDocument(docId) {
  return service({
    url: `/knowledge/documents/${docId}`,
    method: 'delete'
  })
}

/**
 * 更新文档信息
 * @param {number} docId - 文档 ID
 * @param {Object} data - 更新数据
 */
export function updateDocument(docId, data) {
  // 后端使用 form-data 格式
  const formData = new URLSearchParams()
  if (data.title) formData.append('title', data.title)
  if (data.content) formData.append('content', data.content)
  if (data.status) formData.append('status', data.status)
  
  return service({
    url: `/knowledge/documents/${docId}`,
    method: 'put',
    data: formData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 获取标签列表
 */
export function getTagList() {
  return service({
    url: '/knowledge/tags',
    method: 'get'
  })
}

/**
 * 创建标签
 * @param {Object} data - 标签数据
 */
export function createTag(data) {
  return service({
    url: '/knowledge/tags',
    method: 'post',
    data
  })
}

/**
 * 删除标签
 * @param {number} tagId - 标签 ID
 */
export function deleteTag(tagId) {
  return service({
    url: `/knowledge/tags/${tagId}`,
    method: 'delete'
  })
}

/**
 * 为文档添加标签
 * @param {number} docId - 文档 ID
 * @param {Array} tagIds - 标签 ID 列表
 */
export function addTagsToDocument(docId, tagIds) {
  return service({
    url: `/knowledge/documents/${docId}/tags`,
    method: 'post',
    data: { tag_ids: tagIds }
  })
}

/**
 * 从文档移除标签
 * @param {number} docId - 文档 ID
 * @param {number} tagId - 标签 ID
 */
export function removeTagFromDocument(docId, tagId) {
  return service({
    url: `/knowledge/documents/${docId}/tags/${tagId}`,
    method: 'delete'
  })
}

/**
 * 获取文档分块
 * @param {number} docId - 文档 ID
 */
export function getDocumentChunks(docId) {
  return service({
    url: `/knowledge/documents/${docId}/chunks`,
    method: 'get'
  })
}

/**
 * 获取文档关键词
 * @param {number} docId - 文档 ID
 */
export function getDocumentKeywords(docId) {
  return service({
    url: `/knowledge/documents/${docId}/keywords`,
    method: 'get'
  })
}

/**
 * 获取知识图谱
 */
export function getKnowledgeGraph() {
  return service({
    url: '/knowledge/graph',
    method: 'get'
  })
}

/**
 * 生成知识图谱（从文档）
 * @param {number} docId - 文档 ID
 */
export function generateKnowledgeGraph(docId) {
  return service({
    url: `/knowledge/documents/${docId}/graph`,
    method: 'post'
  })
}
