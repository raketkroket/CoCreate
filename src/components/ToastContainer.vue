<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return '✓'
    case 'error': return '✗'
    case 'warning': return '⚠'
    case 'info': return 'ℹ'
    default: return 'ℹ'
  }
}
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
    >
      <span class="toast-icon">{{ getIcon(toast.type) }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  animation: slideIn 0.3s ease;
  pointer-events: auto;
  border-left: 4px solid;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-success {
  border-left-color: #10b981;
  background: #d1fae5;
  color: #065f46;
}

.toast-error {
  border-left-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
}

.toast-warning {
  border-left-color: #f59e0b;
  background: #fef3c7;
  color: #92400e;
}

.toast-info {
  border-left-color: #3b82f6;
  background: #dbeafe;
  color: #1e40af;
}

.toast-icon {
  font-size: 20px;
  font-weight: 700;
}

.toast-message {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

@media (max-width: 768px) {
  .toast-container {
    left: 16px;
    right: 16px;
    top: 16px;
  }

  .toast {
    min-width: auto;
  }
}
</style>
