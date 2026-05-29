<template>
  <Transition name="confirm">
    <div v-if="dialog" class="confirm-overlay" @click.self="notify.cancelConfirm()">
      <div class="confirm-card">
        <h3 class="confirm-title">{{ dialog.title }}</h3>
        <p class="confirm-msg">{{ dialog.message }}</p>
        <div class="confirm-actions">
          <button class="btn btn-cancel" @click="notify.cancelConfirm()">取消</button>
          <button class="btn btn-ok" @click="notify.resolveConfirm(true)">确定</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notification.js'

const notify = useNotificationStore()
const dialog = computed(() => notify.confirmDialog)
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  backdrop-filter: blur(4px);
}

.confirm-card {
  background: #1e1e36;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px 36px;
  max-width: 380px;
  width: 90vw;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.confirm-title {
  font-size: 20px;
  margin-bottom: 12px;
  color: #eee;
}

.confirm-msg {
  font-size: 15px;
  color: #8899aa;
  line-height: 1.5;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #8899aa;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #eee;
}

.btn-ok {
  background: linear-gradient(135deg, #e94560, #c23152);
  color: white;
}

.btn-ok:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.35);
}

.confirm-enter-active { transition: all 0.25s ease; }
.confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .confirm-card,
.confirm-leave-to .confirm-card {
  transform: scale(0.92);
}
</style>
