<template>
  <div class="wrong-questions-page">
    <!-- 顶部操作栏 -->
    <div class="top-action-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索错题集..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 统计信息栏 -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ wrongQuestionSets.length }}</div>
          <div class="stat-label">错题集总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ totalQuestions }}</div>
          <div class="stat-label">错题总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ masteredCount }}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待强化</div>
        </div>
      </div>

      <div class="action-buttons">
        <el-button type="primary" @click="createNewSet">
          <el-icon><Plus /></el-icon>
          新建错题集
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="filter.tagId" placeholder="选择知识标签" clearable>
          <el-option label="全部标签" value="" />
          <el-option
            v-for="tag in tagOptions"
            :key="tag.id"
            :label="tag.name"
            :value="String(tag.id)"
          />
        </el-select>

        <el-select v-model="filter.sortBy" placeholder="排序方式">
          <el-option label="最近创建" value="recent" />
          <el-option label="错题数量" value="count" />
          <el-option label="名称排序" value="name" />
        </el-select>
      </div>
    </div>

    <!-- 错题集网格 -->
    <div class="sets-grid" v-loading="loading">
      <div 
        v-for="set in filteredSets" 
        :key="set.id" 
        class="set-folder-card"
        @click="viewSetDetail(set)"
      >
        <div class="folder-icon">
          <el-icon><Folder /></el-icon>
          <div class="question-count">{{ set.questionCount }}题</div>
        </div>
        <div class="folder-info">
          <h3 class="set-name">{{ set.name }}</h3>
          <p class="set-time">{{ formatDate(set.createTime) }}</p>
        </div>
        <div class="set-tags">
          <el-tag :style="{ borderColor: set.primaryTagColor || '#dcdfe6', color: set.primaryTagColor || '#606266' }" size="small">
            {{ set.primaryTagName }}
          </el-tag>
          <el-tag :type="getStatusType(set.status)" size="small">
            {{ getStatusName(set.status) }}
          </el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredSets.length === 0" class="empty-state">
        <el-icon class="empty-icon"><FolderOpened /></el-icon>
        <p>暂无错题集</p>
        <el-button type="primary" @click="createNewSet">创建错题集</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Folder, FolderOpened, Plus, Search } from '@element-plus/icons-vue'
import { getMistakes } from '@/api/exam'
import { getTagList } from '@/api/knowledge'

const router = useRouter()

const searchKeyword = ref('')
const filter = ref({
  tagId: '',
  sortBy: 'recent'
})
const tagOptions = ref([])
const wrongQuestionSets = ref([])
const loading = ref(false)

const normalizeTagResponse = (response) => {
  if (Array.isArray(response?.tags)) return response.tags
  if (Array.isArray(response?.data?.tags)) return response.data.tags
  if (Array.isArray(response)) return response
  return []
}

const calcSetStatus = (questionCount, latestTime) => {
  const latest = latestTime ? new Date(latestTime).getTime() : Date.now()
  const dayGap = Math.floor((Date.now() - latest) / 86400000)
  if (questionCount <= 2 && dayGap >= 7) return 'mastered'
  if (dayGap <= 2) return 'practicing'
  return 'pending'
}

const buildQuestionSetBasedSets = (mistakes) => {
  const setMap = new Map()
  mistakes.forEach(mistake => {
    const question = mistake.question || {}
    const setTags = Array.isArray(mistake.question_set_tags) ? mistake.question_set_tags : []
    const key = String(mistake.question_set_id || 'unbound')
    if (!setMap.has(key)) {
      setMap.set(key, {
        id: key,
        questionSetId: mistake.question_set_id || null,
        name: mistake.question_set_name || `题集 ${key}`,
        questionCount: 0,
        createTime: mistake.added_at || new Date().toISOString(),
        status: 'pending',
        questions: [],
        tagIds: [],
        tagNames: [],
        primaryTagName: '未打标签',
        primaryTagColor: '#909399'
      })
    }
    const currentSet = setMap.get(key)
    currentSet.questionCount += 1
    if (mistake.mastered) {
      currentSet.masteredCount = (currentSet.masteredCount || 0) + 1
    }
    currentSet.questions.push({
      id: question.id,
      mistakeId: mistake.id,
      stem: question.stem,
      type: question.type,
      added_at: mistake.added_at,
      user_answer: mistake.user_answer,
      mastered: !!mistake.mastered,
      tags: question.tags || []
    })
    setTags.forEach(tag => {
      const tagId = String(tag.id)
      if (!currentSet.tagIds.includes(tagId)) {
        currentSet.tagIds.push(tagId)
        currentSet.tagNames.push(tag.name)
        currentSet.tagColorMap = currentSet.tagColorMap || {}
        currentSet.tagColorMap[tagId] = tag.color
      }
    })
    ;(mistake.all_question_tags || []).forEach(tag => {
      const tagId = String(tag.id)
      if (!currentSet.tagIds.includes(tagId)) {
        currentSet.tagIds.push(tagId)
        currentSet.tagNames.push(tag.name)
        currentSet.tagColorMap = currentSet.tagColorMap || {}
        currentSet.tagColorMap[tagId] = tag.color
      }
    })
    ;(mistake.question_set_tags || []).forEach(tag => {
      const tagId = String(tag.id)
      if (!currentSet.tagIds.includes(tagId)) {
        currentSet.tagIds.push(tagId)
        currentSet.tagNames.push(tag.name)
        currentSet.tagColorMap = currentSet.tagColorMap || {}
        currentSet.tagColorMap[tagId] = tag.color
      }
    })
    ;(question.tags || []).forEach(tag => {
      const tagId = String(tag.id)
      if (!currentSet.tagIds.includes(tagId)) {
        currentSet.tagIds.push(tagId)
        currentSet.tagNames.push(tag.name)
        currentSet.tagColorMap = currentSet.tagColorMap || {}
        currentSet.tagColorMap[tagId] = tag.color
      }
    })
    if (mistake.added_at && new Date(mistake.added_at) > new Date(currentSet.createTime)) {
      currentSet.createTime = mistake.added_at
    }
  })

  return Array.from(setMap.values()).map(set => {
    const matchedTag = tagOptions.value.find(tag => set.tagIds.includes(String(tag.id)))
    const primaryColor = matchedTag?.color || set.tagColorMap?.[set.tagIds[0]] || '#909399'
    const masteredCount = set.masteredCount || 0
    const pendingCount = set.questionCount - masteredCount
    const status = pendingCount === 0 ? 'mastered' : calcSetStatus(set.questionCount, set.createTime)
    return {
      ...set,
      primaryTagName: matchedTag?.name || set.tagNames[0] || '未打标签',
      primaryTagColor: primaryColor,
      status
    }
  })
}

