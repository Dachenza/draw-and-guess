<template>
  <div class="score-board">
    <div class="score-title">得分榜</div>
    <div class="score-list">
        <div
          v-for="(player, i) in sortedPlayers"
          :key="player.id"
          class="score-row"
          :data-player-id="player.id"
          :class="{
            drawer: player.id === drawerId,
            me: player.id === myId
          }"
        >
        <span class="score-value">{{ scores[player.id] || 0 }}<span class="score-unit">分</span></span>
        <span class="score-avatar">{{ player.avatar || '👤' }}</span>
        <span class="score-name">{{ player.name }}</span>
        <span v-if="player.id === myId" class="score-me-badge">我</span>
        <span v-if="player.isHost" class="score-host-badge">房主</span>
        <span v-if="player.id === drawerId" class="score-drawer-badge">画师</span>
        <span v-if="effects[player.id]" class="score-effect" :key="effects[player.id].id">{{ effects[player.id].item }}</span>
        <button
          v-if="isHost && !player.isHost"
          class="score-kick"
          @click="$emit('kick', player.id)"
          title="踢出"
        >✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  players: { type: Array, default: () => [] },
  scores: { type: Object, default: () => ({}) },
  drawerId: { type: String, default: '' },
  myId: { type: String, default: '' },
  isHost: { type: Boolean, default: false }
})

defineEmits(['kick'])

const effects = reactive({})
let effectId = 0

function showEffect(targetId, item) {
  const id = ++effectId
  effects[targetId] = { item, id }
  setTimeout(() => {
    if (effects[targetId]?.id === id) delete effects[targetId]
  }, 1400)
}

const sortedPlayers = computed(() => {
  return [...props.players].sort((a, b) => (props.scores[b.id] || 0) - (props.scores[a.id] || 0))
})

defineExpose({ showEffect })
</script>

<style scoped>
.score-board {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
}

.score-title {
  font-size: 14px;
  color: #8899aa;
  margin-bottom: 12px;
  font-weight: 600;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s;
  position: relative;
}

.score-row.drawer {
  background: rgba(245, 166, 35, 0.08);
  border: 1px solid rgba(245, 166, 35, 0.2);
}

.score-row.me {
  border-left: 3px solid #4ecdc4;
}

.rank {
  color: #667;
  font-size: 13px;
  font-weight: 600;
  width: 20px;
}

.score-avatar {
  font-size: 16px;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.score-name {
  flex: 1;
  font-size: 14px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-me-badge {
  font-size: 10px;
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
  flex-shrink: 0;
}

.score-host-badge {
  font-size: 10px;
  background: rgba(245, 166, 35, 0.15);
  color: #f5a623;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}

.score-drawer-badge {
  background: #f5a623;
  color: #1a1a2e;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.score-effect {
  position: absolute;
  font-size: 28px;
  pointer-events: none;
  animation: flyIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), floatAway 1s ease-out 0.4s forwards;
  z-index: 5;
}

@keyframes flyIn {
  from { transform: scale(0) rotate(-180deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes floatAway {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-30px) scale(0.6); opacity: 0; }
}

.score-kick {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.score-kick:hover {
  background: rgba(233, 69, 96, 0.3);
}

.score-value {
  font-size: 16px;
  font-weight: 700;
  color: #4ecdc4;
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
}

.score-unit {
  font-size: 12px;
  font-weight: 400;
  color: #667;
  margin-left: 2px;
}
</style>
