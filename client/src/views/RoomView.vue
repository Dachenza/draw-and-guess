<template>
  <div class="room">
    <div class="room-header">
      <h1>房间 {{ game.roomId }}</h1>
      <span class="player-count">{{ onlineCount }} / 8 人</span>
    </div>

    <div class="share-hint">
      房间号：<strong>{{ game.roomId }}</strong>
      <button class="copy-btn" @click="copyRoomId" title="复制房间号">📋</button>
    </div>
    <div class="share-hint">
      分享链接：<strong>{{ shareUrl }}</strong>
      <button class="copy-btn" @click="copyShareUrl" title="复制链接">📋</button>
    </div>

    <div class="players-list">
      <div
        v-for="player in game.players"
        :key="player.id"
        class="player-card"
        :class="{
          host: player.isHost,
          drawer: player.id === game.drawerId && game.drawerId
        }"
      >
        <div class="player-avatar">{{ player.avatar || '👤' }}</div>
        <div class="player-info">
          <span class="player-name">
            {{ player.name }}
          </span>
          <span v-if="player.id === game.playerId" class="me-badge">我</span>
          <span v-if="player.isHost" class="host-badge">房主</span>
          <span v-if="player.id === game.drawerId && game.drawerId" class="drawer-badge">🎨 画师</span>
        </div>
        <button
          v-if="game.isHost && !player.isHost"
          class="kick-btn"
          @click="kickPlayer(player.id)"
          title="踢出玩家"
        >✕</button>
      </div>
    </div>

    <div v-if="game.isHost" class="settings">
      <label class="setting-row">
        <span>游戏轮数</span>
        <div class="rounds-control">
          <button class="round-btn" @click="rounds = Math.max(1, rounds - 1)">-</button>
          <span class="rounds-value">{{ rounds }}</span>
          <button class="round-btn" @click="rounds = Math.min(10, rounds + 1)">+</button>
        </div>
      </label>
    </div>

    <div class="room-actions">
      <button
        v-if="game.isHost"
        class="btn btn-start"
        :disabled="onlineCount < 2"
        @click="handleStart"
      >
        {{ onlineCount < 2 ? '等待更多玩家...' : '开始游戏' }}
      </button>
      <button v-else class="btn btn-waiting" disabled>
        等待房主开始游戏...
      </button>
      <button class="btn btn-leave" @click="leaveRoom">
        离开房间
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useNotificationStore } from '../stores/notification.js'
import { useRoute } from 'vue-router'
import { getSavedRoom } from '../services/credential.js'

const nicknames = ['皮皮虾', '小机灵', '画画怪', '猜词王', '灵魂画手', '摸鱼大师', '吃瓜群众', '无敌小可爱', '暴躁画笔', '佛系玩家']

function randomName() {
  return nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 1000)
}

const game = useGameStore()
const route = useRoute()
const rounds = ref(3)

const onlineCount = computed(() => game.players.length)

const shareUrl = computed(() => {
  const origin = window.location.origin
  return `${origin}/?room=${game.roomId}`
})

onMounted(() => {
  if (!game.playerId && route.params.roomId) {
    const saved = getSavedRoom()
    if (!saved || saved.roomId !== route.params.roomId) {
      game.joinRoom(route.params.roomId, randomName())
    }
  }
})

function handleStart() {
  game.startGame(rounds.value)
}

async function kickPlayer(targetId) {
  const ok = await useNotificationStore().showConfirm('踢出玩家', '确定踢出该玩家？')
  if (ok) game.kickPlayer(targetId)
}

function leaveRoom() {
  game.backToLobby()
}

function copyText(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  try { document.execCommand('copy') } catch {}
  document.body.removeChild(el)
}

function copyRoomId() {
  copyText(game.roomId)
  useNotificationStore().showToast('房间号已复制', 'success')
}

function copyShareUrl() {
  copyText(shareUrl.value)
  useNotificationStore().showToast('链接已复制', 'success')
}
</script>

<style scoped>
.room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.room-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
}

.room-header h1 {
  font-size: 28px;
}

.player-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #aab;
}

.share-hint {
  color: #8899aa;
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-hint strong {
  color: #f5a623;
  font-size: 18px;
  letter-spacing: 2px;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 14px;
  transition: all 0.15s;
  line-height: 1;
}

.copy-btn:hover {
  background: rgba(78, 205, 196, 0.2);
  transform: scale(1.1);
}



.players-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  max-width: 600px;
  width: 100%;
  margin-bottom: 24px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px 20px;
  width: 200px;
  transition: all 0.2s;
}

.player-card.host {
  border-color: #f5a623;
  background: rgba(245, 166, 35, 0.08);
}

.player-card.drawer {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.08);
}

.drawer-badge {
  font-size: 11px;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.player-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e94560, #c23152);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.player-card.host .player-avatar {
  background: linear-gradient(135deg, #f5a623, #d4891a);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
}

.me-badge {
  font-size: 11px;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
  font-weight: 700;
}

.host-badge {
  font-size: 11px;
  color: #f5a623;
  background: rgba(245, 166, 35, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.kick-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  margin-left: auto;
}

.kick-btn:hover {
  background: rgba(233, 69, 96, 0.3);
  transform: scale(1.1);
}

.settings {
  width: 300px;
  max-width: 90vw;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #aab;
  cursor: pointer;
}

.rounds-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.round-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #eee;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.round-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.rounds-value {
  font-size: 22px;
  font-weight: 700;
  color: #f5a623;
  min-width: 24px;
  text-align: center;
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px;
  max-width: 90vw;
}

.btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-start {
  background: linear-gradient(135deg, #e94560, #c23152);
  color: white;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-waiting {
  background: rgba(255, 255, 255, 0.08);
  color: #8899aa;
}

.btn-leave {
  background: transparent;
  color: #667;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  font-size: 14px;
}

.btn-leave:hover {
  border-color: #e94560;
  color: #e94560;
}

@media (max-width: 768px) {
  .room {
    padding: 16px 12px;
  }

  .room-header {
    gap: 12px;
    margin-bottom: 8px;
  }

  .room-header h1 {
    font-size: 17px;
  }

  .player-count {
    font-size: 11px;
    padding: 3px 10px;
  }

  .share-hint {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .share-hint strong {
    font-size: 13px;
  }

  .players-list {
    gap: 8px;
    margin-bottom: 14px;
  }

  .player-card {
    width: 100%;
    padding: 10px 14px;
    gap: 10px;
    border-radius: 12px;
  }

  .player-avatar {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .player-name {
    font-size: 13px;
  }

  .settings {
    width: 100%;
    padding: 10px 14px;
    margin-bottom: 12px;
  }

  .setting-row {
    font-size: 13px;
  }

  .round-btn {
    width: 28px;
    height: 28px;
    font-size: 15px;
  }

  .rounds-value {
    font-size: 18px;
  }

  .room-actions {
    width: 100%;
  }

  .btn {
    padding: 12px;
    font-size: 14px;
  }
}
</style>
