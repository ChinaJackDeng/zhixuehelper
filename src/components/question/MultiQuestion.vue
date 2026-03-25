<template>
  <QuestionBase
      v-bind="$props"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <template #input>
      <el-checkbox-group
          v-model="localValue"
          class="options-group"
          @change="emit('update:modelValue', localValue)"
      >
        <el-checkbox
            v-for="opt in question.options"
            :key="opt.key"
            :label="opt.key"
            class="option-checkbox"
        >
          <span class="opt-key">{{ opt.key }}.</span>
          <span class="opt-text">{{ opt.text }}</span>
        </el-checkbox>
      </el-checkbox-group>
    </template>
  </QuestionBase>
</template>

<script setup>
import { computed } from 'vue'
import QuestionBase from './QuestionBase.vue'

const props = defineProps({
  question: Object,
  modelValue: { type: Array, default: () => [] },
  index: Number,
  showFeedback: Boolean,
  isCorrect: Boolean,
  showExplanationToggle: Boolean
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped>
.options-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: 16px;
}

.option-checkbox {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 10px;
  border: 2px solid #e8e8e8;
  transition: all var(--transition-fast);
  width: 100%;
  margin: 0 !important;
  text-align: left;
  font-size: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
}

.option-checkbox:hover {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  transform: translateX(4px);
}

.option-checkbox :deep(.el-checkbox__label) {
  width: 100%;
  display: flex;
  gap: var(--spacing-sm);
  font-size: 16px;
  color: #333;
}

.opt-key {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 24px;
  font-size: 16px;
}

.opt-text {
  flex: 1;
  color: #333;
  font-size: 16px;
}
</style>