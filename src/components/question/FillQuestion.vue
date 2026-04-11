<template>
  <QuestionBase
      v-bind="$props"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <template #input>
      <el-input
          v-model="localValue"
          placeholder="请输入答案"
          class="fill-input"
      />
    </template>
  </QuestionBase>
</template>

<script setup>
import { computed } from 'vue'
import QuestionBase from './QuestionBase.vue'

const props = defineProps({
  question: Object,
  modelValue: { type: String, default: '' },
  index: Number,
  showFeedback: Boolean,
  isCorrect: Boolean,
  showExplanationToggle: Boolean
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped>
.fill-input {
  max-width: 600px;
  font-size: 16px;
}

.fill-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.fill-input :deep(.el-input__wrapper:hover) {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fill-input :deep(.el-input__input) {
  font-size: 16px;
  color: #333;
  padding: var(--spacing-md);
}
</style>