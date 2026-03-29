<template>
  <div>
    <!-- 浮动按钮 -->
    <div 
      class="floating-button" 
      ref="floatingBtn"
      :style="{ 
        left: currentPosition.x + 'px', 
        top: currentPosition.y + 'px'
      }"
      @mousedown="startDrag"
    >
      <el-button 
        type="primary" 
        circle 
        size="large"
        @click="handleClick"
      >
        <el-icon><ChatDotRound /></el-icon>
      </el-button>
    </div>
    
    <!-- 聊天窗口 -->
    <div v-if="showChatWindow" class="chat-window">
      <div class="chat-header">
        <h3>小智助手</h3>
        <div class="header-actions">
          <!-- 文件选择下拉框（带搜索功能） -->
          <el-select 
            v-model="selectedFile" 
            placeholder="搜索文件" 
            class="file-select" 
            filterable
            clearable
            :loading="loadingFiles"
            :teleported="false"
            :popper-class="'file-select-dropdown'"
          >
            <el-option 
              v-for="file in allFiles" 
              :key="file.id" 
              :label="file.name" 
              :value="file.id"
            />
          </el-select>
          <!-- 加入到聊天按钮 -->
          <el-button 
            type="primary" 
            size="small"
            @click="addFileToChat"
            :disabled="!selectedFile"
            class="add-file-btn"
          >
            <span>加入到对话</span>
          </el-button>
          <el-button 
            link
            @click="handleClose"
            class="close-btn"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="chat-body">
        <div class="chat-messages">
          <!-- 系统消息 -->
          <div class="message system-message">
            <div class="message-content">
              你好！我是小智助手，有什么可以帮助你的吗？
            </div>
          </div>
          
          <!-- 用户消息 -->
          <div v-for="(message, index) in messages" :key="index" class="message" :class="message.type">
            <div class="message-content">
              <el-icon v-if="message.type === 'system-message'" class="file-icon"><Document /></el-icon>
              <div v-if="message.type === 'ai-message'" class="markdown-content" v-html="renderMarkdown(message.content)"></div>
              <div v-else>{{ message.content }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入你的问题..."
            class="input-field"
            :disabled="loading"
            @keydown.enter.prevent="sendMessage"
          />
          <el-button 
            type="primary" 
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputMessage.trim()"
            class="send-btn"
          >
            <span>发送</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ChatDotRound, Close, Document } from '@element-plus/icons-vue'
import { getDocumentList } from '@/api/knowledge'
import { sendChatMessage, createConversation, getChatHistory } from '@/api/chat'
import MarkdownIt from 'markdown-it'

// 初始化 Markdown 渲染器
const md = new MarkdownIt()

