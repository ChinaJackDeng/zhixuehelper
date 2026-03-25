<!-- src/views/analytics/AnalyticsPage.vue -->
<template>
  <div class="learning-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-right">
          <el-radio-group v-model="currentWeek" size="large">
            <el-radio-button label="current">本周</el-radio-button>
            <el-radio-button label="last">上周</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>

    <!-- 主内容区：左右布局 -->
    <div class="main-content-wrapper">
      <!-- 左侧内容区 -->
      <div class="left-content">
        <!-- 核心学习概览：4个KPI卡片 -->
        <div class="overview-section">
          <div class="stats-grid">
            <div class="stat-card" v-for="(stat, index) in overviewStats" :key="index">
              <div class="stat-header">
                <span class="stat-title">{{ stat.title }}</span>
              </div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
                <el-tag :type="stat.trend > 0 ? 'success' : 'danger'" size="small">
                  {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}% 较上周
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 周度对比模块 -->
        <div class="week-compare-section">
          <div class="compare-card">
            <h3 class="section-title">周度对比</h3>
            <div class="compare-items">
              <div class="compare-item" v-for="(item, index) in weekCompareData" :key="index">
                <div class="compare-label">{{ item.label }}</div>
                <div class="compare-bars">
                  <div class="bar-wrapper">
                    <div class="bar-label">本周</div>
                    <el-progress 
                      :percentage="item.current" 
                      :color="'#165DFF'"
                      :stroke-width="12"
                      :show-text="false"
                    />
                    <div class="bar-value">{{ item.current }}{{ item.unit }}</div>
                  </div>
                  <div class="bar-wrapper">
                    <div class="bar-label">上周</div>
                    <el-progress 
                      :percentage="item.last" 
                      :color="'#BFDBFE'"
                      :stroke-width="12"
                      :show-text="false"
                    />
                    <div class="bar-value light">{{ item.last }}{{ item.unit }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 学习趋势图 -->
        <div class="trend-section">
          <div class="trend-card">
            <div class="trend-header">
              <h3 class="section-title">学习趋势</h3>
              <el-tabs v-model="trendTab" type="card" @tab-change="handleTabChange">
                <el-tab-pane label="刷题量" name="questions"></el-tab-pane>
                <el-tab-pane label="学习时长" name="duration"></el-tab-pane>
              </el-tabs>
            </div>
            <div class="trend-chart" id="trendChart"></div>
          </div>
        </div>

        <!-- 诊断分析区（三列布局） -->
        <div class="diagnosis-section">
          <!-- 知识掌握雷达图 -->
          <div class="diagnosis-card">
            <h3 class="section-title">知识点掌握结构</h3>
            <div class="radar-chart" id="radarChart"></div>
            <div class="radar-legend">
              <div class="legend-item" v-for="(item, index) in radarData" :key="index">
                <span class="legend-dot" :class="item.score < 60 ? 'weak' : 'strong'"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-score" :class="item.score < 60 ? 'weak-text' : ''">{{ item.score }}分</span>
              </div>
            </div>
          </div>

          <!-- 错题分布 -->
          <div class="diagnosis-card">
            <h3 class="section-title">错题分布</h3>
            <div class="wrong-dist">
              <div class="dist-item" v-for="(item, index) in wrongDistData" :key="index">
                <div class="dist-name">
                  {{ item.name }}
                  <el-tag v-if="index < 3" type="danger" size="small" effect="dark" class="hot-tag">高频</el-tag>
                </div>
                <div class="dist-bar">
                  <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
                </div>
                <div class="dist-value">{{ item.percentage }}%</div>
              </div>
            </div>
          </div>

          <!-- 薄弱点推荐 -->
          <div class="diagnosis-card weakness-card">
            <h3 class="section-title">薄弱点推荐</h3>
            <el-alert
              title="当前学习风险点"
              type="warning"
              :closable="false"
              show-icon
              class="weakness-alert"
            />
            <div class="weakness-list">
              <div class="weakness-item" v-for="(item, index) in weaknessData" :key="index">
                <div class="weakness-icon">⚠️</div>
                <div class="weakness-content">
                  <div class="weakness-name">{{ item.name }}正确率仅 {{ item.rate }}%</div>
                  <div class="weakness-suggest">📌 推荐：完成 {{ item.suggest }} 题专项练习</div>
                </div>
                <el-button type="primary" size="small" class="practice-btn">去练习</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧AI学习报告 -->
      <div class="right-sidebar">
        <div class="ai-report-card">
          <div class="report-header">
            <el-icon size="24" class="report-icon"><ChatDotRound /></el-icon>
            <h3 class="report-title">本周智能学习总结</h3>
          </div>
          <el-divider />
          <div class="report-content">
            <div class="report-section">
              <h4 class="subsection-title">量化分析</h4>
              <ul class="report-list">
                <li>本周共完成 <span class="highlight">156</span> 题，较上周增长 <span class="highlight">22%</span></li>
                <li>平均正确率 <span class="highlight">78%</span>，处于稳定区间</li>
                <li>累计学习时长 <span class="highlight">12.5</span> 小时，日均 1.8 小时</li>
              </ul>
            </div>
            <div class="report-section">
              <h4 class="subsection-title">问题诊断</h4>
              <ul class="report-list">
                <li><span class="weak">动态规划</span> 为最大薄弱点，正确率仅 52%</li>
                <li><span class="strong">英语阅读</span> 正确率显著提升，达到 85%</li>
                <li>整体学习节奏稳定，保持当前状态</li>
              </ul>
            </div>
            <div class="report-section">
              <h4 class="subsection-title">学习建议</h4>
              <ul class="report-list numbered">
                <li>明天安排 20 分钟动态规划专项训练</li>
                <li>保持当前英语阅读节奏，每日至少 30 分钟</li>
                <li>周末进行一次完整模拟测试，检验学习成果喝茶水单词和阿萨德法国红酒快乐请前往儿童与自行车vbnm</li>
              </ul>
            </div>
          </div>
          <div class="report-actions">
            <el-button type="primary" text>查看完整报告</el-button>
            <el-button type="primary" text>导出数据</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import {  ChatDotRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 当前周次选择
const currentWeek = ref('current')

// 趋势图标签页
const trendTab = ref('questions')

// 核心概览数据
const overviewStats = reactive([
  { title: '本周学习时长', value: '12.5h', trend: 18 },
  { title: '刷题总题量', value: '156', trend: 22 },
  { title: '平均正确率', value: '78%', trend: 5 },
  { title: '完成知识点', value: '24', trend: -3 }
])

// 周度对比数据
const weekCompareData = reactive([
  { label: '刷题量', current: 85, last: 70, unit: '题' },
  { label: '正确率', current: 78, last: 73, unit: '%' },
  { label: '日均时长', current: 90, last: 75, unit: 'min' }
])

// 雷达图数据
const radarData = reactive([
  { name: '数学计算', score: 85 },
  { name: '逻辑推理', score: 72 },
  { name: '英语阅读', score: 88 },
  { name: '编程基础', score: 65 },
  { name: '数据结构', score: 52 }
])

// 错题分布数据
const wrongDistData = reactive([
  { name: '动态规划', percentage: 70 },
  { name: '递归算法', percentage: 55 },
  { name: '图论基础', percentage: 45 },
  { name: '排序算法', percentage: 30 },
  { name: '查找算法', percentage: 20 }
])

// 薄弱点数据
const weaknessData = reactive([
  { name: '动态规划', rate: 52, suggest: 15 },
  { name: '数据结构', rate: 58, suggest: 12 },
  { name: '编程基础', rate: 65, suggest: 10 }
])

// 图表实例
let radarChart = null
let trendChart = null

// 初始化雷达图
const initRadarChart = () => {
  const chartDom = document.getElementById('radarChart')
  if (!chartDom) return
  
  radarChart = echarts.init(chartDom)  
  const option = {
    radar: {
      indicator: radarData.map(item => ({
        name: item.name,
        max: 100
      })),
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#64748b',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(22, 93, 255, 0.05)', 'rgba(22, 93, 255, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarData.map(item => item.score),
            name: '知识掌握度',
            areaStyle: {
              color: 'rgba(22, 93, 255, 0.3)'
            },
            lineStyle: {
              color: '#165DFF',
              width: 2
            },
            itemStyle: {
              color: '#165DFF'
            }
          }
        ]
      }
    ]
  }
  
  radarChart.setOption(option)
}

