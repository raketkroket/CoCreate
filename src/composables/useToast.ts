import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let idCounter = 0

export function useToast() {
  const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = ++idCounter
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }, duration)
  }

  const success = (message: string, duration?: number) => showToast(message, 'success', duration)
  const error = (message: string, duration?: number) => showToast(message, 'error', duration)
  const info = (message: string, duration?: number) => showToast(message, 'info', duration)
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration)

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    warning
  }
}
