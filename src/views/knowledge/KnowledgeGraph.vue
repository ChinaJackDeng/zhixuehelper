<!-- 知识图谱可视化页面 -->
<template>
  <div class="knowledge-graph-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button 
          type="primary" 
          icon="Refresh" 
          @click="loadGraphData"
          :loading="loading"
        >
          刷新图谱
        </el-button>
        
        <el-button 
          type="success" 
          icon="Download" 
          @click="exportGraph"
        >
          导出图谱
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-select 
          v-model="graphLayout" 
          placeholder="布局方式" 
          size="default"
          @change="updateLayout"
        >
          <el-option label="力导向布局" value="force" />
          <el-option label="环形布局" value="circular" />
          <el-option label="树形布局" value="hierarchical" />
        </el-select>
        
        <el-slider
          v-model="nodeSize"
          :min="10"
          :max="50"
          :step="5"
          style="width: 150px; margin-left: 20px;"
          tooltip-class="node-size-slider"
        >
          <template #prepend>
            <span>节点大小：</span>
          </template>
        </el-slider>
      </div>
    </div>
    
    <!-- 图谱容器 -->
    <div class="graph-container" ref="graphContainer">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="50">
          <Loading />
        </el-icon>
        <p>正在加载知识图谱...</p>
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        v-else-if="graphData.nodes.length === 0" 
        description="暂无图谱数据"
        :image-size="200"
      >
        <template #description>
          <p>请先上传文档或从文档生成知识图谱</p>
        </template>
        <el-button type="primary" @click="goToKnowledgePage">
          前往知识库
        </el-button>
      </el-empty>
      
      <!-- 图谱画布 -->
      <div v-else ref="graphCanvas" class="graph-canvas"></div>
      
      <!-- 节点信息面板 -->
      <div v-if="selectedNode" class="node-info-panel">
        <div class="panel-header">
          <h3>{{ selectedNode.name }}</h3>
          <el-icon class="close-btn" @click="selectedNode = null">
            <Close />
          </el-icon>
        </div>
        <div class="panel-content">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="类型">
              <el-tag size="small" :type="getNodeTypeColor(selectedNode.category)">
                {{ selectedNode.category || '未分类' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联文档数">
              {{ selectedNode.docCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="难度等级">
              <el-rate v-model="selectedNode.difficulty" disabled size="small" />
            </el-descriptions-item>
            <el-descriptions-item label="描述" v-if="selectedNode.description">
              {{ selectedNode.description }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>
    
    <!-- 底部统计信息 -->
    <div class="stats-bar">
      <el-tag type="info" effect="plain">
        <el-icon><DataLine /></el-icon>
        节点：{{ graphData.nodes.length }}
      </el-tag>
      <el-tag type="info" effect="plain" style="margin-left: 12px;">
        <el-icon><Connection /></el-icon>
        关系：{{ graphData.links.length }}
      </el-tag>
      <el-tag type="info" effect="plain" style="margin-left: 12px;">
        <el-icon><Document /></el-icon>
        文档：{{ documentCount }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Loading, 
  Close, 
  DataLine, 
  Connection, 
  Document 
} from '@element-plus/icons-vue'
import * as d3 from 'd3'
import { getKnowledgeGraph } from '@/api/knowledge'

const router = useRouter()

// 状态定义
const loading = ref(false)
const graphContainer = ref(null)
const graphCanvas = ref(null)
const graphLayout = ref('force')
const nodeSize = ref(25)
const selectedNode = ref(null)
const graphData = ref({ nodes: [], links: [] })
const documentCount = ref(0)

// SVG 和力导向模拟引用
let svg = null
let simulation = null

// 加载图谱数据
const loadGraphData = async () => {
  loading.value = true
  try {
    const response = await getKnowledgeGraph()
    if (response.data) {
      graphData.value = response.data
      documentCount.value = response.data.documentCount || 0
      
      // 等待 DOM 更新后渲染图谱
      await nextTick()
      renderGraph()
      
      ElMessage.success('图谱加载成功')
    }
  } catch (error) {
    ElMessage.error(`加载图谱失败：${error.message}`)
    console.error('加载图谱失败:', error)
  } finally {
    loading.value = false
  }
}

// 渲染图谱
const renderGraph = () => {
  if (!graphCanvas.value || graphData.value.nodes.length === 0) return
  
  // 清空画布
  d3.select(graphCanvas.value).select('svg').remove()
  
  const width = graphCanvas.value.clientWidth
  const height = graphCanvas.value.clientHeight
  
  // 创建 SVG
  svg = d3.select(graphCanvas.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
  
  // 创建缩放行为
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
  
  svg.call(zoom)
  
  // 创建组
  const g = svg.append('g')
  
  // 创建力导向模拟
  simulation = d3.forceSimulation(graphData.value.nodes)
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', d3.forceLink(graphData.value.links)
      .id(d => d.id)
      .distance(150))
    .force('collide', d3.forceCollide().radius(nodeSize.value + 5))
  
  // 绘制连线
  const link = g.append('g')
    .selectAll('line')
    .data(graphData.value.links)
    .join('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
  
  // 绘制节点
  const node = g.append('g')
    .selectAll('g')
    .data(graphData.value.nodes)
    .join('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .on('click', handleNodeClick)
  
  // 节点圆形
  node.append('circle')
    .attr('r', nodeSize.value)
    .attr('fill', d => getNodeColor(d.category))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
  
  // 节点标签
  node.append('text')
    .text(d => d.name)
    .attr('text-anchor', 'middle')
    .attr('dy', nodeSize.value + 20)
    .attr('font-size', '12px')
    .attr('fill', '#333')
    .attr('pointer-events', 'none')
  
  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
    
    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })
  
  // 拖拽函数
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }
  
  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}

// 更新布局
const updateLayout = () => {
  if (graphLayout.value === 'force') {
    simulation.force('charge', d3.forceManyBody().strength(-300))
  } else if (graphLayout.value === 'circular') {
    // 环形布局逻辑
    const radius = Math.min(graphCanvas.value.clientWidth, graphCanvas.value.clientHeight) / 3
    graphData.value.nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / graphData.value.nodes.length
      node.x = graphCanvas.value.clientWidth / 2 + radius * Math.cos(angle)
      node.y = graphCanvas.value.clientHeight / 2 + radius * Math.sin(angle)
    })
    simulation.alpha(1).restart()
  }
  
  renderGraph()
}

// 节点点击事件
const handleNodeClick = (event, d) => {
  event.stopPropagation()
  selectedNode.value = d
  console.log('选中节点:', d)
}

// 获取节点颜色
const getNodeColor = (category) => {
  const colors = {
    '概念': '#409EFF',
    '人物': '#67C23A',
    '地点': '#E6A23C',
    '机构': '#F56C6C',
    '时间': '#909399',
    '行为': '#8E44AD'
  }
  return colors[category] || '#409EFF'
}

// 获取节点类型颜色
const getNodeTypeColor = (type) => {
  const types = {
    '概念': '',
    '人物': 'success',
    '地点': 'warning',
    '机构': 'danger',
    '时间': 'info',
    '行为': ''
  }
  return types[type] || ''
}

// 导出图谱
const exportGraph = () => {
  if (!svg) {
    ElMessage.warning('没有可导出的图谱')
    return
  }
  
  const svgData = svg.node().outerHTML
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `knowledge-graph-${Date.now()}.svg`
  link.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('图谱已导出')
}

// 前往知识库页面
const goToKnowledgePage = () => {
  router.push('/knowledge')
}

// 生命周期
onMounted(() => {
  loadGraphData()
  
  // 窗口大小变化时重新渲染
  window.addEventListener('resize', () => {
    if (graphCanvas.value) {
      renderGraph()
    }
  })
})
</script>

<style scoped>
.knowledge-graph-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.graph-container {
  flex: 1;
  position: relative;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-overlay p {
  margin-top: 16px;
  color: var(--el-text-color-secondary);
  font-size: 16px;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.node-info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 20;
  max-height: calc(100% - 40px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.1);
}

.panel-content {
  padding: 20px;
}

.stats-bar {
  margin-top: 20px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
}

.stats-bar .el-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
</style>
