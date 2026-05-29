<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="'toast--' + t.type"
      >
        <span class="toast-icon">{{ icons[t.type] || icons.info }}</span>
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" @click="dismiss(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notification.js'

const notify = useNotificationStore()
const toasts = computed(() => notify.toasts)

const icons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✗' }

function dismiss(id) {
  notify.toasts = notify.toasts.filter(t => t.id !== id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(30, 30, 50, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 260px;
  max-width: 400px;
  pointer-events: auto;
}

.toast--info    { border-left: 3px solid #4ecdc4; }
.toast--success { border-left: 3px solid #2ecc71; }
.toast--warning { border-left: 3px solid #f5a623; }
.toast--error   { border-left: 3px solid #e94560; }

.toast-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast--info .toast-icon    { background: rgba(78, 205, 196, 0.15); color: #4ecdc4; }
.toast--success .toast-icon { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
.toast--warning .toast-icon { background: rgba(245, 166, 35, 0.15); color: #f5a623; }
.toast--error .toast-icon   { background: rgba(233, 69, 96, 0.15); color: #e94560; }

.toast-msg {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: #eee;
}

.toast-close {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: #667;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #eee;
}

.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
</style>
