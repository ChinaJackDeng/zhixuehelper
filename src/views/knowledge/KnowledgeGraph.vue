<template>
  <div class="knowledge-graph-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button
          :icon="ArrowLeft"
          @click="goToKnowledgePage"
        >
          返回知识库
        </el-button>
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="loadGraphData"
          :loading="loading"
        >
          刷新图谱
        </el-button>
        
        <el-button 
          type="success" 
          :icon="Download" 
          @click="exportGraph"
        >
          导出图谱
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <div class="zoom-tools">
          <el-button size="small" @click="zoomOut">-</el-button>
          <span class="zoom-percent">{{ Math.round(zoomScale * 100) }}%</span>
          <el-button size="small" @click="zoomIn">+</el-button>
          <el-button size="small" @click="resetZoom">重置</el-button>
        </div>
      </div>
    </div>
    
    <div class="graph-container" ref="graphContainer">
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="50">
          <Loading />
        </el-icon>
        <p>正在加载知识图谱...</p>
      </div>
      
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
      
      <div v-else ref="graphCanvas" class="graph-canvas">
        <svg
          ref="graphSvgRef"
          class="simple-graph-svg"
          :viewBox="`0 0 ${graphViewport.width} ${graphViewport.height}`"
          preserveAspectRatio="xMidYMid meet"
          @wheel.prevent="handleGraphWheel"
        >
          <g :transform="zoomTransform">
            <line
              v-for="(link, index) in positionedLinks"
              :key="`l-${index}`"
              :x1="link.x1"
              :y1="link.y1"
              :x2="link.x2"
              :y2="link.y2"
              stroke="#cbd5e1"
              stroke-width="1.5"
              stroke-opacity="0.9"
            />
            <g
              v-for="node in positionedNodes"
              :key="node.id"
              class="simple-node"
              @click="handleNodeClick($event, node)"
            >
              <circle
                :cx="node.x"
                :cy="node.y"
                :r="node.radius"
                :fill="getNodeColor(node.category)"
                stroke="#fff"
                stroke-width="2"
              />
              <text
                :x="node.x"
                :y="node.y + node.radius + 14"
                text-anchor="middle"
              >
                {{ node.name }}
              </text>
            </g>
          </g>
        </svg>
      </div>
      
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

    <div v-if="graphGroups.length > 1" class="graph-pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="graphGroups.length"
        :page-size="1"
        :current-page="currentGraphPage"
        @current-change="handleGraphPageChange"
      />
      <span class="graph-page-tip">当前显示第 {{ currentGraphPage }} 个图谱，共 {{ graphGroups.length }} 个</span>
    </div>
    
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-label">
          <el-icon><DataLine /></el-icon>
          节点
        </div>
        <div class="stat-value">{{ currentGraphData.nodes.length }} / {{ graphData.nodes.length }}</div>
        <div class="stat-sub">当前图谱占比 {{ nodeCoveragePercent }}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">
          <el-icon><Connection /></el-icon>
          关系
        </div>
        <div class="stat-value">{{ currentGraphData.links.length }} / {{ graphData.links.length }}</div>
        <div class="stat-sub">当前图谱占比 {{ linkCoveragePercent }}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">
          <el-icon><Document /></el-icon>
          文档
        </div>
        <div class="stat-value">{{ documentCount }}</div>
        <div class="stat-sub">已纳入图谱的文档总量</div>
      </div>
      <div class="stat-item stat-item-highlight">
        <div class="stat-label">图谱</div>
        <div class="stat-value">{{ currentGraphPage }} / {{ graphGroups.length || 1 }}</div>
        <div class="stat-sub">当前图谱页 / 图谱总数</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft,
  Loading, 
  Close, 
  DataLine, 
  Connection, 
  Document,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { getKnowledgeGraph, getDocumentList } from '@/api/knowledge'

const router = useRouter()

// 状态定义
const loading = ref(false)
const graphContainer = ref(null)
const graphCanvas = ref(null)
const graphSvgRef = ref(null)
const selectedNode = ref(null)
const graphData = ref({ nodes: [], links: [] })
const documentCount = ref(0)
const graphViewport = ref({ width: 1000, height: 560 })
const currentGraphPage = ref(1)
const zoomScale = ref(1)
const zoomOffset = ref({ x: 0, y: 0 })
let resizeHandler = null

