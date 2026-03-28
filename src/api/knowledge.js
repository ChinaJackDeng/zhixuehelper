// src/api/knowledge.js
// 知识库相关 API 调用

import service from '@/api/request'

/**
 * 获取文档列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.page_size - 每页数量（默认20）
 * @param {string} params.status - 状态筛选（可选：pending/processing/completed/failed）
 * @param {string} params.file_type - 文件类型筛选（可选：text/pdf/doc/docx/image）
 */
export function getDocumentList(params = {}) {
  const requestParams = {
    page: params.page || 1,
    page_size: params.page_size || 20
  }
  
  if (params.status) {
    requestParams.status = params.status
  }
  if (params.file_type) {
    requestParams.file_type = params.file_type
  }
  
  return service({
    url: '/knowledge/documents',
    method: 'get',
    params: requestParams
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
 * 上传文件文档
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
 * @param {string} data.title - 文档标题
 * @param {string} data.content - 文档内容
 * @param {string} data.tags - 标签ID，多个用逗号分隔（可选）
 */
export function createTextDocument(data) {
  return service({
    url: '/knowledge/documents/text',
    method: 'post',
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags || ''
    }
  })
}

/**
 * 更新文档
 * @param {number} docId - 文档 ID
 * @param {Object} data - 更新数据
 * @param {string} data.title - 文档标题（可选）
 * @param {string} data.content - 文档内容（可选）
 * @param {string} data.status - 状态（可选：pending/processing/completed/failed）
 */
export function updateDocument(docId, data) {
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
 * 搜索文档
 * @param {string} query - 查询文本
 * @param {string} searchType - 搜索类型：keyword, vector, hybrid
 * @param {number} topK - 返回结果数量
 */
export function searchDocuments(query, searchType = 'hybrid', topK = 10, options = {}) {
  let url = '/knowledge/search'
  let params = {
    query: query,
    n_results: topK
  }

  if (searchType === 'vector') {
    url = '/knowledge/search/semantic'
    if (options.fileType) params.file_type = options.fileType
    if (options.scoreThreshold !== undefined) params.score_threshold = options.scoreThreshold
  } else if (searchType === 'keyword') {
    url = '/knowledge/search/keyword'
    if (options.fileType) params.file_type = options.fileType
  } else if (searchType === 'hybrid') {
    url = '/knowledge/search/hybrid'
    if (options.fileType) params.file_type = options.fileType
    if (options.semanticWeight !== undefined) params.semantic_weight = options.semanticWeight
    if (options.scoreThreshold !== undefined) params.score_threshold = options.scoreThreshold
  }

  console.log('搜索API调用:', { url, searchType, params })
  return service({
    url: url,
    method: 'get',
    params
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
