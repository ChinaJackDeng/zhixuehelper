// src/api/chat.js
// 聊天功能相关 API 调用

import service from '@/api/request'

/**
 * 发送消息并获取 AI 回复
 * @param {Object} data - 请求数据
 * @param {string} data.message - 用户的消息内容
 * @param {string} data.conversation_id - 会话ID（首次对话不传）
 * @param {Array} data.context_files - 关联的文件ID列表
 */
export function sendChatMessage(data) {
  return service({
    url: '/chat/message',
    method: 'post',
    data: {
      message: data.message,
      conversation_id: data.conversation_id || null,
      context_files: data.context_files || []
    }
  })
}

/**
 * 获取对话历史
 * @param {string} conversationId - 会话ID
 */
export function getChatHistory(conversationId) {
  return service({
    url: '/chat/history',
    method: 'get',
    params: {
      conversation_id: conversationId
    }
  })
}

/**
 * 创建新对话
 */
export function createConversation() {
  return service({
    url: '/chat/conversation',
    method: 'post',
    data: {}
  })
}

/**
 * 清空对话历史
 * @param {string} conversationId - 会话ID
 */
export function clearChatHistory(conversationId) {
  return service({
    url: `/chat/history/${conversationId}`,
    method: 'delete'
  })
}

/**
 * 添加文件到对话上下文
 * @param {string} conversationId - 会话ID
 * @param {Array} fileIds - 文件ID列表
 */
export function addFilesToContext(conversationId, fileIds) {
  return service({
    url: '/chat/context/files',
    method: 'post',
    data: {
      conversation_id: conversationId,
      file_ids: fileIds
    }
  })
}

/**
 * 从对话上下文移除文件
 * @param {string} conversationId - 会话ID
 * @param {string} fileId - 文件ID
 */
export function removeFileFromContext(conversationId, fileId) {
  return service({
    url: `/chat/context/files/${fileId}`,
    method: 'delete',
    params: {
      conversation_id: conversationId
    }
  })
}
