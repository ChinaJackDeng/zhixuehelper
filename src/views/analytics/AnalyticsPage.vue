<template>
  <div v-loading="loading" class="learning-dashboard">
    <div class="dashboard-header card-base">
      <div class="header-left">
        <h1 class="dashboard-title">学习分析看板</h1>
        <p class="dashboard-subtitle">通过趋势、结构与薄弱点诊断，持续追踪学习质量并生成周期性学习报告</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="currentWeek" size="default">
          <el-radio-button :label="'current'">本周</el-radio-button>
          <el-radio-button :label="'last'">上周</el-radio-button>
          <el-radio-button :label="'custom'">近30天</el-radio-button>
        </el-radio-group>
        <el-select v-model="reportCycle" class="cycle-select" size="default">
          <el-option label="周报" value="weekly" />
          <el-option label="月报" value="monthly" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="regenerateReport">生成报告</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card card-base" v-for="item in overviewStats" :key="item.title">
        <div class="stat-top">
          <span class="stat-title">{{ item.title }}</span>
          <el-tag :type="item.trend >= 0 ? 'success' : 'danger'" effect="light" size="small">
            {{ item.trendLabel }}
          </el-tag>
        </div>
        <div class="stat-value">{{ item.display }}</div>
        <el-progress
          :percentage="item.progress"
          :stroke-width="10"
          :show-text="false"
          :color="item.trend >= 0 ? '#2563eb' : '#f97316'"
        />
      </div>
    </div>

    <div class="content-layout">
      <div class="main-column">
        <el-card shadow="never" class="card-base panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3 class="panel-title">学习趋势</h3>
                <p class="panel-subtitle">支持刷题量、学习时长与正确率趋势对比</p>
              </div>
              <div class="trend-tools">
                <el-radio-group v-model="trendMetric" size="small">
                  <el-radio-button
                    v-for="option in trendMetricOptions"
                    :key="option.value"
                    :label="option.value"
                  >
                    {{ option.label }}
                  </el-radio-button>
                </el-radio-group>
                <el-switch
                  v-model="showCompare"
                  inline-prompt
                  active-text="双线"
                  inactive-text="单线"
                />
              </div>
            </div>
          </template>
          <div ref="trendChartRef" class="trend-chart"></div>
        </el-card>

        <div class="diagnosis-grid">
          <el-card shadow="never" class="card-base panel-card">
            <template #header>
              <div class="panel-header simple">
                <h3 class="panel-title">知识点掌握雷达图</h3>
              </div>
            </template>
            <div ref="radarChartRef" class="radar-chart"></div>
            <div class="radar-legend">
              <div class="legend-item" v-for="item in radarData" :key="item.name">
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-score" :class="{ weak: item.score < 60 }">{{ item.score }}分</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="card-base panel-card">
            <template #header>
              <div class="panel-header simple">
                <h3 class="panel-title">错题与薄弱点</h3>
              </div>
            </template>
            <div class="wrong-list">
              <div class="wrong-item" v-for="item in wrongDistData" :key="item.name">
                <div class="wrong-row">
                  <span class="wrong-name">{{ item.name }}</span>
                  <span class="wrong-percent">{{ item.percentage }}%</span>
                </div>
                <el-progress :percentage="item.percentage" :stroke-width="10" :show-text="false" />
              </div>
            </div>
            <el-divider />
            <div class="weak-list">
              <div class="weak-item" v-for="item in weaknessData" :key="item.name">
                <div>
                  <div class="weak-title">{{ item.name }} 正确率 {{ item.rate }}%</div>
                  <div class="weak-sub">建议专项练习 {{ item.suggest }} 题</div>
                </div>
                <el-button type="primary" link @click="goPracticeFromWeakness(item)">去练习</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <aside class="report-column">
        <el-card shadow="never" class="card-base report-card">
          <div class="report-header">
            <el-icon class="report-icon"><ChatDotRound /></el-icon>
            <div>
              <h3 class="report-title">{{ reportTitle }}</h3>
              <p class="report-meta">自动生成时间：{{ generatedAtText }}</p>
            </div>
          </div>
          <el-divider />
          <div class="report-section" v-for="section in reportSections" :key="section.title">
            <h4 class="report-section-title">{{ section.title }}</h4>
            <ul class="report-list">
              <li v-for="line in section.items" :key="line">{{ line }}</li>
            </ul>
          </div>
          <div v-if="reportList.length > 0" class="report-section">
            <h4 class="report-section-title">历史报告</h4>
            <ul class="report-list">
              <li v-for="item in reportList" :key="item.id">
                <el-button link type="primary" @click="selectReport(item.id)">
                  {{ item.title }}
                </el-button>
              </li>
            </ul>
          </div>
          <div class="report-actions">
            <el-button text type="primary" @click="regenerateReport">重新生成</el-button>
            <el-button type="primary" plain @click="exportReport">导出数据</el-button>
          </div>
        </el-card>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { analyticsApi } from '@/api/analytics'

