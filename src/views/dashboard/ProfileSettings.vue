<template>
  <div class="profile-settings-container">
    <!-- 账户信息设置 -->
    <div class="setting-section">
      <div class="section-header" @click="toggleSection('account')">
        <h3 class="section-title">账户信息设置</h3>
        <el-icon class="toggle-icon">
          <ArrowUp v-if="expandedSections.account" />
          <ArrowDown v-else />
        </el-icon>
      </div>
      
      <div v-if="expandedSections.account" class="section-content">
        <div class="form-group">
          <label>用户名</label>
          <div class="input-with-btn">
            <el-input v-model="profile.username" placeholder="请输入用户名" size="large" />
            <el-button type="primary" size="large" @click="updateUsername">
              保存
            </el-button>
          </div>
        </div>

        <div class="form-group">
          <label>邮箱</label>
          <div class="input-with-btn">
            <el-input v-model="profile.email" placeholder="请输入新邮箱" size="large" />
            <el-button type="primary" plain size="large" @click="sendCode">
              发送验证码
            </el-button>
          </div>
          <div class="input-with-btn" style="margin-top: 12px;">
            <el-input v-model="profile.code" placeholder="请输入验证码" size="large" />
            <el-button type="primary" size="large" @click="updateEmail">
              更换邮箱
            </el-button>
          </div>
        </div>

        <div class="form-group">
          <label>密码</label>
          <el-button type="primary" plain size="large" @click="showPwd = true" style="width: 100%;">
            修改密码
          </el-button>
        </div>
      </div>
    </div>

    <!-- 学习统计 -->
    <div class="setting-section">
      <div class="section-header" @click="toggleSection('stats')">
        <h3 class="section-title">学习统计</h3>
        <el-icon class="toggle-icon">
          <ArrowUp v-if="expandedSections.stats" />
          <ArrowDown v-else />
        </el-icon>
      </div>
      
      <div v-if="expandedSections.stats" class="section-content">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ profile.stats.conversations.toLocaleString() }}</div>
            <div class="stat-label">累计对话次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ profile.stats.tokens.toLocaleString() }}</div>
            <div class="stat-label">累计消耗 Token</div>
            <div class="stat-sub">{{ tokenWords }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ profile.stats.docs }}</div>
            <div class="stat-label">已上传文档</div>
            <div class="stat-sub">{{ profile.stats.storage }} MB</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据安全设置 -->
    <div class="setting-section">
      <div class="section-header" @click="toggleSection('security')">
        <h3 class="section-title">数据安全设置</h3>
        <el-icon class="toggle-icon">
          <ArrowUp v-if="expandedSections.security" />
          <ArrowDown v-else />
        </el-icon>
      </div>
      
      <div v-if="expandedSections.security" class="section-content">
        <div class="setting-item">
          <div class="setting-info">
            <label>最大回复长度</label>
            <p>限制单次 AI 回复的 Token 上限，防止长文跑超预算</p>
          </div>
          <div class="setting-control">
            <el-input-number
              v-model="settings.maxResponseLength"
              :min="512"
              :max="8192"
              :step="512"
              size="large"
              controls-position="right"
            />
            <span class="unit">TOKEN</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>对话历史保留</label>
            <p>设置对话记录在 Redis 中的保留时长</p>
          </div>
          <div class="setting-control">
            <el-select v-model="settings.historyRetention" size="large" style="width: 140px;">
              <el-option label="7 天" value="7" />
              <el-option label="30 天" value="30" />
              <el-option label="永久" value="0" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="setting-section">
      <div class="section-header" @click="toggleSection('data')">
        <h3 class="section-title">数据管理</h3>
        <el-icon class="toggle-icon">
          <ArrowUp v-if="expandedSections.data" />
          <ArrowDown v-else />
        </el-icon>
      </div>
      
      <div v-if="expandedSections.data" class="section-content">
        <div class="export-section">
          <div class="export-info">
            <p>将您的对话记录导出为文件，便于备份或迁移</p>
            <div class="export-meta">
              <span>
                {{ mockConversations.length }} 条对话
              </span>
            </div>
          </div>
          <div class="export-buttons">
            <el-button type="primary" size="large" @click="exportData('json')">
              导出 JSON
            </el-button>
            <el-button type="primary" size="large" @click="exportData('txt')">
              导出 TXT
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <div class="save-info">
        <div>
          <p class="save-title">设置自动保存</p>
          <p class="save-time">上次更新：{{ lastSavedTime }}</p>
        </div>
      </div>
      <el-button type="primary" size="large" :loading="saving" @click="saveSettings">
        保存更改
      </el-button>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPwd" title="修改密码" width="420px">
      <div class="pwd-form">
        <el-input v-model="pwd.old" type="password" placeholder="旧密码" size="large" />
        <el-input v-model="pwd.new" type="password" placeholder="新密码" size="large" />
        <el-input v-model="pwd.confirm" type="password" placeholder="确认新密码" size="large" />
      </div>
      <template #footer>
        <el-button @click="showPwd = false">取消</el-button>
        <el-button type="primary" @click="updatePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { updateUserInfo, changePassword, sendVerificationCode, getUserInfo } from '@/api/user'

