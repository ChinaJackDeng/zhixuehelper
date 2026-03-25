<template>
  <aside class="question-navigator" :class="{ collapsed }">
    <!-- 折叠按钮 -->
    <el-button
        link
        class="collapse-btn"
        @click="collapsed = !collapsed"
    >
      <el-icon v-if="collapsed"><ArrowLeft /></el-icon>
      <el-icon v-else><ArrowRight /></el-icon>
    </el-button>

    <!-- 导航内容 -->
    <div v-show="!collapsed" class="nav-content">
      <div class="nav-header">
        <span class="nav-title">题号导航</span>
        <el-tag size="small" :type="mode === 'exam' ? 'danger' : 'success'">
          {{ mode === 'exam' ? '考试' : '练习' }}
        </el-tag>
      </div>

      <div class="nav-grid">
        <button
            v-for="(q, idx) in questions"
            :key="q.id"
            class="nav-btn"
            :class="getBtnClass(idx)"
            @click="emitNavigate(idx)"
        >
          {{ idx + 1 }}
          <el-icon v-if="q.marked" class="mark-icon"><StarFilled /></el-icon>
        </button>
      </div>

      <!-- 图例 -->
      <div class="nav-legend">
        <span class="legend-item"><i class="dot current"></i>当前</span>
        <span class="legend-item"><i class="dot answered"></i>已答</span>
        <span class="legend-item"><i class="dot correct"></i>正确</span>
        <span class="legend-item"><i class="dot wrong"></i>错误</span>
        <span class="legend-item"><i class="dot marked"></i>标记</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, StarFilled } from '@element-plus/icons-vue'

const props = defineProps({
  questions: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 },
  userAnswers: { type: Object, default: () => ({}) },
  correctMap: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'practice' }
})

const emit = defineEmits(['navigate'])

const collapsed = ref(false)

const getBtnClass = (idx) => {
  const q = props.questions[idx]
  const classes = []

  if (idx === props.currentIndex) classes.push('current')
  if (props.userAnswers[q?.id] !== undefined) classes.push('answered')
  if (props.correctMap[q?.id] === true) classes.push('correct')
  if (props.correctMap[q?.id] === false) classes.push('wrong')
  if (q?.marked) classes.push('marked')

  return classes
}

const emitNavigate = (idx) => {
  emit('navigate', idx)
}
</script>

<style scoped>
/* 固定左侧导航，内部为 4 列网格 */
.question-navigator {
  width: 240px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  flex-shrink: 0;
  position: fixed;
  left: 24px;
  top: 150px;
  bottom: 24px;
  padding: 8px;
  overflow: auto;
  z-index: 100;
}

.question-navigator.collapsed { width: 64px }

.collapse-btn { padding: var(--spacing-sm); border-bottom: 1px solid var(--border-color-light) }
.nav-content { flex:1; display:flex; flex-direction:column; min-height:0 }
.nav-header { padding: var(--spacing-sm) var(--spacing-md); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color-light) }
.nav-title { font-size: 16px; font-weight:600; color: var(--text-secondary) }
.nav-header .el-tag { font-size: 14px; padding: 6px 12px; height: auto; }

.nav-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; padding:12px }
.nav-btn {
  width:100%; height:40px; border-radius:8px; border:2px solid var(--border-color); background:var(--bg-card);
  font-weight:600; font-size:var(--font-size-sm); color:var(--text-regular); cursor:pointer;
  display:flex; align-items:center; justify-content:center; position:relative; transition: all .12s;
}
.nav-btn:hover { border-color:var(--color-primary); color:var(--color-primary) }
.nav-btn.current { background:var(--color-primary); border-color:var(--color-primary); color:white }
.nav-btn.answered:not(.current) { border-color:var(--color-success); color:var(--color-success) }
.nav-btn.correct:not(.current) { background:#f0f9eb; border-color:var(--color-success) }
.nav-btn.wrong:not(.current) { background:#fef0f0; border-color:var(--color-danger) }
.nav-btn.marked .mark-icon { position:absolute; top:-4px; right:-4px; font-size:12px; color:var(--color-warning) }

.nav-legend { padding: var(--spacing-xs) var(--spacing-md); border-top:1px solid var(--border-color-light); font-size:14px; color:var(--text-secondary) }
.legend-item { display:flex; align-items:center; gap:6px; padding:4px 0 }
.dot { width:14px; height:14px; border-radius:4px; display:inline-block }
.dot.current { background: var(--color-primary) }
.dot.answered { background: var(--color-success) }
.dot.correct { background:#67c23a }
.dot.wrong { background:var(--color-danger) }
.dot.marked { background:var(--color-warning) }

@media (max-width: 992px) {
  .question-navigator {
    position: relative; left:0; top:0; bottom:auto; width:100%; max-height:140px; border-right:none; border-bottom:1px solid var(--border-color-light)
  }
  .nav-grid { display:flex; overflow-x:auto; padding:var(--spacing-xs) var(--spacing-sm) }
  .nav-btn { min-width:56px; margin-right:8px }
  .nav-legend { display:none }
}
</style>