const router = useRouter()
const currentWeek = ref('current')
const trendMetric = ref('questions')
const showCompare = ref(true)
const reportCycle = ref('weekly')
const generatedAt = ref(new Date())
const trendChartRef = ref(null)
const radarChartRef = ref(null)
const loading = ref(false)
const personalizedSuggestions = ref([])
const reportList = ref([])
const activeReport = ref(null)

const trendMetricOptions = [
  { label: '刷题量', value: 'questions' },
  { label: '学习时长', value: 'duration' },
  { label: '正确率', value: 'accuracy' }
]

const createDefaultPeriod = (label, days = []) => ({
  label,
  days,
  kpi: { duration: 0, questions: 0, accuracy: 0, completed: 0 },
  trend: { questions: [], duration: [], accuracy: [] },
  radar: [],
  wrong: [{ name: '暂无数据', percentage: 0 }],
  weakness: [{ name: '暂无薄弱知识点', rate: 0, suggest: 0 }]
})

const dashboardData = reactive({
  current: createDefaultPeriod('本周', ['周一', '周二', '周三', '周四', '周五', '周六', '周日']),
  last: createDefaultPeriod('上周', ['周一', '周二', '周三', '周四', '周五', '周六', '周日']),
  custom: createDefaultPeriod('近30天', [])
})

const dataByKey = computed(() => dashboardData[currentWeek.value] || dashboardData.current)
const compareData = computed(() => {
  if (currentWeek.value === 'current') return dashboardData.last
  if (currentWeek.value === 'last') return dashboardData.custom
  return dashboardData.last
})

const radarData = computed(() => dataByKey.value.radar || [])
const wrongDistData = computed(() => dataByKey.value.wrong || [])
const weaknessData = computed(() => dataByKey.value.weakness || [])

const metricConfigMap = {
  questions: { name: '刷题量', unit: '题', color: '#2563eb' },
  duration: { name: '学习时长', unit: '小时', color: '#0ea5e9' },
  accuracy: { name: '正确率', unit: '%', color: '#14b8a6' }
}

const questionTypeLabelMap = {
  single: '单选题',
  multi: '多选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  essay: '简答题'
}

const formatMistakeTypeName = (rawName) => {
  const key = String(rawName || '').trim().toLowerCase()
  return questionTypeLabelMap[key] || String(rawName || '未知题型')
}

const formatTrend = (value) => (value >= 0 ? `+${value}%` : `${value}%`)
const calcTrend = (currentValue, previousValue) => {
  if (!previousValue) return 0
  return Math.round(((currentValue - previousValue) / previousValue) * 100)
}

const normalizeFloat = (value, precision = 1) => {
  const n = Number(value || 0)
  const base = 10 ** precision
  return Math.round(n * base) / base
}

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return '-'
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const formatDateLabel = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const month = `${date.getMonth() + 1}`
  const day = `${date.getDate()}`
  return `${month}/${day}`
}

const overviewStats = computed(() => {
  const current = dataByKey.value.kpi
  const previous = compareData.value.kpi
  return [
    {
      title: '学习时长',
      display: `${current.duration}小时`,
      trend: calcTrend(current.duration, previous.duration),
      progress: Math.min(100, Math.round((current.duration / 16) * 100))
    },
    {
      title: '刷题量',
      display: `${current.questions}题`,
      trend: calcTrend(current.questions, previous.questions),
      progress: Math.min(100, Math.round((current.questions / 200) * 100))
    },
    {
      title: '平均正确率',
      display: `${current.accuracy}%`,
      trend: calcTrend(current.accuracy, previous.accuracy),
      progress: Math.max(0, Math.min(100, current.accuracy))
    },
    {
      title: '完成知识点',
      display: `${current.completed}个`,
      trend: calcTrend(current.completed, previous.completed),
      progress: Math.min(100, Math.round((current.completed / 40) * 100))
    }
  ].map((item) => ({ ...item, trendLabel: formatTrend(item.trend) }))
})

