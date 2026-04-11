<template>
  <el-card>
    <template #header>
      <span>系统通知发布</span>
    </template>
    <el-form :model="form" label-width="100px">
      <el-form-item label="目标用户ID">
        <el-input-number v-model="form.target_user_id" :min="1" />
      </el-form-item>
      <el-form-item label="通知标题">
        <el-input v-model="form.title" maxlength="60" show-word-limit />
      </el-form-item>
      <el-form-item label="通知内容">
        <el-input v-model="form.content" type="textarea" :rows="4" maxlength="300" show-word-limit />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" style="width: 180px">
          <el-option label="系统" value="system" />
          <el-option label="学习分析" value="analytics" />
          <el-option label="考试" value="exam" />
          <el-option label="知识库" value="knowledge" />
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
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">发布通知</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { publishSystemNotification } from '@/api/admin'

const loading = ref(false)
const form = reactive({
  target_user_id: 1,
  title: '',
  content: '',
  category: 'system',
  level: 'info'
})

const submit = async () => {
  if (!form.target_user_id || !form.title || !form.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    loading.value = true
    await publishSystemNotification({
      target_user_id: form.target_user_id,
      title: form.title,
      content: form.content,
      category: form.category,
      level: form.level
    })
    ElMessage.success('通知发布成功')
    form.title = ''
    form.content = ''
  } finally {
    loading.value = false
  }
}
</script>