const loadTags = async () => {
  try {
    const response = await getTagList()
    tagOptions.value = normalizeTagResponse(response)
  } catch (error) {
    console.error('加载知识标签失败:', error)
    tagOptions.value = []
  }
}

const loadMistakeSets = async () => {
  try {
    loading.value = true
    const response = await getMistakes()
    console.log('[DEBUG] 接收到的原始错题数据:', response)
    const mistakes = Array.isArray(response) ? response : []
    wrongQuestionSets.value = buildQuestionSetBasedSets(mistakes)
  } catch (error) {
    console.error('加载错题集失败:', error)
    ElMessage.error('加载错题集失败')
    wrongQuestionSets.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadTags()
  await loadMistakeSets()
})

// 统计计算
const totalQuestions = computed(() => 
  wrongQuestionSets.value.reduce((sum, set) => sum + set.questionCount, 0)
)

const masteredCount = computed(() => 
  wrongQuestionSets.value.filter(set => set.status === 'mastered')
    .reduce((sum, set) => sum + set.questionCount, 0)
)

const pendingCount = computed(() => 
  wrongQuestionSets.value.filter(set => set.status === 'pending')
    .reduce((sum, set) => sum + set.questionCount, 0)
)

// 筛选和排序
const filteredSets = computed(() => {
  let result = [...wrongQuestionSets.value]
  
  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(set => 
      set.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  if (filter.value.tagId) {
    result = result.filter(set => set.tagIds.includes(filter.value.tagId))
  }
  
  switch (filter.value.sortBy) {
    case 'recent':
      result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      break
    case 'count':
      result.sort((a, b) => b.questionCount - a.questionCount)
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  
  return result
})

const getStatusType = (status) => {
  const types = {
    pending: 'danger',
    practicing: 'warning',
    mastered: 'success'
  }
  return types[status] || ''
}

const getStatusName = (status) => {
  const names = {
    pending: '待强化',
    practicing: '练习中',
    mastered: '已掌握'
  }
  return names[status] || status
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const handleSearch = () => {
}

const viewSetDetail = (set) => {
  sessionStorage.setItem('currentWrongSet', JSON.stringify(set))
  router.push(`/wrong-questions/set/${set.id}`)
}

const createNewSet = () => {
  ElMessage.info('错题集按知识标签自动归类，无需手动创建')
}
</script>

<style scoped>
.wrong-questions-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-left: 30px;
  margin-right: 30px;
  background-color: var(--el-bg-color-page);
}

/* 顶部操作栏 */
.top-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 400px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 12px 24px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.stat-item {
  text-align: center;
  padding: 0 12px;
}

.stat-item:not(:last-child) {
  border-right: 1px solid rgba(64, 158, 255, 0.2);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 2px;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 筛选栏 */
.filter-section {
  margin-bottom: 16px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-left {
  display: flex;
  gap: 12px;
}

.filter-left .el-select {
  width: 160px;
}

/* 错题集网格 */
.sets-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding: 4px;
}

.set-folder-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 28px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 2px solid transparent;
}

.set-folder-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

.folder-icon {
  position: relative;
  margin-bottom: 16px;
}

.folder-icon .el-icon {
  font-size: 72px;
  color: #409eff;
}

.question-count {
  position: absolute;
  bottom: -4px;
  right: -10px;
  background: #f56c6c;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  min-width: 32px;
}

.folder-info {
  margin-bottom: 12px;
  width: 100%;
}

.set-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  line-height: 1.4;
  display: -webkit-box;
  display: box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.set-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.set-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 80px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wrong-questions-page {
    padding: 16px;
    margin-left: 16px;
    margin-right: 16px;
  }
  
  .top-action-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-section {
    max-width: 100%;
    width: 100%;
  }
  
  .stats-bar {
    flex-wrap: wrap;
    gap: 24px;
    padding: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .filter-left {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-left .el-select {
    width: 100%;
  }
  
  .sets-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}
</style>
