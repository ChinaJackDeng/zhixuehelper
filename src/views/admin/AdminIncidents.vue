<template>
  <div>
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card><div class="label">失败率</div><div class="value">{{ overview.failure_rate }}%</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card><div class="label">慢请求率</div><div class="value">{{ overview.slow_rate }}%</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card><div class="label">估算受影响用户</div><div class="value">{{ overview.affected_users_estimate }}</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card><div class="label">失败请求总数</div><div class="value">{{ overview.failed_requests }}</div></el-card>
      </el-col>
    </el-row>

    <el-card class="panel">
      <template #header>
        <div class="panel-header"><span>处置动作</span><el-button size="small" @click="loadData">刷新</el-button></div>
      </template>
      <div class="action-row">
        <el-select v-model="target" style="width: 160px">
          <el-option label="题目生成" value="question" />
          <el-option label="试卷生成" value="paper" />
          <el-option label="全部生成" value="all" />
        </el-select>
        <el-button type="warning" @click="handlePause">暂停</el-button>
        <el-button type="success" @click="handleResume">恢复</el-button>
        <el-input v-model="retryTaskId" placeholder="输入 task_id 重试" style="width: 280px" />
        <el-button type="primary" @click="handleRetry">重试任务</el-button>
      </div>
      <div class="paused">当前已暂停：{{ pausedText }}</div>
    </el-card>

    <el-card class="panel">
      <template #header><span>最近错误</span></template>
      <el-table :data="overview.recent_errors || []">
        <el-table-column prop="time" label="时间" min-width="180" />
        <el-table-column prop="method" label="方法" width="90" />
        <el-table-column prop="route" label="路由" min-width="220" />
        <el-table-column prop="status_code" label="状态码" width="100" />
        <el-table-column prop="duration_ms" label="耗时(ms)" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getOpsOverview, pauseGeneration, resumeGeneration, retryGenerationTask } from '@/api/admin'

const overview = reactive({
  failure_rate: 0,
  slow_rate: 0,
  affected_users_estimate: 0,
  failed_requests: 0,
  recent_errors: [],
  paused_generation_types: []
})
const target = ref('question')
const retryTaskId = ref('')

const pausedText = computed(() => {
  if (!overview.paused_generation_types?.length) return '无'
  return overview.paused_generation_types.join(', ')
})

const loadData = async () => {
  const data = await getOpsOverview()
  Object.assign(overview, data || {})
}

const handlePause = async () => {
  await pauseGeneration(target.value)
  ElMessage.success('已暂停')
  await loadData()
}

const handleResume = async () => {
  await resumeGeneration(target.value)
  ElMessage.success('已恢复')
  await loadData()
}

const handleRetry = async () => {
  if (!retryTaskId.value) {
    ElMessage.warning('请输入 task_id')
    return
  }
  await retryGenerationTask(retryTaskId.value)
  ElMessage.success('重试任务已提交')
}

onMounted(loadData)
</script>

<style scoped>
.panel {
  margin-top: 16px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.paused {
  margin-top: 12px;
  color: #606266;
}
.label {
  color: #909399;
  font-size: 13px;
}
.value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
}
</style>