// 初始化趋势图
const initTrendChart = () => {
  const chartDom = document.getElementById('trendChart')
  if (!chartDom) return
  
  trendChart = echarts.init(chartDom)  
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - i))
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const questionData = [12, 15, 8, 20, 18, 25, 22, 30, 28, 35, 32, 40, 38, 45]
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        color: '#64748b',
        fontSize: 11
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b'
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9'
        }
      }
    },
    series: [
      {
        name: '刷题量',
        type: 'line',
        data: questionData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#165DFF',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 93, 255, 0.05)' }
          ])
        },
        itemStyle: {
          color: '#165DFF'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 切换趋势图数据
const switchTrendData = () => {
  if (!trendChart) return
  
  if (trendTab.value === 'questions') {
    const questionData = [12, 15, 8, 20, 18, 25, 22, 30, 28, 35, 32, 40, 38, 45]
    trendChart.setOption({
      series: [
        {
          name: '刷题量',
          type: 'line',
          data: questionData
        }
      ]
    })
  } else {
    const durationData = [1.2, 1.5, 0.8, 2.0, 1.8, 2.5, 2.2, 3.0, 2.8, 3.5, 3.2, 4.0, 3.8, 4.5]
    trendChart.setOption({
      series: [
        {
          name: '学习时长（小时）',
          type: 'line',
          data: durationData
        }
      ]
    })
  }
}

// 标签页切换处理
const handleTabChange = () => {
  switchTrendData()
}

// 组件挂载时初始化图表
onMounted(() => {
  nextTick(() => {
    initRadarChart()
    initTrendChart()
  })
})

// 监听趋势图标签页变化
watch(trendTab, () => {
  switchTrendData()
})

// 窗口大小改变时重绘图表
window.addEventListener('resize', () => {
  if (radarChart) radarChart.resize()
  if (trendChart) trendChart.resize()
})
</script>

<style scoped>
/* 页面根容器 */
.learning-dashboard {
  padding: 24px 32px 24px 16px;
  width: 95%;
  margin-left: 100px;
  margin-right: 200px;
  background: #f8fafc;
  min-height: 100vh;
}

/* 顶部区域 */
.dashboard-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #165DFF 0%, #3B82F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-text h1 {
  font-size: 28px;
  font-weight: 700;
  color: #165DFF;
  margin: 0 0 4px 0;
}