// 展开/折叠状态
const expandedSections = ref({
  account: false,
  stats: false,
  security: false,
  data: false
})

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// ========== 个人资料数据 ==========
const store = useStore()
const profile = ref({
  username: store.getters['auth/userInfo']?.username || '用户',
  email: store.getters['auth/userInfo']?.email || '',
  code: '',
  stats: {
    conversations: 128,
    tokens: 5600,
    docs: 12,
    storage: 15.6
  }
})

const showPwd = ref(false)
const pwd = ref({ old: '', new: '', confirm: '' })

const tokenWords = computed(() => {
  return `约 ${(profile.value.stats.tokens * 0.75 / 10000).toFixed(1)} 万字`
})

const updateUsername = async () => {
  try {
    await updateUserInfo({ username: profile.value.username })
    
    // 重新获取用户信息并更新 store
    try {
      const response = await getUserInfo()
      if (response.data && response.data.data) {
        store.commit('auth/SET_USER_INFO', response.data.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
    
    ElMessage.success('用户名已保存')
  } catch (error) {
    ElMessage.error('更新失败: ' + (error.message || '未知错误'))
  }
}

const sendCode = async () => {
  if (!profile.value.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  
  try {
    await sendVerificationCode({ email: profile.value.email, purpose: 'update_email' })
    ElMessage.success('验证码已发送')
  } catch (error) {
    ElMessage.error('发送失败: ' + (error.message || '未知错误'))
    
  }
}

const updateEmail = async () => {
  try {
    await updateUserInfo({ email: profile.value.email, code: profile.value.code })
    ElMessage.success('邮箱已更换')
    
    // 重新获取用户信息并更新 store
    try {
      const response = await getUserInfo()
      if (response.data && response.data.data) {
        store.commit('auth/SET_USER_INFO', response.data.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  } catch (error) {
    // 显示具体的错误信息
    let errorMsg = '更新失败'
    if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    } else if (error.message) {
      errorMsg = error.message
    }
    
    ElMessage.error(errorMsg)
  }
}

const updatePwd = async () => {
  try {
    await changePassword({
      old_password: pwd.value.old,
      new_password: pwd.value.new
    })
    ElMessage.success('密码修改成功')
    showPwd.value = false
  } catch (error) {
    ElMessage.error('修改失败: ' + (error.message || '未知错误'))
  }
}

// ========== 系统设置数据 ==========
const settings = ref({
  maxResponseLength: 2048,
  historyRetention: '30'
})

const saving = ref(false)
const lastSavedTime = ref('刚刚')

const mockConversations = ref([
  {
    id: 1,
    timestamp: new Date().toISOString(),
    user: '如何学习 Vue3？',
    assistant: '从 Composition API 开始，配合官方文档与实战项目。'
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    user: 'Promise 是什么？',
    assistant: 'Promise 是用于处理异步操作的对象。'
  }
])

const saveSettings = async () => {
  saving.value = true
  await new Promise(r => setTimeout(r, 1000))
  localStorage.setItem('userSettings', JSON.stringify(settings.value))
  lastSavedTime.value = new Date().toLocaleTimeString()
  ElMessage.success('设置保存成功')
  saving.value = false
}

const exportData = (format) => {
  const data =
    format === 'json'
      ? JSON.stringify(mockConversations.value, null, 2)
      : mockConversations.value
          .map((c, i) => `对话 ${i + 1}\n${c.user}\n${c.assistant}\n`)
          .join('\n')

  const blob = new Blob([data], {
    type: format === 'json' ? 'application/json' : 'text/plain'
  })

  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `conversations.${format}`
  a.click()

  ElMessage.success(`已导出为 ${format.toUpperCase()}`)
}

onMounted(() => {
  const saved = localStorage.getItem('userSettings')
  if (saved) settings.value = JSON.parse(saved)
})
</script>

<style scoped>
.profile-settings-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  background: #f5f7fa;
}

/* 设置区块 */
.setting-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 区块头部 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: #f8fafc;
  border-bottom: 1px solid #e8eef5;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.section-header:hover {
  background: #f1f5f9;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

.toggle-icon {
  font-size: 20px;
  color: #666;
  transition: transform 0.3s ease;
}

/* 区块内容 */
.section-content {
  padding: 28px;
  border-top: 1px solid #f0f4f8;
}

/* 表单样式 */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.input-with-btn {
  display: flex;
  gap: 16px;
}

.input-with-btn .el-input {
  flex: 1;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid #dbeafe;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a73e8;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #555;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 14px;
  color: #888;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid #f0f4f8;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info label {
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin-bottom: 8px;
  display: block;
}

.setting-info p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.unit {
  font-size: 16px;
  font-weight: 600;
  color: #1a73e8;
}

/* 导出区域 */
.export-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 28px;
}

.export-info p {
  font-size: 16px;
  color: #555;
  margin-bottom: 16px;
  margin: 0 0 16px 0;
}

.export-meta {
  font-size: 14px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-buttons {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.export-buttons .el-button {
  flex: 1;
  height: 52px;
  font-size: 18px;
  border-radius: 12px;
}

/* 保存区域 */
.save-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 16px;
  border: 1px solid #bbf7d0;
  margin-top: 8px;
}

.save-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.save-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

.save-time {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0 0;
}

.save-section .el-button {
  height: 52px;
  padding: 0 32px;
  font-size: 18px;
  border-radius: 12px;
}

/* 密码表单 */
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pwd-form .el-input {
  font-size: 16px;
}

.el-dialog__title {
  font-size: 20px;
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  padding: 20px 24px;
}

.el-dialog__footer .el-button {
  font-size: 16px;
  padding: 0 24px;
  height: 48px;
}

/* Element Plus 样式覆盖 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  border: none;
  font-size: 16px;
  height: 52px;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

:deep(.el-button--primary.is-plain) {
  background: white;
  border: 1px solid #1a73e8;
  color: #1a73e8;
  font-size: 16px;
  height: 52px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  font-size: 16px;
  height: 52px;
}

:deep(.el-input-number) {
  border-radius: 12px;
  font-size: 16px;
  height: 52px;
}

:deep(.el-select) {
  font-size: 16px;
  height: 52px;
}

:deep(.el-input__inner) {
  font-size: 16px;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-settings-container {
    padding: 20px;
    gap: 16px;
  }

  .section-header {
    padding: 20px 16px;
  }

  .section-content {
    padding: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .form-group label {
    font-size: 16px;
  }

  .input-with-btn {
    flex-direction: column;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 14px;
  }

  .export-buttons {
    flex-direction: column;
  }

  .save-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  :deep(.el-button--primary),
  :deep(.el-button--primary.is-plain) {
    height: 48px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-input-number),
  :deep(.el-select) {
    height: 48px;
  }
}
</style>
