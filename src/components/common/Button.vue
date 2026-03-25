<template>
  <button
    :class="['btn', `btn-${type}`, `btn-${size}`, { 'btn-loading': isLoading }]"
    :disabled="isLoading || disabled"
    @click="$emit('click')"
  >
    <span v-if="isLoading" class="spinner"></span>
  <component v-if="icon && !isLoading" :is="icon" class="btn-icon"></component>
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    type: {
      type: String,
      default: 'primary',
      validator: v => ['primary', 'secondary', 'danger', 'success'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: v => ['sm', 'md', 'lg'].includes(v)
    },
    disabled: Boolean,
    isLoading: Boolean,
    icon: String
  }
}
</script>

<style scoped lang="css">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  font-family: var(--font-family);
}

/* 类型样式 */
.btn-primary {
  background: linear-gradient(135deg, #1e6dd6 0%, #1565c0 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--color-gray-1);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-success {
  background: var(--color-success);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-success:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* 尺寸样式 */
.btn-sm {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
}

.btn-md {
  padding: 8px 16px;
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: 12px 24px;
  font-size: var(--font-size-md);
}

/* 禁用状态 */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载状态 */
.btn-loading {
  color: transparent;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  position: absolute;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-icon {
  width: 18px;
  height: 18px;
}
</style>