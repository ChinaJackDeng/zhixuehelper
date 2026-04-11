<template>
  <div class="ai-config-page">
    <el-card>
      <template #header>
        <div class="header-row">
          <span>AI API 配置</span>
          <el-button type="primary" :loading="loading" @click="loadConfig">刷新</el-button>
        </div>
      </template>
      <el-form :model="form" label-width="150px">
        <el-form-item label="当前 Key 状态">
          <el-tag :type="hasApiKey ? 'success' : 'warning'">{{ hasApiKey ? '已配置' : '未配置' }}</el-tag>
          <span class="hint-text">{{ apiKeyMasked || '未设置' }}</span>
        </el-form-item>
        <el-form-item label="API Base URL">
          <el-input v-model="form.base_url" placeholder="https://api.deepseek.com" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.api_key" show-password type="password" placeholder="输入新 key 时才会更新，留空不修改" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="form.model" placeholder="deepseek-chat" />
        </el-form-item>
        <el-form-item label="聊天温度">
          <el-input-number v-model="form.chat_temperature" :min="0" :max="2" :step="0.1" :precision="2" />
        </el-form-item>
        <el-form-item label="聊天最大Token">
          <el-input-number v-model="form.chat_max_tokens" :min="1" :max="8192" />
        </el-form-item>
        <el-form-item label="出题温度">
          <el-input-number v-model="form.question_temperature" :min="0" :max="2" :step="0.1" :precision="2" />
        </el-form-item>
        <el-form-item label="出题最大Token">
          <el-input-number v-model="form.question_max_tokens" :min="1" :max="8192" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminAIConfig, updateAdminAIConfig } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const hasApiKey = ref(false)
const apiKeyMasked = ref('')
const form = reactive({
  base_url: '',
  api_key: '',
  model: '',
  chat_temperature: 0.6,
  chat_max_tokens: 1200,
  question_temperature: 0.65,
  question_max_tokens: 380
})

const loadConfig = async () => {
  loading.value = true
  try {
    const data = await getAdminAIConfig()
    form.base_url = data.base_url || ''
    form.model = data.model || 'deepseek-chat'
    form.chat_temperature = Number(data.chat_temperature ?? 0.6)
    form.chat_max_tokens = Number(data.chat_max_tokens ?? 1200)
    form.question_temperature = Number(data.question_temperature ?? 0.65)
    form.question_max_tokens = Number(data.question_max_tokens ?? 380)
    form.api_key = ''
    hasApiKey.value = Boolean(data.has_api_key)
    apiKeyMasked.value = data.api_key_masked || ''
  } catch (error) {
    ElMessage.error('加载 AI 配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const payload = {
      base_url: form.base_url?.trim(),
      model: form.model?.trim(),
      chat_temperature: Number(form.chat_temperature),
      chat_max_tokens: Number(form.chat_max_tokens),
      question_temperature: Number(form.question_temperature),
      question_max_tokens: Number(form.question_max_tokens)
    }
    if (form.api_key?.trim()) payload.api_key = form.api_key.trim()
    const data = await updateAdminAIConfig(payload)
    hasApiKey.value = Boolean(data.has_api_key)
    apiKeyMasked.value = data.api_key_masked || ''
    form.api_key = ''
    ElMessage.success('AI 配置已更新')
  } catch (error) {
    ElMessage.error(error?.message || '保存配置失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint-text {
  margin-left: 12px;
  color: #64748b;
}
</style>
