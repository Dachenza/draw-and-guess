<template>
  <div class="word-selector-overlay" v-if="visible">
    <div class="word-selector">
      <h3>选择一个词语来画</h3>
      <p class="hint">你需要在 {{ selectTime }} 秒内做出选择</p>
      <div class="word-options">
        <button
          v-for="word in words"
          :key="word"
          class="word-btn"
          @click="select(word)"
        >
          {{ word }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  words: { type: Array, default: () => [] },
  selectTime: { type: Number, default: 10 }
})

const emit = defineEmits(['select'])

function select(word) {
  emit('select', word)
}
</script>

<style scoped>
.word-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.word-selector {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 480px;
  width: 90vw;
}

.word-selector h3 {
  font-size: 22px;
  margin-bottom: 8px;
}

.hint {
  color: #8899aa;
  font-size: 14px;
  margin-bottom: 28px;
}

.word-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-btn {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: #eee;
  font-size: 22px;
  font-weight: 600;
  transition: all 0.2s;
}

.word-btn:hover {
  background: rgba(78, 205, 196, 0.12);
  border-color: #4ecdc4;
  transform: scale(1.02);
}
</style>