const zoomTransform = computed(() => `translate(${zoomOffset.value.x} ${zoomOffset.value.y}) scale(${zoomScale.value})`)

const graphGroups = computed(() => {
  const nodes = Array.isArray(graphData.value.nodes) ? graphData.value.nodes : []
  const links = Array.isArray(graphData.value.links) ? graphData.value.links : []
  if (nodes.length === 0) return []

  const nodeMap = new Map(nodes.map(node => [node.id, node]))
  const adjacency = new Map(nodes.map(node => [node.id, new Set()]))

  links.forEach((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    if (!adjacency.has(sourceId) || !adjacency.has(targetId)) return
    adjacency.get(sourceId).add(targetId)
    adjacency.get(targetId).add(sourceId)
  })

  const visited = new Set()
  const groups = []

  nodeMap.forEach((node, nodeId) => {
    if (visited.has(nodeId)) return
    const queue = [nodeId]
    const groupNodeIds = new Set()
    visited.add(nodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()
      groupNodeIds.add(currentId)
      const neighbors = adjacency.get(currentId) || new Set()
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          queue.push(neighborId)
        }
      })
    }

    const groupNodes = Array.from(groupNodeIds).map(id => nodeMap.get(id)).filter(Boolean)
    const groupLinks = links.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source
      const targetId = typeof link.target === 'object' ? link.target.id : link.target
      return groupNodeIds.has(sourceId) && groupNodeIds.has(targetId)
    })

    groups.push({ nodes: groupNodes, links: groupLinks })
  })

  return groups.sort((a, b) => b.nodes.length - a.nodes.length)
})

const currentGraphData = computed(() => {
  if (graphGroups.value.length === 0) return { nodes: [], links: [] }
  const index = Math.min(Math.max(currentGraphPage.value - 1, 0), graphGroups.value.length - 1)
  return graphGroups.value[index] || { nodes: [], links: [] }
})

const nodeCoveragePercent = computed(() => {
  const total = Number(graphData.value.nodes?.length || 0)
  if (!total) return 0
  return Math.round((Number(currentGraphData.value.nodes?.length || 0) / total) * 100)
})

const linkCoveragePercent = computed(() => {
  const total = Number(graphData.value.links?.length || 0)
  if (!total) return 0
  return Math.round((Number(currentGraphData.value.links?.length || 0) / total) * 100)
})

const positionedNodes = computed(() => {
  const nodes = Array.isArray(currentGraphData.value.nodes) ? currentGraphData.value.nodes : []
  const count = nodes.length
  if (count === 0) return []
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)))
  const rows = Math.max(1, Math.ceil(count / cols))
  const paddingX = 60
  const paddingY = 70
  const width = graphViewport.value.width
  const height = graphViewport.value.height
  const cellWidth = cols > 1 ? (width - paddingX * 2) / (cols - 1) : 0
  const cellHeight = rows > 1 ? (height - paddingY * 2) / (rows - 1) : 0

  return nodes.map((node, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      ...node,
      x: cols > 1 ? paddingX + col * cellWidth : width / 2,
      y: rows > 1 ? paddingY + row * cellHeight : height / 2,
      radius: 18
    }
  })
})

const positionedLinks = computed(() => {
  const links = Array.isArray(currentGraphData.value.links) ? currentGraphData.value.links : []
  const nodeMap = new Map(positionedNodes.value.map((node) => [node.id, node]))
  return links
    .map((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source
      const targetId = typeof link.target === 'object' ? link.target.id : link.target
      const source = nodeMap.get(sourceId)
      const target = nodeMap.get(targetId)
      if (!source || !target) return null
      return {
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y
      }
    })
    .filter(Boolean)
})