const reportTitle = computed(() => {
  if (activeReport.value?.title) return activeReport.value.title
  const cycleLabel = reportCycle.value === 'weekly' ? '周度学习报告' : '月度学习报告'
  return `${dataByKey.value.label}${cycleLabel}`
})

const generatedAtText = computed(() => formatDateTime(activeReport.value?.generated_at || generatedAt.value))

const reportSections = computed(() => {
  const report = activeReport.value
  const fallbackKpi = dataByKey.value?.kpi || { questions: 0, duration: 0, accuracy: 0, completed: 0 }
  const previous = compareData.value?.kpi || { questions: 0, duration: 0, accuracy: 0, completed: 0 }
  const reportStats = report?.stats_data || report?.content?.stats || {}
  const kpi = {
    questions: Number(reportStats.questions ?? fallbackKpi.questions ?? 0),
    duration: Number(reportStats.duration ?? fallbackKpi.duration ?? 0),
    accuracy: Number(reportStats.accuracy ?? fallbackKpi.accuracy ?? 0),
    completed: Number(fallbackKpi.completed ?? 0)
  }
  const suggestions = Array.isArray(report?.suggestions) && report.suggestions.length > 0
    ? report.suggestions
    : personalizedSuggestions.value.length > 0
      ? personalizedSuggestions.value
      : ['完成更多练习后即可获得个性化学习建议']
  const summary = report?.summary || ''
  const period = report?.content?.period
  const periodLine = period?.start && period?.end ? `报告周期：${period.start} 至 ${period.end}` : `${dataByKey.value?.label || '本周'}学习情况`

  return [
    {
      title: '量化分析',
      items: [
        periodLine,
        `累计刷题 ${kpi.questions} 题，较对比周期变化 ${formatTrend(calcTrend(kpi.questions, previous.questions))}`,
        `学习总时长 ${kpi.duration} 小时，平均正确率 ${kpi.accuracy}%`,
        summary || `完成知识点 ${kpi.completed} 个，学习覆盖面持续扩展`
      ]
    },
    {
      title: '个性化建议',
      items: suggestions
    }
  ]
})

let trendChartInstance = null
let radarChartInstance = null

const normalizeTrendPayload = (payload) => {
  const labels = Array.isArray(payload?.labels) ? payload.labels.map(formatDateLabel) : []
  const questions = Array.isArray(payload?.questions) ? payload.questions.map((v) => Number(v || 0)) : []
  const duration = Array.isArray(payload?.duration) ? payload.duration.map((v) => normalizeFloat((Number(v || 0)) / 60, 1)) : []
  const accuracy = Array.isArray(payload?.accuracy) ? payload.accuracy.map((v) => Number(v || 0)) : []
  return { labels, questions, duration, accuracy }
}

const normalizeReportList = (list) => {
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && item.id)
    .map((item) => ({
      id: item.id,
      title: item.title || '学习报告',
      report_type: item.report_type || reportCycle.value,
      summary: item.summary || '',
      generated_at: item.generated_at,
      content: item.content || {}
    }))
}

const normalizeWeakPoints = (weakPoints = []) => {
  if (!Array.isArray(weakPoints) || weakPoints.length === 0) {
    return [{ name: '暂无薄弱知识点', rate: 0, suggest: 0 }]
  }
  return weakPoints.slice(0, 5).map((item) => {
    const score = Number(item?.score ?? item?.mastery ?? 0)
    return {
      name: item?.name || '未知知识点',
      rate: Math.max(0, Math.min(100, Math.round(score))),
      suggest: Math.max(5, Math.round((80 - score) / 5))
    }
  })
}

