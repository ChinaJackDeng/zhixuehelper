<template>
  <div>
    <el-card>
      <template #header><span>创建触达活动</span></template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" maxlength="60" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" maxlength="300" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 180px">
            <el-option label="系统" value="system" />
            <el-option label="学习分析" value="analytics" />
            <el-option label="考试" value="exam" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="form.level" style="width: 180px">
            <el-option label="信息" value="info" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标角色">
          <el-checkbox-group v-model="form.target_roles">
            <el-checkbox label="user">user</el-checkbox>
            <el-checkbox label="admin">admin</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="活跃天数">
          <el-input-number v-model="form.recent_active_days" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="发送方式">
          <el-radio-group v-model="form.send_mode">
            <el-radio label="immediate">立即发送</el-radio>
            <el-radio label="scheduled">定时发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="定时时间" v-if="form.send_mode === 'scheduled'">
          <el-date-picker v-model="scheduledAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="creating" @click="createCampaign">创建活动</el-button>
          <el-button @click="loadCampaigns">刷新列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="panel">
      <template #header>
        <div class="summary">
          <span>触达活动</span>
          <span>活动数 {{ summary.total_campaigns }} / 送达 {{ summary.total_delivered }}</span>
        </div>
      </template>
      <el-table :data="campaigns">
        <el-table-column prop="id" label="活动ID" width="90" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="目标人数" width="110">
          <template #default="{ row }">{{ row.target_user_ids?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="delivered_count" label="送达数" width="100" />
        <el-table-column prop="send_mode" label="发送方式" width="110" />
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createNotificationCampaign, getNotificationCampaigns } from '@/api/admin'

const creating = ref(false)
const scheduledAt = ref('')
const campaigns = ref([])
const summary = reactive({
  total_campaigns: 0,
  total_delivered: 0
})
const form = reactive({
  title: '',
  content: '',
  category: 'system',
  level: 'info',
  target_roles: ['user'],
  recent_active_days: 30,
  send_mode: 'immediate'
})

const loadCampaigns = async () => {
  const data = await getNotificationCampaigns()
  campaigns.value = data?.items || []
  Object.assign(summary, data?.summary || {})
}

const createCampaign = async () => {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  creating.value = true
  try {
    await createNotificationCampaign({
      ...form,
      scheduled_at: form.send_mode === 'scheduled' ? scheduledAt.value : null
    })
    ElMessage.success('触达活动已创建')
    form.title = ''
    form.content = ''
    await loadCampaigns()
  } finally {
    creating.value = false
  }
}

onMounted(loadCampaigns)
</script>

<style scoped>
.panel {
  margin-top: 16px;
}
.summary {
  display: flex;
  justify-content: space-between;
}
</style>
