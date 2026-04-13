<template>
  <div class="admin-dashboard">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">请求总数</div>
          <div class="kpi-value">{{ summary.total_requests }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">P95</div>
          <div class="kpi-value">{{ summary.p95_ms }} ms</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">2秒达标率</div>
          <div class="kpi-value">{{ summary.sla_2s_rate }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">3秒达标率</div>
          <div class="kpi-value">{{ summary.sla_3s_rate }}%</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" class="quality-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">考试样本数</div>
          <div class="kpi-value">{{ quality.total_exams }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">平均正确率</div>
          <div class="kpi-value">{{ quality.avg_correct_rate_percent }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">平均得分率</div>
          <div class="kpi-value">{{ quality.avg_score_rate_percent }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="kpi-label">准确率98%目标</div>
          <div class="kpi-value" :class="quality.accuracy_target_met ? 'kpi-pass' : 'kpi-fail'">
            {{ quality.accuracy_target_met ? '达标' : '未达标' }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>慢接口 Top</span>
          <div>
            <el-button size="small" @click="loadData">刷新</el-button>
            <el-button size="small" type="warning" @click="handleReset">重置统计</el-button>
          </div>
        </div>
      </template>
      <el-table :data="topRoutes" style="width: 100%" v-loading="loading">
        <el-table-column prop="route" label="路由" min-width="260" />
        <el-table-column prop="total_requests" label="请求数" width="100" />
        <el-table-column prop="avg_ms" label="平均耗时(ms)" width="130" />
        <el-table-column prop="p95_ms" label="P95(ms)" width="120" />
        <el-table-column prop="p99_ms" label="P99(ms)" width="120" />
        <el-table-column prop="sla_2s_rate" label="2s达标率" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPerformanceSummary, getQualitySummary, resetPerformanceSummary } from '@/api/admin'

const loading = ref(false)
const summary = reactive({
  total_requests: 0,
  p95_ms: 0,
  sla_2s_rate: 0,
  sla_3s_rate: 0
})
const quality = reactive({
  total_exams: 0,
  avg_correct_rate_percent: 0,
  avg_score_rate_percent: 0,
  accuracy_target_met: false
})
const topRoutes = ref([])

const loadData = async () => {
  try {
    loading.value = true
    const [data, qualityData] = await Promise.all([
      getPerformanceSummary(),
      getQualitySummary(7)
    ])
    const overall = data?.overall || {}
    const examQuality = qualityData?.exam_quality || {}
    summary.total_requests = overall.total_requests || 0
    summary.p95_ms = overall.p95_ms || 0
    summary.sla_2s_rate = overall.sla_2s_rate || 0
    summary.sla_3s_rate = overall.sla_3s_rate || 0
    quality.total_exams = examQuality.total_exams || 0
    quality.avg_correct_rate_percent = examQuality.avg_correct_rate_percent || 0
    quality.avg_score_rate_percent = examQuality.avg_score_rate_percent || 0
    quality.accuracy_target_met = Boolean(examQuality.accuracy_target_met)
    topRoutes.value = Array.isArray(data?.top_slow_routes) ? data.top_slow_routes : []
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  await resetPerformanceSummary()
  ElMessage.success('性能统计已重置')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.table-card {
  margin-top: 16px;
}
.quality-row {
  margin-top: 16px;
}

.kpi-label {
  color: #64748b;
  font-size: 16px;
}

.kpi-value {
  margin-top: 8px;
  font-size: 29px;
  font-weight: 700;
  color: #0f172a;
}
.kpi-pass {
  color: #16a34a;
}
.kpi-fail {
  color: #dc2626;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