const assignTrendByPeriod = (target, trendData) => {
  dashboardData[target].days = trendData.labels
  dashboardData[target].trend.questions = trendData.questions
  dashboardData[target].trend.duration = trendData.duration
  dashboardData[target].trend.accuracy = trendData.accuracy
}

const buildPeriodFromDailyRecords = (records = []) => {
  const labels = records.map((item) => formatDateLabel(item.record_date))
  return {
    labels,
    questions: records.map((item) => Number(item.questions_count || 0)),
    duration: records.map((item) => normalizeFloat(Number(item.duration_minutes || 0) / 60, 1)),
    accuracy: records.map((item) => Number(item.accuracy || 0))
  }
}

const renderTrendChart = () => {
  if (!trendChartInstance) return
  const currentTrend = dataByKey.value?.trend || {}
  const compareTrend = compareData.value?.trend || {}
  const currentSeries = currentTrend[trendMetric.value] || []
  const previousSeries = compareTrend[trendMetric.value] || []
  const metric = metricConfigMap[trendMetric.value]
  const series = [
    {
      name: `${dataByKey.value?.label || '本周'}${metric.name}`,
      type: 'line',
      smooth: true,
      data: currentSeries,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: metric.color },
      itemStyle: { color: metric.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${metric.color}55` },
          { offset: 1, color: `${metric.color}0d` }
        ])
      }
    }
  ]

  if (showCompare.value) {
    series.push({
      name: `${compareData.value?.label || '上周'}${metric.name}`,
      type: 'line',
      smooth: true,
      data: previousSeries,
      symbol: 'emptyCircle',
      symbolSize: 6,
      lineStyle: { width: 2, type: 'dashed', color: '#94a3b8' },
      itemStyle: { color: '#94a3b8' }
    })
  }

  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: '#475569', fontSize: 12 } },
    grid: { left: '4%', right: '4%', bottom: '4%', top: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: dataByKey.value?.days || [],
      axisLabel: { color: '#64748b', fontSize: 12 },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        formatter: (value) => `${value}${metric.unit === '小时' ? 'h' : metric.unit}`
      },
      splitLine: { lineStyle: { color: '#eef2ff' } }
    },
    series
  })
}

const renderRadarChart = () => {
  if (!radarChartInstance) return
  const radar = radarData.value || []
  if (radar.length === 0) {
    radarChartInstance.setOption({
      title: { text: '暂无知识点数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } },
      series: []
    })
    return
  }
  radarChartInstance.setOption({
    radar: {
      indicator: radar.map((item) => ({ name: item.name, max: 100 })),
      radius: '62%',
      splitNumber: 5,
      axisName: { color: '#475569', fontSize: 12 },
      splitLine: { lineStyle: { color: '#dbeafe' } },
      splitArea: { show: true, areaStyle: { color: ['#eff6ff', '#f8fafc'] } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radar.map((item) => item.score),
            name: `${dataByKey.value?.label || '本周'}掌握度`,
            areaStyle: { color: 'rgba(37, 99, 235, 0.2)' },
            lineStyle: { color: '#2563eb', width: 2 },
            itemStyle: { color: '#2563eb' }
          }
        ]
      }
    ]
  })
}

const loadReports = async () => {
  try {
    const list = await analyticsApi.getReports(reportCycle.value, 10)
    reportList.value = normalizeReportList(list)
    if (reportList.value.length === 0) {
      activeReport.value = null
      return
    }
    const firstId = activeReport.value?.id || reportList.value[0].id
    await selectReport(firstId, false)
  } catch (error) {
    console.error('加载报告列表失败:', error)
    reportList.value = []
    activeReport.value = null
  }
}

const selectReport = async (reportId, notify = true) => {
  try {
    const detail = await analyticsApi.getReportDetail(reportId)
    activeReport.value = detail || null
    if (activeReport.value?.generated_at) {
      generatedAt.value = new Date(activeReport.value.generated_at)
    } else {
      generatedAt.value = new Date()
    }
    if (notify) ElMessage.success('已切换报告')
  } catch (error) {
    console.error('报告详情加载失败:', error)
    ElMessage.error('报告加载失败，请重试')
  }
}

const regenerateReport = async () => {
  try {
    loading.value = true
    const response = await analyticsApi.generateReport(reportCycle.value)
    const generated = Boolean(response?.success) || Boolean(response?.report_id)
    if (!generated) {
      throw new Error('报告生成失败')
    }
    ElMessage.success(response?.message || '报告生成成功')
    if (response?.report_id) {
      await selectReport(response.report_id, false)
    }
    await loadAnalyticsData(false)
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error(error?.message || '生成报告失败，请重试')
  } finally {
    loading.value = false
  }
}

const loadSuggestions = async () => {
  try {
    const suggestionsRes = await analyticsApi.getSuggestions()
    const suggestions = Array.isArray(suggestionsRes?.suggestions) ? suggestionsRes.suggestions : []
    personalizedSuggestions.value = suggestions.length > 0 ? suggestions : ['完成更多练习后即可获得个性化学习建议']
    const normalizedWeakData = normalizeWeakPoints(suggestionsRes?.weak_points)
    dashboardData.current.weakness = normalizedWeakData
    dashboardData.last.weakness = normalizedWeakData
    dashboardData.custom.weakness = normalizedWeakData
  } catch (error) {
    console.error('加载个性化建议失败:', error)
    personalizedSuggestions.value = ['完成更多练习后即可获得个性化学习建议']
    const fallbackWeakness = [{ name: '暂无薄弱知识点', rate: 0, suggest: 0 }]
    dashboardData.current.weakness = fallbackWeakness
    dashboardData.last.weakness = fallbackWeakness
    dashboardData.custom.weakness = fallbackWeakness
  }
}

const loadAnalyticsData = async (showMessage = true) => {
  loading.value = true
  try {
    const [statsRes, weeklyTrendRes, monthlyTrendRes, records14Res, masteryRes, mistakeDistRes] = await Promise.all([
      analyticsApi.getStats(),
      analyticsApi.getTrendData('week'),
      analyticsApi.getTrendData('month'),
      analyticsApi.getDailyRecords(14),
      analyticsApi.getKnowledgeMastery(),
      analyticsApi.getMistakeDistribution()
    ])

    const stats = statsRes || {}
    dashboardData.current.kpi = {
      duration: normalizeFloat(Number(stats.duration_this_week || 0) / 60, 1),
      questions: Number(stats.questions_this_week || 0),
      accuracy: Math.round(Number(stats.accuracy_this_week || 0)),
      completed: Number(stats.mastered_count || 0)
    }
    dashboardData.custom.kpi = {
      duration: normalizeFloat(Number(stats.duration_this_month || 0) / 60, 1),
      questions: Number(stats.questions_this_month || 0),
      accuracy: Math.round(Number(stats.accuracy_this_month || 0)),
      completed: Number(stats.mastered_count || 0)
    }

    const weekTrend = normalizeTrendPayload(weeklyTrendRes)
    const monthTrend = normalizeTrendPayload(monthlyTrendRes)
    assignTrendByPeriod('current', weekTrend)
    assignTrendByPeriod('custom', monthTrend)

    const records14 = Array.isArray(records14Res) ? records14Res : []
    const lastSeven = records14.slice(0, Math.max(0, records14.length - 7))
    const lastTrend = buildPeriodFromDailyRecords(lastSeven)
    assignTrendByPeriod('last', lastTrend)
    dashboardData.last.kpi = {
      duration: normalizeFloat(lastTrend.duration.reduce((sum, item) => sum + item, 0), 1),
      questions: lastTrend.questions.reduce((sum, item) => sum + item, 0),
      accuracy: lastTrend.questions.length > 0 ? Math.round(lastTrend.accuracy.reduce((sum, item) => sum + item, 0) / lastTrend.accuracy.length) : 0,
      completed: Number(stats.mastered_count || 0)
    }

    const mastery = Array.isArray(masteryRes) ? masteryRes : []
    dashboardData.current.radar = mastery.slice(0, 5).map((item) => ({
      name: item.name,
      score: Math.round(Number(item.score || 0))
    }))
    dashboardData.last.radar = dashboardData.current.radar
    dashboardData.custom.radar = dashboardData.current.radar

    const fallbackWeakness = [{ name: '暂无薄弱知识点', rate: 0, suggest: 0 }]
    dashboardData.current.weakness = fallbackWeakness
    dashboardData.last.weakness = fallbackWeakness
    dashboardData.custom.weakness = fallbackWeakness

    const mistakeDist = mistakeDistRes && typeof mistakeDistRes === 'object'
      ? mistakeDistRes
      : stats.mistake_distribution || {}
    const wrongList = Object.entries(mistakeDist)
      .map(([name, info]) => ({ name: formatMistakeTypeName(name), percentage: Number(info?.percentage || 0) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
    const normalizedWrong = wrongList.length > 0 ? wrongList : [{ name: '暂无数据', percentage: 0 }]
    dashboardData.current.wrong = normalizedWrong
    dashboardData.last.wrong = normalizedWrong
    dashboardData.custom.wrong = normalizedWrong

    await nextTick()
    renderTrendChart()
    renderRadarChart()
    if (showMessage) ElMessage.success('学习分析数据已更新')
    await Promise.all([loadReports(), loadSuggestions()])
  } catch (error) {
    console.error('加载学习数据失败:', error)
    ElMessage.error('加载学习分析失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

const exportReport = async (format = 'csv') => {
  try {
    ElMessage.info('正在导出数据...')
    const period = reportCycle.value === 'monthly' ? 'month' : 'week'
    const response = await analyticsApi.exportData(format, period)
    const blob = response instanceof Blob
      ? response
      : new Blob([response], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `learning_data_${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const goPracticeFromWeakness = (item) => {
  const keyword = item?.name || ''
  router.push({ path: '/practice', query: keyword ? { keyword } : {} })
}

const resizeCharts = () => {
  if (trendChartInstance) trendChartInstance.resize()
  if (radarChartInstance) radarChartInstance.resize()
}

const initCharts = () => {
  if (trendChartRef.value && !trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }
  if (radarChartRef.value && !radarChartInstance) {
    radarChartInstance = echarts.init(radarChartRef.value)
  }
  renderTrendChart()
  renderRadarChart()
}

onMounted(() => {
  nextTick(async () => {
    initCharts()
    await loadAnalyticsData(false)
  })
  window.addEventListener('resize', resizeCharts)
})

watch([currentWeek, trendMetric, showCompare], () => {
  nextTick(() => {
    renderTrendChart()
    renderRadarChart()
  })
})

watch(reportCycle, async () => {
  activeReport.value = null
  await loadReports()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  if (trendChartInstance) trendChartInstance.dispose()
  if (radarChartInstance) radarChartInstance.dispose()
})
</script>

<style scoped>
.learning-dashboard {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-base {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.header-left {
  max-width: 680px;
}

.dashboard-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #0f172a;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cycle-select {
  width: 100px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 14px;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-title {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 10px;
}

.content-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}

.main-column {
  min-width: 0;
}

.report-column {
  min-width: 0;
}

.panel-card {
  margin-bottom: 16px;
}

:deep(.panel-card .el-card__header) {
  border-bottom: 1px solid #eef2ff;
  padding: 14px 16px;
}

:deep(.panel-card .el-card__body) {
  padding: 16px;
}

.panel-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.panel-header.simple {
  grid-template-columns: 1fr;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.panel-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.trend-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.trend-chart {
  width: 100%;
  min-height: 320px;
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.radar-chart {
  min-height: 260px;
  margin-bottom: 10px;
}

.radar-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.legend-name {
  font-size: 13px;
  color: #475569;
}

.legend-score {
  font-size: 13px;
  color: #1d4ed8;
  font-weight: 600;
}

.legend-score.weak {
  color: #ef4444;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.wrong-name {
  font-size: 13px;
  color: #475569;
}

.wrong-percent {
  font-size: 13px;
  color: #1d4ed8;
  font-weight: 600;
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weak-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

.weak-title {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.weak-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.report-card {
  position: sticky;
  top: 20px;
}

:deep(.report-card .el-card__body) {
  padding: 16px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-icon {
  font-size: 22px;
  color: #1d4ed8;
}

.report-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.report-meta {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

.report-section {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  margin-bottom: 10px;
}

.report-section-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.report-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
}

.report-list li {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.report-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .report-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .learning-dashboard {
    padding: 14px;
  }

  .dashboard-header {
    padding: 14px;
  }

  .dashboard-title {
    font-size: 22px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .diagnosis-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    grid-template-columns: 1fr;
  }

  .report-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
