<template>
  <QuestionBase
      v-bind="$props"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <template #input>
      <el-radio-group
          v-model="localValue"
          class="judge-group"
          @change="emit('update:modelValue', localValue)"
      >
        <el-radio :label="true" class="judge-radio correct">
          <el-icon><CircleCheckFilled /></el-icon> 正确
        </el-radio>
        <el-radio :label="false" class="judge-radio wrong">
          <el-icon><CircleCloseFilled /></el-icon> 错误
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
.judge-group {
  display: flex;
  gap: var(--spacing-xl);
  font-size: 16px;
}

.judge-radio {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  font-weight: 600;
  font-size: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  transition: all 0.3s ease;
}

.judge-radio:hover {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.judge-radio.correct {
  border-color: var(--color-success);
  color: var(--color-success);
}

.judge-radio.wrong {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.judge-radio :deep(.el-radio__label) {
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.judge-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: inherit;
}
</style>