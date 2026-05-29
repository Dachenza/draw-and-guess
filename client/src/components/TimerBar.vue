<template>
  <div class="timer-bar">
    <div class="timer-label">{{ label }}</div>
    <div class="timer-track">
      <div
        class="timer-fill"
        :class="{ warning: time <= 10, critical: time <= 5 }"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
    <div class="timer-value" :class="{ warning: time <= 10, critical: time <= 5 }">
      {{ time }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  time: { type: Number, default: 0 },
  maxTime: { type: Number, default: 60 },
  label: { type: String, default: '' }
})

const percentage = computed(() => {
  if (props.maxTime <= 0) return 0
  return (props.time / props.maxTime) * 100
})
</script>

<style scoped>
.timer-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.timer-label {
  font-size: 13px;
  color: #8899aa;
  white-space: nowrap;
  min-width: 30px;
}

.timer-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #44b3ab);
  border-radius: 4px;
  transition: width 1s linear;
}

.timer-fill.warning {
  background: linear-gradient(90deg, #f5a623, #d4891a);
}

.timer-fill.critical {
  background: linear-gradient(90deg, #e94560, #c23152);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.6; }
}

.timer-value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
  color: #4ecdc4;
}

.timer-value.warning { color: #f5a623; }
.timer-value.critical { color: #e94560; }
</style>
