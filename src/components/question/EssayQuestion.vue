<template>
  <QuestionBase
      v-bind="$props"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <template #input>
      <el-input
          v-model="localValue"
          type="textarea"
          :rows="5"
          placeholder="请输入您的答案..."
          class="essay-input"
          @input="emit('update:modelValue', localValue)"
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
.essay-input {
  width: 100%;
  font-size: 16px;
}

.essay-input :deep(.el-textarea__inner) {
  border-radius: 10px;
  resize: vertical;
  min-height: 150px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  font-size: 16px;
  color: #333;
  padding: var(--spacing-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.essay-input :deep(.el-textarea__inner:hover) {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.essay-input :deep(.el-textarea__inner:focus) {
  background: #ffffff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}
</style>