const props = defineProps({
  onClick: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['click'])

const floatingBtn = ref(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const currentPosition = ref({ x: 0, y: 0 })
const showChatWindow = ref(false)
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false) // 消息发送加载状态
const conversationId = ref(localStorage.getItem('currentConversationId') || null) // 当前会话 ID，从 localStorage 读取

// 文件相关
const documents = ref([]) // 从API获取的文档列表
const selectedFile = ref(null) // 改为null，避免类型不匹配
const addedFiles = ref([]) // 已加入到聊天的文件列表
const loadingFiles = ref(false) // 文件加载状态

// 计算所有文件列表
const allFiles = computed(() => {
  return documents.value.map(doc => ({
    id: doc.id,
    name: doc.title || doc.file_path,
    type: doc.file_type,
    size: doc.file_size
  }))
})

// 加载文档列表
const loadDocuments = async () => {
  loadingFiles.value = true
  try {
    const response = await getDocumentList({
      page: 1,
      page_size: 100 // 获取更多文档供选择
    })
    
    // 处理不同的响应格式
    let docs = []
    
    if (response.documents) {
      docs = response.documents
    } else if (response.data && response.data.documents) {
      docs = response.data.documents
    } else if (response.data) {
      docs = response.data
    }
    
    documents.value = docs
  } catch (error) {
    console.error('加载文档列表失败:', error)
    documents.value = []
  } finally {
    loadingFiles.value = false
  }
}

const startDrag = (e) => {
  if (e.button !== 0) return // 只处理左键
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - currentPosition.value.x,
    y: e.clientY - currentPosition.value.y
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  currentPosition.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  
  // 限制在窗口内
  if (floatingBtn.value) {
    const btnWidth = floatingBtn.value.offsetWidth
    const btnHeight = floatingBtn.value.offsetHeight
    
    currentPosition.value.x = Math.max(0, Math.min(window.innerWidth - btnWidth, currentPosition.value.x))
    currentPosition.value.y = Math.max(0, Math.min(window.innerHeight - btnHeight, currentPosition.value.y))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const handleClick = async () => {
  if (!isDragging.value) {
    showChatWindow.value = !showChatWindow.value

    // 如果是打开窗口
    if (showChatWindow.value) {
      // 如果没有会话 ID，创建新会话
      if (!conversationId.value) {
        await initConversation()
      } else {
        // 如果有会话 ID，加载历史消息
        await loadChatHistory()
      }
    }

    emit('click')
    if (props.onClick) {
      props.onClick()
    }
  }
}

const handleClose = () => {
  showChatWindow.value = false
  // 清空已加入的文件列表
  addedFiles.value = []
  // 不清空消息列表，保持历史消息
  // messages.value = []
  // 不清空会话 ID，保持会话
  // conversationId.value = null
}

// 创建新会话
const initConversation = async () => {
  try {
    const response = await createConversation()
    conversationId.value = response.conversation_id
    // 保存到 localStorage
    localStorage.setItem('currentConversationId', response.conversation_id)
  } catch (error) {
    console.error('创建会话失败:', error)
    // 如果创建失败，使用本地模拟
    conversationId.value = null
  }
}

// 加载对话历史
const loadChatHistory = async () => {
  if (!conversationId.value) {
    console.log('没有会话 ID，跳过加载历史')
    return
  }

  try {
    console.log('加载对话历史，会话 ID:', conversationId.value)
    const response = await getChatHistory(conversationId.value)
    
    console.log('对话历史响应:', response)
    console.log('消息数量:', response.messages?.length)
    
    // 显示最近 10 条消息
    const recentMessages = response.messages ? response.messages.slice(-10) : []
    
    messages.value = recentMessages.map(msg => ({
      type: msg.role === 'user' ? 'user-message' : 'ai-message',
      content: msg.content
    }))
    
    console.log('已加载对话历史:', messages.value.length, '条消息')
  } catch (error) {
    console.error('加载对话历史失败:', error)
    // 如果加载失败，清空会话 ID
    localStorage.removeItem('currentConversationId')
    conversationId.value = null
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage = inputMessage.value.trim()

  // 添加用户消息到界面
  messages.value.push({
    type: 'user-message',
    content: userMessage
  })

  loading.value = true
  inputMessage.value = ''

  try {
    // 准备上下文文件列表
    const contextFiles = addedFiles.value.map(file => file.id.toString())

    // 调用API发送消息
    const response = await sendChatMessage({
      message: userMessage,
      conversation_id: conversationId.value,
      context_files: contextFiles
    })

    // 更新会话 ID（如果是首次对话）
    if (!conversationId.value && response.conversation_id) {
      conversationId.value = response.conversation_id
      // 保存到 localStorage
      localStorage.setItem('currentConversationId', response.conversation_id)
    }

    // 添加AI回复到界面
    messages.value.push({
      type: 'ai-message',
      content: response.ai_response || '抱歉，我暂时无法回答您的问题。'
    })

    // 如果有引用文件，显示引用信息
    if (response.references && response.references.length > 0) {
      const refInfo = response.references.map(ref =>
        `📄 ${ref.file_name} (相关度: ${(ref.relevance * 100).toFixed(0)}%)`
      ).join('\n')

      messages.value.push({
        type: 'system-message',
        content: `参考文件：\n${refInfo}`
      })
    }

  } catch (error) {
    console.error('发送消息失败:', error)

    // 显示错误消息
    messages.value.push({
      type: 'ai-message',
      content: '抱歉，消息发送失败，请稍后重试。'
    })
  } finally {
    loading.value = false
  }
}

// 加入文件到聊天
const addFileToChat = () => {
  if (selectedFile.value !== null && selectedFile.value !== '') {
    // 查找选中的文件
    const selectedFileObj = documents.value.find(doc => doc.id == selectedFile.value)
    
    if (selectedFileObj) {
      // 检查文件是否已经加入
      const isAlreadyAdded = addedFiles.value.some(file => file.id === selectedFile.value)
      if (!isAlreadyAdded) {
        // 添加到已加入文件列表
        addedFiles.value.push({
          id: selectedFile.value,
          name: selectedFileObj.title || selectedFileObj.file_path,
          type: selectedFileObj.file_type,
          size: selectedFileObj.file_size
        })
        
        // 添加系统消息，说明文件已加入
        messages.value.push({
          type: 'system-message',
          content: `已加入文件：${selectedFileObj.title || selectedFileObj.file_path}`
        })
      }
      
      // 清除文件选择，让用户可以继续选择其他文件
      selectedFile.value = ''
    }
  }
}

// 渲染 Markdown 内容
const renderMarkdown = (content) => {
  return md.render(content)
}

const updateButtonPosition = () => {
  if (floatingBtn.value) {
    const btnWidth = floatingBtn.value.offsetWidth
    const btnHeight = floatingBtn.value.offsetHeight
    
    currentPosition.value = {
      x: window.innerWidth - btnWidth - 30,
      y: window.innerHeight - btnHeight - 30
    }
  }
}

onMounted(() => {
  loadDocuments() // 加载文档列表
  updateButtonPosition()
  window.addEventListener('resize', updateButtonPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateButtonPosition)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.floating-button {
  position: fixed;
  z-index: 9999;
  cursor: move;
  user-select: none;
  transition: all 0.3s ease;
}

.floating-button:hover {
  transform: scale(1.1);
}

:deep(.el-button--primary) {
  background: rgba(26, 115, 232, 0.5);
  border: none !important;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.2);
  transition: all 0.3s ease;
  width: 80px !important;
  height: 80px !important;
  border-radius: 50% !important;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}

:deep(.el-button--primary:hover) {
  background: rgba(26, 115, 232, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(26, 115, 232, 0.3);
}

:deep(.el-button__icon) {
  font-size: 32px;
}

/* 聊天窗口 */
.chat-window {
  position: fixed;
  width: 40vw;
  height: 90vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  overflow: hidden;
  transition: all 0.3s ease;
  top: 64px;
  right: 150px;
}

.chat-header {
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-select {
  width: 300px;
  position: relative;
  z-index: 10000;
}

/* 下拉框样式 */
:deep(.file-select-dropdown) {
  z-index: 10001 !important;
  position: fixed !important;
}

/* 文件选项样式 - 整体透明白色背景 */
:deep(.file-select-dropdown .el-select-dropdown__list) {
  background-color: rgba(255, 255, 255, 0.9) !important;
  padding: 8px 0;
}

/* 文件选项 - 更透明的紫红色 */
:deep(.file-select-dropdown .el-select-dropdown__item) {
  background-color: rgba(200, 100, 150, 0.15) !important;
  margin: 2px 8px;
  border-radius: 4px;
}

:deep(.file-select-dropdown .el-select-dropdown__item:hover) {
  background-color: rgba(200, 100, 150, 0.3) !important;
}

:deep(.file-select-dropdown .el-select-dropdown__item.is-selected) {
  background-color: rgba(200, 100, 150, 0.5) !important;
  color: #333 !important;
}

.add-file-btn {
  margin-left: 8px;
  border-radius: 4px;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
}

:deep(.add-file-btn) {
  border-radius: 4px !important;
  height: 32px !important;
  padding: 0 12px !important;
  font-size: 12px !important;
  background-color: #fff9c4 !important;
  border-color: #fff9c4 !important;
  color: #666 !important;
}

:deep(.add-file-btn span) {
  color: #666 !important;
}



:deep(.file-select .el-input__inner) {
  color: #333;
  font-size: 14px;
}

:deep(.file-select .el-select__caret) {
  color: #333;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn :deep(.el-icon) {
  color: white;
  font-size: 20px;
}

.chat-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 20px;
  max-width: 85%;
  display: flex;
}

.system-message {
  justify-content: center;
}

.system-message .message-content {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
  max-width: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
  color: #4caf50;
}

.user-message {
  justify-content: flex-end;
  margin-left: auto;
}

.user-message .message-content {
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  color: white;
  border-radius: 16px 16px 0 16px;
  padding: 16px 20px;
  font-size: 18px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
  position: relative;
  max-width: 70ch;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.user-message .message-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -8px;
  width: 0;
  height: 0;
  border-left: 12px solid #4285f4;
  border-top: 12px solid transparent;
  border-bottom: 0 solid transparent;
}

.ai-message {
  justify-content: flex-start;
  margin-right: auto;
}

.ai-message .message-content {
  background: white;
  color: #333;
  border-radius: 16px 16px 16px 0;
  padding: 16px 20px;
  font-size: 18px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  position: relative;
  max-width: 70ch;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.ai-message .message-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -8px;
  width: 0;
  height: 0;
  border-right: 12px solid white;
  border-top: 12px solid transparent;
  border-bottom: 0 solid transparent;
}

/* Markdown 内容样式 */
.markdown-content {
  font-size: 16px;
  line-height: 1.6;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #1a73e8;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #555;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 20px;
  margin: 0.5em 0;
}

.markdown-content :deep(li) {
  margin: 0.3em 0;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: #e83e8c;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.8em 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #24292e;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #1a73e8;
  padding-left: 16px;
  margin: 0.8em 0;
  color: #666;
  font-style: italic;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #1a73e8;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
}

.markdown-content :deep(a) {
  color: #1a73e8;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.03);
}

/* 聊天输入区域 */
.chat-input {
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 16px;
  align-items: flex-end;
  justify-content: center;
}

.input-field {
  flex: 1;
  max-width: 80%;
}

:deep(.el-input__inner) {
  font-size: 18px;
  padding: 15px 20px;
  border-radius: 24px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  min-height: 60px;
  max-height: 140px;
  resize: none;
  line-height: 1.5;
}

:deep(.el-textarea__inner) {
  font-size: 18px;
  padding: 15px 20px;
  border-radius: 24px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  min-height: 60px;
  max-height: 140px;
  resize: none;
  line-height: 1.5;
}

:deep(.el-textarea__inner:focus) {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

:deep(.el-textarea) {
  line-height: 1.5;
}

:deep(.el-input__inner:focus) {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

/* 发送按钮样式 - 移除图标后简化 */
.send-btn {
  flex-shrink: 0;
  width: 80px !important;
  height: 56px !important;
  border-radius: 4px !important;
  margin-top: 0;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 14px !important;
}

:deep(.send-btn) {
  background-color: #2675eb !important;
  border-color: #1e71ee !important;
}

:deep(.send-btn:hover) {
  background-color: #185aa5 !important;
  border-color: #1a60b0 !important;
}

:deep(.send-btn span) {
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 1 !important;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-window {
    width: 90vw;
    height: 70vh;
  }
}
</style>