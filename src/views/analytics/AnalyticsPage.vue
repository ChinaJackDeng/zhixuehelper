<template>
  <div class="learning-dashboard">
    <div class="dashboard-header card-base">
      <div class="header-left">
        <h1 class="dashboard-title">学习分析看板</h1>
        <p class="dashboard-subtitle">通过趋势、结构与薄弱点诊断，持续追踪学习质量并生成周期性学习报告</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="currentWeek" size="default">
          <el-radio-button label="current">本周</el-radio-button>
          <el-radio-button label="last">上周</el-radio-button>
          <el-radio-button label="custom">近30天</el-radio-button>
        </el-radio-group>
        <el-select v-model="reportCycle" class="cycle-select" size="default">
          <el-option label="周报" value="weekly" />
          <el-option label="月报" value="monthly" />
        </el-select>
        <el-button type="primary" @click="regenerateReport">生成报告</el-button>
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
                <el-button type="primary" link>去练习</el-button>
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
import * as echarts from 'echarts'

const currentWeek = ref('current')
const trendMetric = ref('questions')
const showCompare = ref(true)
const reportCycle = ref('weekly')
const generatedAt = ref(new Date())
const trendChartRef = ref(null)
const radarChartRef = ref(null)

const trendMetricOptions = [
  { label: '刷题量', value: 'questions' },
  { label: '学习时长', value: 'duration' },
  { label: '正确率', value: 'accuracy' }
]

const dashboardData = reactive({
  current: {
    label: '本周',
    days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    kpi: { duration: 12.8, questions: 164, accuracy: 79, completed: 26 },
    trend: {
      questions: [18, 20, 16, 24, 26, 30, 30],
      duration: [1.3, 1.5, 1.2, 1.8, 1.9, 2.5, 2.6],
      accuracy: [72, 74, 75, 78, 80, 81, 79]
    },
    radar: [
      { name: '数学计算', score: 84 },
      { name: '逻辑推理', score: 74 },
      { name: '英语阅读', score: 88 },
      { name: '编程基础', score: 67 },
      { name: '数据结构', score: 56 }
    ],
    wrong: [
      { name: '动态规划', percentage: 68 },
      { name: '递归算法', percentage: 52 },
      { name: '图论基础', percentage: 43 },
      { name: '排序算法', percentage: 29 }
    ],
    weakness: [
      { name: '动态规划', rate: 52, suggest: 18 },
      { name: '数据结构', rate: 56, suggest: 14 },
      { name: '编程基础', rate: 67, suggest: 10 }
    ]
  },
  last: {
    label: '上周',
    days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    kpi: { duration: 10.9, questions: 137, accuracy: 74, completed: 21 },
    trend: {
      questions: [14, 16, 13, 18, 22, 26, 28],
      duration: [1.0, 1.2, 1.1, 1.4, 1.6, 2.1, 2.5],
      accuracy: [69, 70, 71, 72, 75, 76, 74]
    },
    radar: [
      { name: '数学计算', score: 79 },
      { name: '逻辑推理', score: 69 },
      { name: '英语阅读', score: 83 },
      { name: '编程基础', score: 62 },
      { name: '数据结构', score: 51 }
    ],
    wrong: [
      { name: '动态规划', percentage: 73 },
      { name: '递归算法', percentage: 57 },
      { name: '图论基础', percentage: 46 },
      { name: '排序算法', percentage: 33 }
    ],
    weakness: [
      { name: '动态规划', rate: 47, suggest: 20 },
      { name: '数据结构', rate: 51, suggest: 16 },
      { name: '编程基础', rate: 62, suggest: 12 }
    ]
  },
  custom: {
    label: '近30天',
    days: ['第1周', '第2周', '第3周', '第4周'],
    kpi: { duration: 48.6, questions: 618, accuracy: 76, completed: 82 },
    trend: {
      questions: [132, 148, 157, 181],
      duration: [10.8, 11.5, 12.7, 13.6],
      accuracy: [72, 74, 77, 79]
    },
    radar: [
      { name: '数学计算', score: 82 },
      { name: '逻辑推理', score: 72 },
      { name: '英语阅读', score: 86 },
      { name: '编程基础', score: 66 },
      { name: '数据结构', score: 58 }
    ],
    wrong: [
      { name: '动态规划', percentage: 64 },
      { name: '递归算法', percentage: 51 },
      { name: '图论基础', percentage: 40 },
      { name: '排序算法', percentage: 27 }
    ],
    weakness: [
      { name: '动态规划', rate: 54, suggest: 20 },
      { name: '数据结构', rate: 58, suggest: 16 },
      { name: '编程基础', rate: 66, suggest: 13 }
    ]
  }
})

const dataByKey = computed(() => dashboardData[currentWeek.value] || dashboardData.current)
const compareData = computed(() => {
  if (currentWeek.value === 'current') return dashboardData.last
  if (currentWeek.value === 'last') return dashboardData.custom
  return dashboardData.last
})

