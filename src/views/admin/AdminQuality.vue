<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span>题目质量总览</span>
          <div>
            <el-select v-model="days" style="width: 120px; margin-right: 8px">
              <el-option :value="7" label="近7天" />
              <el-option :value="14" label="近14天" />
              <el-option :value="30" label="近30天" />
            </el-select>
            <el-button @click="loadData">刷新</el-button>
          </div>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="8"><div class="metric">生成题目数：{{ overview.total_generated }}</div></el-col>
        <el-col :xs="24" :sm="8"><div class="metric">纠错反馈数：{{ overview.total_feedback }}</div></el-col>
        <el-col :xs="24" :sm="8"><div class="metric">失败任务数：{{ overview.failed_tasks_count }}</div></el-col>
      </el-row>
      <div class="policy-row">
        <span>下线题型：</span>
        <el-checkbox-group v-model="blockedTypes">
          <el-checkbox label="single">single</el-checkbox>
          <el-checkbox label="multi">multi</el-checkbox>
          <el-checkbox label="judge">judge</el-checkbox>
          <el-checkbox label="fill">fill</el-checkbox>
          <el-checkbox label="essay">essay</el-checkbox>
        </el-checkbox-group>
        <el-button type="primary" @click="savePolicy">保存策略</el-button>
      </div>
    </el-card>

    <el-card class="panel">
      <template #header><span>分题型质量</span></template>
      <el-table :data="overview.by_type || []">
        <el-table-column prop="question_type" label="题型" width="120" />
        <el-table-column prop="generated_count" label="生成数" width="120" />
        <el-table-column prop="feedback_count" label="纠错反馈" width="120" />
        <el-table-column prop="estimated_accuracy" label="估算准确率(%)" width="140" />
      </el-table>
    </el-card>

    <el-card class="panel">
      <template #header><span>抽检样本</span></template>
      <el-table :data="samples">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="题型" width="100" />
        <el-table-column prop="stem" label="题干" min-width="260" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getQualityOverview, getQualitySamples, updateQualityPolicy } from '@/api/admin'

const days = ref(7)
const blockedTypes = ref([])
const samples = ref([])
const overview = reactive({
  total_generated: 0,
  total_feedback: 0,
  failed_tasks_count: 0,
  by_type: [],
  blocked_question_types: []
})

const loadData = async () => {
  const data = await getQualityOverview({ days: days.value })
  Object.assign(overview, data || {})
  blockedTypes.value = Array.isArray(data?.blocked_question_types) ? data.blocked_question_types : []
  const sampleData = await getQualitySamples({ limit: 20 })
  samples.value = sampleData?.items || []
}

const savePolicy = async () => {
  await updateQualityPolicy({ blocked_question_types: blockedTypes.value })
  ElMessage.success('质量策略已更新')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.panel {
  margin-top: 16px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric {
  font-size: 14px;
  color: #303133;
}
.policy-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