.header-text p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-right .el-radio-group {
  transform: scale(1.02);
}

/* 主内容区：左右布局 */
.main-content-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.right-sidebar {
  width: 500px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  align-self: stretch;
}

/* 核心概览区域 */
.overview-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
  transform: translateY(-2px);
}

.stat-header {
  margin-bottom: 12px;
}

.stat-title {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #165DFF;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
}

/* 周度对比区域 */
.week-compare-section {
  margin-bottom: 24px;
}

.compare-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.compare-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.compare-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compare-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.compare-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 12px;
  color: #94a3b8;
  width: 40px;
  flex-shrink: 0;
}

.bar-wrapper .el-progress {
  flex: 1;
}

.bar-value {
  font-size: 14px;
  color: #165DFF;
  font-weight: 600;
  width: 60px;
  text-align: right;
}

.bar-value.light {
  color: #94a3b8;
}

/* 学习趋势区域 */
.trend-section {
  margin-bottom: 24px;
}

.trend-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trend-chart {
  min-height: 300px;
  width: 100%;
}

.chart-placeholder {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 诊断分析区域（三列布局） */
.diagnosis-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.diagnosis-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

/* 雷达图 */
.radar-chart {
  min-height: 200px;
  margin-bottom: 16px;
}

.radar-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.strong {
  background: #165DFF;
}

.legend-dot.weak {
  background: #ef4444;
}

.legend-name {
  color: #475569;
  flex: 1;
}

.legend-score {
  color: #165DFF;
  font-weight: 600;
}

.legend-score.weak-text {
  color: #ef4444;
}

/* 错题分布 */
.wrong-dist {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-name {
  font-size: 13px;
  color: #475569;
  width: 80px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hot-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
}

.dist-bar {
  flex: 1;
  height: 16px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF 0%, #3B82F6 100%);
  border-radius: 8px;
  transition: width 0.3s ease;
}

.dist-value {
  font-size: 13px;
  color: #165DFF;
  font-weight: 600;
  width: 40px;
  text-align: right;
}

/* 薄弱点推荐 */
.weakness-card {
  display: flex;
  flex-direction: column;
}

.weakness-alert {
  margin-bottom: 16px;
}

.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weakness-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #fefce8;
  border-radius: 8px;
  border: 1px solid #fef08a;
}

.weakness-icon {
  font-size: 20px;
}

.weakness-content {
  flex: 1;
}

.weakness-name {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 4px;
}

.weakness-suggest {
  font-size: 12px;
  color: #64748b;
}

.practice-btn {
  flex-shrink: 0;
}

/* AI学习报告 */
.ai-report-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  padding: 28px;
  border: 1px solid #bfdbfe;
  height: 100%;
  overflow-y: auto;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.report-icon {
  color: #165DFF;
}

.report-title {
  font-size: 22px;
  font-weight: 600;
  color: #165DFF;
  margin: 0;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.report-section {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.subsection-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.report-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-list li {
  font-size: 16px;
  line-height: 1.6;
  color: #475569;
  position: relative;
  padding-left: 16px;
}

.report-list li::before {
  content: "•";
  color: #165DFF;
  position: absolute;
  left: 0;
  font-size: 18px;
}

.report-list.numbered {
  counter-reset: item;
}

.report-list.numbered li {
  counter-increment: item;
  padding-left: 24px;
}

.report-list.numbered li::before {
  content: counter(item) ".";
  color: #165DFF;
  font-weight: 600;
  font-size: 16px;
}

.highlight {
  color: #165DFF;
  font-weight: 600;
  font-size: 18px;
}

.weak {
  color: #ef4444;
  font-weight: 600;
}

.strong {
  color: #22c55e;
  font-weight: 600;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .compare-items {
    grid-template-columns: 1fr;
  }
  
  .diagnosis-section {
    grid-template-columns: 1fr;
  }
  
  .report-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .learning-dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-text h1 {
    font-size: 22px;
  }
}
</style>