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
            type="text" 
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
              {{ message.content }}
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
          />
          <el-button 
            type="primary" 
            @click="sendMessage"
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

// 文件相关
const knowledgeBases = ref([
  {
    id: '1', 
    name: '数学知识库',
    files: [
      { id: '1-1', name: '高等数学上册' },
      { id: '1-2', name: '高等数学下册' },
      { id: '1-3', name: '线性代数' },
      { id: '1-4', name: '概率论与数理统计' }
    ]
  },
  {
    id: '2', 
    name: '物理知识库',
    files: [
      { id: '2-1', name: '力学' },
      { id: '2-2', name: '热学' },
      { id: '2-3', name: '电磁学' },
      { id: '2-4', name: '光学' }
    ]
  },
  {
    id: '3', 
    name: '化学知识库',
    files: [
      { id: '3-1', name: '无机化学' },
      { id: '3-2', name: '有机化学' },
      { id: '3-3', name: '分析化学' },
      { id: '3-4', name: '物理化学' }
    ]
  },
  {
    id: '4', 
    name: '语文知识库',
    files: [
      { id: '4-1', name: '古代文学' },
      { id: '4-2', name: '现代文学' },
      { id: '4-3', name: '当代文学' },
      { id: '4-4', name: '外国文学' }
    ]
  },
  {
    id: '5', 
    name: '英语知识库',
    files: [
      { id: '5-1', name: '英语语法' },
      { id: '5-2', name: '英语阅读' },
      { id: '5-3', name: '英语口语' },
      { id: '5-4', name: '英语写作' }
    ]
  }
])
const selectedFile = ref('')
const addedFiles = ref([]) // 已加入到聊天的文件列表

// 计算所有文件列表
const allFiles = computed(() => {
  return knowledgeBases.value.flatMap(kb => kb.files)
})

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

const handleClick = () => {
  if (!isDragging.value) {
    showChatWindow.value = !showChatWindow.value
    
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
  // 清空消息列表
  messages.value = []
}

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    // 添加用户消息
    messages.value.push({
      type: 'user-message',
      content: inputMessage.value.trim()
    })
    
    // 模拟回复
    setTimeout(() => {
      let response = '感谢你的问题！我正在处理中...' + inputMessage.value.trim()
      
      // 如果有已加入的文件，添加文件信息
      if (addedFiles.value.length > 0) {
        const fileInfo = addedFiles.value.map(file => `${file.knowledgeBase} - ${file.name}`).join('、')
        response = `[文件：${fileInfo}] ${response}`
      }
      
      messages.value.push({
        type: 'ai-message',
        content: response
      })
    }, 1000)
    
    inputMessage.value = ''
  }
}

// 加入文件到聊天
const addFileToChat = () => {
  if (selectedFile.value) {
    // 查找文件所属的知识库和文件名称
    let selectedFileObj = null
    let selectedKBName = ''
    
    for (const kb of knowledgeBases.value) {
      const file = kb.files.find(f => f.id === selectedFile.value)
      if (file) {
        selectedFileObj = file
        selectedKBName = kb.name
        break
      }
    }
    
    if (selectedFileObj) {
      // 检查文件是否已经加入
      const isAlreadyAdded = addedFiles.value.some(file => file.id === selectedFile.value)
      if (!isAlreadyAdded) {
        // 添加到已加入文件列表
        addedFiles.value.push({
          id: selectedFile.value,
          name: selectedFileObj.name,
          knowledgeBase: selectedKBName
        })
        
        // 添加系统消息，说明文件已加入
        messages.value.push({
          type: 'system-message',
          content: `已加入文件：${selectedKBName} - ${selectedFileObj.name}`
        })
      }
      
      // 清除文件选择，让用户可以继续选择其他文件
      selectedFile.value = ''
    }
  }
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
  background-color:#fff9c4!important;
  border-color:  #fff9c4!important;
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
  max-width: 40ch;
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