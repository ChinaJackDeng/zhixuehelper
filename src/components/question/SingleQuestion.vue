<template>
  <QuestionBase
      v-bind="$props"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <template #input>
      <el-radio-group
          v-model="localValue"
          class="options-group"
          @change="emit('update:modelValue', localValue)"
      >
        <el-radio
            v-for="opt in question.options"
            :key="opt.key"
            :label="opt.key"
            class="option-radio"
        >
          <span class="opt-key">{{ opt.key }}.</span>
          <span class="opt-text">{{ opt.text }}</span>
        </el-radio>
      </el-radio-group>
    </template>
  </QuestionBase>
</template>

<script setup>
import { computed } from 'vue'
import QuestionBase from './QuestionBase.vue'

const props = defineProps({
  question: Object,
  modelValue: {},
  index: Number,
  showFeedback: Boolean,
  isCorrect: Boolean,
  showExplanationToggle: Boolean
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
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

.option-radio {
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

.option-radio:hover {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  transform: translateX(4px);
}

.option-radio :deep(.el-radio__label) {
  width: 100%;
  display: flex;
  gap: var(--spacing-sm);
  font-size: 16px;
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

/* 反馈样式 */
.option-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--text-primary);
}

:deep(.el-alert--success) {
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e9 100%) !important;
  font-size: 16px;
  border: 1px solid #c8e6c9;
}

:deep(.el-alert--error) {
  background: linear-gradient(135deg, #fef0f0 0%, #ffebee 100%) !important;
  font-size: 16px;
  border: 1px solid #ffcdd2;
}
</style>