const radarData = computed(() => dataByKey.value.radar)
const wrongDistData = computed(() => dataByKey.value.wrong)
const weaknessData = computed(() => dataByKey.value.weakness)

const formatTrend = (value) => (value >= 0 ? `+${value}%` : `${value}%`)
const calcTrend = (currentValue, previousValue) => {
  if (!previousValue) return 0
  return Math.round(((currentValue - previousValue) / previousValue) * 100)
}

const overviewStats = computed(() => {
  const current = dataByKey.value.kpi
  const previous = compareData.value.kpi
  return [
    {
      title: '学习时长',
      display: `${current.duration}h`,
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
      progress: current.accuracy
    },
    {
      title: '完成知识点',
      display: `${current.completed}个`,
      trend: calcTrend(current.completed, previous.completed),
      progress: Math.min(100, Math.round((current.completed / 40) * 100))
    }
  ].map((item) => ({ ...item, trendLabel: formatTrend(item.trend) }))
})

const metricConfigMap = {
  questions: { name: '刷题量', unit: '题', color: '#2563eb' },
  duration: { name: '学习时长', unit: '小时', color: '#0ea5e9' },
  accuracy: { name: '正确率', unit: '%', color: '#14b8a6' }
}

const getWeakestItem = (items) => items.slice().sort((a, b) => a.score - b.score)[0]
const getStrongestItem = (items) => items.slice().sort((a, b) => b.score - a.score)[0]

const reportTitle = computed(() => {
  const cycleLabel = reportCycle.value === 'weekly' ? '周度学习报告' : '月度学习报告'
  return `${dataByKey.value.label}${cycleLabel}`
})

const generatedAtText = computed(() => {
  const value = generatedAt.value
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  const hour = `${value.getHours()}`.padStart(2, '0')
  const minute = `${value.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
})

const reportSections = computed(() => {
  const kpi = dataByKey.value.kpi
  const previous = compareData.value.kpi
  const weakest = getWeakestItem(radarData.value)
  const strongest = getStrongestItem(radarData.value)
  const topWrong = wrongDistData.value[0]
  const suggestionLines = weaknessData.value.map(
    (item) => `${item.name} 建议增加 ${item.suggest} 题专项训练，目标正确率提升至 ${Math.min(95, item.rate + 12)}%`
  )

  return [
    {
      title: '量化分析',
      items: [
        `${dataByKey.value.label}累计刷题 ${kpi.questions} 题，较对比周期变化 ${formatTrend(calcTrend(kpi.questions, previous.questions))}`,
        `学习总时长 ${kpi.duration} 小时，平均正确率 ${kpi.accuracy}%`,
        `完成知识点 ${kpi.completed} 个，学习覆盖面持续扩展`
      ]
    },
    {
      title: '问题诊断',
      items: [
        `当前主要薄弱点为 ${weakest.name}（掌握度 ${weakest.score} 分）`,
        `最稳定优势项为 ${strongest.name}（掌握度 ${strongest.score} 分）`,
        `错题占比最高的是 ${topWrong.name}（${topWrong.percentage}%），建议优先复盘`
      ]
    },
    {
      title: '数据驱动建议',
      items: suggestionLines
    }
  ]
})

let trendChartInstance = null
let radarChartInstance = null

const renderTrendChart = () => {
  if (!trendChartInstance) return
  const currentSeries = dataByKey.value.trend[trendMetric.value]
  const previousSeries = compareData.value.trend[trendMetric.value]
  const metric = metricConfigMap[trendMetric.value]
  const series = [
    {
      name: `${dataByKey.value.label}${metric.name}`,
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
      name: `${compareData.value.label}${metric.name}`,
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
      data: dataByKey.value.days,
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
  radarChartInstance.setOption({
    radar: {
      indicator: radarData.value.map((item) => ({ name: item.name, max: 100 })),
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
            value: radarData.value.map((item) => item.score),
            name: `${dataByKey.value.label}掌握度`,
            areaStyle: { color: 'rgba(37, 99, 235, 0.2)' },
            lineStyle: { color: '#2563eb', width: 2 },
            itemStyle: { color: '#2563eb' }
          }
        ]
      }
    ]
  })
}

const regenerateReport = () => {
  generatedAt.value = new Date()
  ElMessage.success('已基于最新学习数据生成报告')
}

const exportReport = () => {
  ElMessage.success('学习报告导出任务已创建')
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
  nextTick(() => {
    initCharts()
  })
  window.addEventListener('resize', resizeCharts)
})

watch([currentWeek, trendMetric, showCompare], () => {
  nextTick(() => {
    renderTrendChart()
    renderRadarChart()
  })
})

watch([currentWeek, reportCycle], () => {
  generatedAt.value = new Date()
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