// 加载图谱数据
const loadGraphData = async () => {
  loading.value = true
  try {
    const response = await getKnowledgeGraph()
    const payload = response?.data || response || {}
    const normalizedGraph = {
      nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
      links: Array.isArray(payload.links) ? payload.links : []
    }
    let normalizedDocumentCount = Number(payload.documentCount || 0)

    if (normalizedGraph.nodes.length === 0) {
      const docResponse = await getDocumentList({ page: 1, page_size: 200 })
      const docs = Array.isArray(docResponse?.documents) ? docResponse.documents : []
      normalizedDocumentCount = Number(docResponse?.total || docs.length || normalizedDocumentCount)
      if (docs.length > 0) {
        normalizedGraph.nodes = docs.map((doc, index) => ({
          id: `doc-${doc.id || index + 1}`,
          name: doc.title || `文档${index + 1}`,
          category: '文档',
          docCount: 1,
          difficulty: Math.min(5, Math.max(1, Math.round((Number(doc.chunk_count || 0) + 1) / 2))),
          description: `${doc.file_type || 'text'} 文档`
        }))
      }
    }

    graphData.value = normalizedGraph
    documentCount.value = normalizedDocumentCount
    currentGraphPage.value = 1
    selectedNode.value = null
    resetZoom()
    await nextTick()
    ElMessage.success(normalizedGraph.nodes.length > 0 ? '图谱加载成功' : '暂无可视化数据')
  } catch (error) {
    ElMessage.error(`加载图谱失败：${error.message}`)
    console.error('加载图谱失败:', error)
  } finally {
    loading.value = false
  }
}

// 节点点击事件
const handleNodeClick = (event, d) => {
  event.stopPropagation()
  selectedNode.value = d
}

const handleGraphPageChange = (page) => {
  currentGraphPage.value = page
  selectedNode.value = null
  resetZoom()
}

const clampZoom = (value) => Math.min(3, Math.max(0.5, value))

const applyZoom = (nextScale, anchorX, anchorY) => {
  const scale = clampZoom(nextScale)
  if (scale === zoomScale.value) return
  const ratio = scale / zoomScale.value
  zoomOffset.value = {
    x: anchorX - (anchorX - zoomOffset.value.x) * ratio,
    y: anchorY - (anchorY - zoomOffset.value.y) * ratio
  }
  zoomScale.value = scale
}

const zoomIn = () => {
  applyZoom(
    zoomScale.value + 0.1,
    graphViewport.value.width / 2,
    graphViewport.value.height / 2
  )
}

const zoomOut = () => {
  applyZoom(
    zoomScale.value - 0.1,
    graphViewport.value.width / 2,
    graphViewport.value.height / 2
  )
}

const resetZoom = () => {
  zoomScale.value = 1
  zoomOffset.value = { x: 0, y: 0 }
}

const handleGraphWheel = (event) => {
  const svgElement = graphSvgRef.value
  if (!svgElement) return
  const rect = svgElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const anchorX = ((event.clientX - rect.left) / rect.width) * graphViewport.value.width
  const anchorY = ((event.clientY - rect.top) / rect.height) * graphViewport.value.height
  const nextScale = event.deltaY < 0 ? zoomScale.value + 0.1 : zoomScale.value - 0.1
  applyZoom(nextScale, anchorX, anchorY)
}

// 获取节点颜色
const getNodeColor = (category) => {
  const colors = {
    '概念': '#409EFF',
    '人物': '#67C23A',
    '地点': '#E6A23C',
    '机构': '#F56C6C',
    '时间': '#909399',
    '行为': '#8E44AD',
    '文档': '#14B8A6'
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
    '行为': '',
    '文档': 'info'
  }
  return types[type] || ''
}

// 导出图谱
const exportGraph = () => {
  if (!graphSvgRef.value) {
    ElMessage.warning('没有可导出的图谱')
    return
  }
  
  const svgData = graphSvgRef.value.outerHTML
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

  resizeHandler = () => {
    const width = graphCanvas.value?.clientWidth || 1000
    const height = graphCanvas.value?.clientHeight || 560
    graphViewport.value = { width, height }
  }
  resizeHandler()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
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

.zoom-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-percent {
  min-width: 52px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.graph-container {
  flex: 1;
  min-height: 560px;
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
  min-height: 560px;
  overflow: auto;
}

.simple-graph-svg {
  width: 100%;
  height: 100%;
  min-height: 560px;
  cursor: default;
}

.simple-node {
  cursor: pointer;
}

.simple-node text {
  fill: #334155;
  font-size: 12px;
  user-select: none;
  pointer-events: none;
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
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
}

.panel-content {
  padding: 20px;
}

.stats-bar {
  margin-top: 20px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
}

.graph-pagination {
  margin-top: 14px;
  margin-bottom: 2px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.graph-page-tip {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.stat-item {
  flex: 1;
  min-width: 180px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);
}

.stat-item-highlight {
  border-color: #d1fae5;
  background: #ecfdf5;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .knowledge-graph-page {
    padding: 12px;
  }

  .toolbar {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .graph-container {
    min-height: 460px;
  }

  .graph-pagination {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
