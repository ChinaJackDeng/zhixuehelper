<template>
  <div class="logs-container">
    <el-row :gutter="12" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_logs }}</div>
          <div class="stat-label">总日志</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.ai_usage_count }}</div>
          <div class="stat-label">AI 使用</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(stats.total_tokens) }}</div>
          <div class="stat-label">消耗 Token</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ aiStats.total_calls }}</div>
          <div class="stat-label">AI 调用</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <div class="header-row">
          <span style="font-size: 14px">日志列表</span>
          <div class="header-actions">
            <el-select v-model="filters.logType" placeholder="类型" clearable size="small" style="width: 110px" @change="handleFilterChange">
              <el-option label="AI使用" value="ai_usage" />
              <el-option label="用户操作" value="user_action" />
              <el-option label="认证" value="auth" />
              <el-option label="系统" value="system" />
            </el-select>
            <el-input v-model="filters.action" placeholder="操作" clearable size="small" style="width: 100px" @clear="handleFilterChange" />
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              value-format="YYYY-MM-DD HH:mm:ss"
              size="small"
              style="width: 220px"
              @change="handleFilterChange"
            />
            <el-button size="small" @click="handleReset">重置</el-button>
            <el-button type="primary" size="small" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="logs" v-loading="loading" size="small" stripe style="font-size: 12px">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户" min-width="100">
          <template #default="{ row }">
            {{ row.username || (row.user_id ? `U${row.user_id}` : '系统') }}
          </template>
        </el-table-column>
        <el-table-column prop="log_type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTag(row.log_type)" size="small">{{ getLogTypeName(row.log_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="110" />
        <el-table-column prop="model" label="模型" width="90">
          <template #default="{ row }">{{ row.model || '-' }}</template>
        </el-table-column>
        <el-table-column label="Token" width="90">
          <template #default="{ row }">
            <span v-if="row.log_type === 'ai_usage'">{{ row.total_tokens || '-' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" min-width="140">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="详情" width="70" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          :page-sizes="[20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border size="small" v-if="currentLog">
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLog.username || (currentLog.user_id ? `U${currentLog.user_id}` : '系统') }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getLogTypeName(currentLog.log_type) }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="模型" :span="2">{{ currentLog.model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="输入Token">{{ currentLog.input_tokens }}</el-descriptions-item>
        <el-descriptions-item label="输出Token">{{ currentLog.output_tokens }}</el-descriptions-item>
        <el-descriptions-item label="总Token">{{ currentLog.total_tokens }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'" size="small">{{ currentLog.status === 'success' ? '成功' : '失败' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详情" :span="2">{{ currentLog.detail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误" :span="2" v-if="currentLog.error_message">
          <span style="color: #f56c6c">{{ currentLog.error_message }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatTime(currentLog.created_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button size="small" @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminLogStats, getAdminAILogsStats, getAdminLogHistory, exportAdminLogs } from '@/api/admin'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(30)

const stats = reactive({ total_logs: 0, ai_usage_count: 0, total_tokens: 0 })
const aiStats = reactive({ total_calls: 0, total_input_tokens: 0, total_output_tokens: 0, unique_users: 0 })
const filters = reactive({ logType: '', action: '', dateRange: [] })
const detailVisible = ref(false)
const currentLog = ref(null)

const formatNumber = (num) => {
  if (!num) return 0
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getLogTypeName = (type) => ({ ai_usage: 'AI使用', user_action: '用户操作', auth: '认证', system: '系统' }[type] || type)
const getLogTypeTag = (type) => ({ ai_usage: 'primary', user_action: 'warning', auth: 'info', system: '' }[type] || '')
const unwrapData = (res) => {
  if (res?.data?.data !== undefined) return res.data.data
  if (res?.data !== undefined && !Array.isArray(res.data) && typeof res.data === 'object') return res.data
  return res
}

const loadStats = async () => {
  try {
    const res = await getAdminLogStats()
    Object.assign(stats, unwrapData(res) || {})
  } catch (e) { console.error('加载统计失败', e) }
}

const loadAIStats = async () => {
  try {
    const res = await getAdminAILogsStats()
    Object.assign(aiStats, unwrapData(res) || {})
  } catch (e) { console.error('加载AI统计失败', e) }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.logType) params.log_type = filters.logType
    if (filters.action) params.action = filters.action
    if (filters.dateRange?.length === 2) { params.start_date = filters.dateRange[0]; params.end_date = filters.dateRange[1] }

    const res = await getAdminLogHistory(params)
    const data = unwrapData(res) || {}
    logs.value = data.logs || []
    total.value = data.total || 0
  } catch (e) {
    console.error('加载日志失败', e)
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => { page.value = 1; loadLogs() }
const handleReset = () => { filters.logType = ''; filters.action = ''; filters.dateRange = []; page.value = 1; loadLogs() }
const handlePageChange = (p) => { page.value = p; loadLogs() }
const handleSizeChange = (s) => { pageSize.value = s; page.value = 1; loadLogs() }
const showDetail = (row) => { currentLog.value = row; detailVisible.value = true }

const handleExport = async () => {
  try {
    const params = {}
    if (filters.logType) params.log_type = filters.logType
    const res = await exportAdminLogs(params)
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin_logs_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) { console.error('导出失败', e); ElMessage.error('导出失败') }
}

onMounted(() => { loadStats(); loadAIStats(); loadLogs() })
</script>

<style scoped>
.logs-container { padding: 12px; }
.stats-row { margin-bottom: 12px; }
.stat-card { background: #f5f7fa; border-radius: 4px; padding: 12px; text-align: center; }
.stat-value { font-size: 18px; font-weight: bold; color: #409eff; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.table-card { font-size: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.header-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.pager-wrap { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
