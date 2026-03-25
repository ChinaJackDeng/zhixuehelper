<template>
  <div class="split-panel" :style="{ gridTemplateColumns: `${leftWidth}% ${100 - leftWidth}%` }">
    <aside class="panel-left">
      <slot name="left" />
    </aside>
    <main class="panel-right">
      <slot name="right" />
    </main>
  </div>
</template>

<script setup>
defineProps({
  leftWidth: {
    type: Number,
    default: 70,
    validator: (val) => val >= 20 && val <= 80
  }
})
</script>

<style scoped>
.split-panel {
  display: grid;
  gap: var(--spacing-md);
  height: 100%;
  min-height: 0;
}

.panel-left,
.panel-right {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 992px) {
  .split-panel {
    grid-template-columns: 100% !important;
    grid-template-rows: auto 1fr;
  }
  .panel-left {
    max-height: 300px;
  }
}
</style>