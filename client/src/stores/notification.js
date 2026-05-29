import { defineStore } from 'pinia'
import { ref } from 'vue'

let toastId = 0

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref([])
  const confirmDialog = ref(null)

  function showToast(message, type = 'info', duration = 3000) {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      confirmDialog.value = { title, message, resolve }
    })
  }

  function resolveConfirm(result) {
    if (confirmDialog.value) {
      confirmDialog.value.resolve(result)
      confirmDialog.value = null
    }
  }

  function cancelConfirm() {
    if (confirmDialog.value) {
      confirmDialog.value.resolve(false)
      confirmDialog.value = null
    }
  }

  return { toasts, confirmDialog, showToast, showConfirm, resolveConfirm, cancelConfirm }
})
