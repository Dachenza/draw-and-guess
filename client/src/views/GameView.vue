<template>
  <div class="game">
    <WordSelector
      :visible="game.myTurn && game.phase === 'selecting_word'"
      :words="game.wordOptions"
      :selectTime="game.selectTime"
      @select="handleWordSelect"
    />

    <div class="game-topbar">
      <div class="topbar-left">
        <span class="round-info">第 {{ game.round }}/{{ game.maxRounds }} 轮</span>
        <span class="drawer-name" v-if="game.drawerName" :class="{ 'is-drawer': true }">
          <span class="drawer-icon">{{ drawerAvatar }}</span>
          <span class="drawer-label">{{ game.drawerName }}</span>
          <span v-if="game.myTurn" class="drawer-me">（你）</span>
        </span>
      </div>
      <div class="topbar-right">
        <TimerBar
          :time="game.timer"
          :maxTime="game.phase === 'selecting_word' ? game.selectTime : 60"
          :label="game.phase === 'selecting_word' ? '选择词语' : '时间'"
        />
      </div>
      <div class="topbar-actions">
        <button v-if="game.myTurn && game.phase === 'drawing'" class="btn-end-round" @click="game.endRoundEarly()">结束本轮</button>
        <button class="btn-rules" @click="showRules = true">&#x2139;&#xFE0F; 积分规则</button>
        <button class="btn-reset-layout" @click="rightWidth = 340" title="重置布局">&#x21B2;&#xFE0F; 重置布局</button>
        <button class="btn-leave-game" @click="game.backToLobby()">退出房间</button>
        <button v-if="game.isHost" class="btn-disband-game" @click="confirmDisband">解散房间</button>
      </div>
    </div>

    <div class="game-content">
      <div class="game-canvas-area">
        <div class="canvas-top-info" v-if="isMobile && game.phase !== 'waiting'">
          <span class="cti-round">第{{ game.round }}/{{ game.maxRounds }}轮</span>
          <span class="cti-drawer" v-if="game.drawerName">{{ drawerAvatar }} {{ game.drawerName }}</span>
          <span class="cti-timer">{{ game.timer }}s</span>
          <button class="cti-menu-btn" @click="showMobileMenu = !showMobileMenu">&#x22EF;</button>
        </div>
        <Transition name="menu">
          <div v-if="showMobileMenu && isMobile" class="mobile-menu-overlay" @click.self="showMobileMenu = false">
            <div class="mobile-menu-card">
              <button v-if="game.myTurn && game.phase === 'drawing'" class="mm-btn" @click="game.endRoundEarly(); showMobileMenu = false">结束本轮</button>
              <button class="mm-btn" @click="showRules = true; showMobileMenu = false">&#x2139;&#xFE0F; 积分规则</button>
              <button class="mm-btn" @click="rightWidth = 340; showMobileMenu = false">&#x21B2;&#xFE0F; 重置布局</button>
              <button class="mm-btn mm-leave" @click="game.backToLobby(); showMobileMenu = false">退出房间</button>
              <button v-if="game.isHost" class="mm-btn mm-disband" @click="showMobileMenu = false; confirmDisband()">解散房间</button>
              <button class="mm-btn mm-cancel" @click="showMobileMenu = false">取消</button>
            </div>
          </div>
        </Transition>
        <div class="my-word" v-if="game.myTurn && game.currentWord && game.phase === 'drawing'">
          你画的词：<strong class="word-strong">{{ game.currentWord }}</strong>
        </div>
        <div class="my-word waiting" v-if="!game.myTurn && game.wordLength && game.phase === 'drawing'">
          词语：<strong class="word-hint">{{ wordHintDisplay }}</strong>
        </div>
        <DrawingCanvas
          ref="canvasRef"
          :isDrawer="game.myTurn"
          :phase="game.phase"
          :wordHint="game.wordLength"
          @draw-line="handleDrawLine"
          @complete-stroke="handleCompleteStroke"
          @clear-canvas="handleClearCanvas"
          @undo="game.undoDraw()"
        />
      </div>
      <div class="resizer" @pointerdown="startResizeRight"></div>
      <div class="game-right" :class="{ 'game-right-mobile': isMobile }" :style="isMobile ? {} : { width: rightWidth + 'px' }">
        <div class="game-guessed" v-if="game.guessedPlayers.length > 0">
          <span class="guessed-label">已猜对：</span>
          <span class="guessed-names">{{ guessedNames }}</span>
        </div>
        <div class="game-right-body">
          <ScoreBoard
            ref="scoreRef"
            :players="game.players"
            :scores="game.scores"
            :drawerId="game.drawerId"
            :myId="game.playerId"
            :isHost="game.isHost"
            @kick="kickPlayer"
          />
          <div class="game-chat">
            <ChatPanel />
          </div>
        </div>
      </div>
      <Transition name="panel">
        <div
          v-if="game.showItems && hasOtherPlayers"
          class="items-panel"
          :style="isMobile ? { left: '10px', right: '10px', bottom: '60px' } : { right: (rightWidth + 18) + 'px', bottom: '110px' }"
        >
          <div class="items-panel-header">
            <span>使用道具</span>
            <button class="items-panel-close" @click="closeItemsPanel">&times;</button>
          </div>
          <div class="items-panel-players">
            <div
              v-for="p in otherPlayers"
              :key="p.id"
              class="items-panel-player"
              :class="{ 'target-highlight': !!game.activeDragItem }"
              @dragover.prevent
              @drop.prevent="onBubbleDrop(p.id)"
              @click="onPlayerClick(p.id)"
            >
              <span class="player-avatar">{{ p.avatar || '👤' }}</span>
              <span class="player-name">{{ p.name }}</span>
            </div>
          </div>
          <div class="items-panel-divider"></div>
          <div class="items-panel-items">
            <div v-if="game.items.length === 0" class="items-panel-empty">暂无道具</div>
            <button
              v-for="item in uniqueItems"
              :key="item.emoji"
              class="items-panel-item"
              :class="{ 'item-selected': game.activeDragItem === item.emoji }"
              draggable="true"
              @dragstart="onItemDragStart($event, item.emoji)"
              @dragend="onItemDragEnd"
              @click="onItemSelect(item.emoji)"
            >
              <span class="item-icon">{{ item.emoji }}</span>
              <span v-if="item.count > 1" class="item-count">×{{ item.count }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="game.pendingRequests.length > 0 && game.isHost" class="join-request-overlay">
      <div class="join-request-card" v-for="req in game.pendingRequests" :key="req.requesterId">
        <p><strong>{{ req.requesterName }}</strong> 请求加入游戏</p>
        <div class="join-request-actions">
          <button class="btn-approve" @click="game.respondJoin(req.requesterId, true)">同意</button>
          <button class="btn-reject" @click="game.respondJoin(req.requesterId, false)">拒绝</button>
        </div>
      </div>
    </div>

    <div v-if="game.phase === 'round_end'" class="round-end-overlay">
      <div class="round-end-card">
        <h2>本轮结束！</h2>
        <p class="answer">答案是：<strong>{{ lastAnswer }}</strong></p>
        <div v-if="game.lastItemReward.length > 0" class="reward-row">
          <span class="reward-label">获得道具：</span>
          <span class="reward-items">{{ groupedReward }}</span>
        </div>
        <p class="next-hint">下一轮即将开始...</p>
      </div>
    </div>

    <div v-if="game.phase === 'game_over'" class="game-over-overlay">
      <div class="game-over-card">
        <h2>游戏结束！</h2>
        <div class="final-scores">
          <div
            v-for="(player, i) in game.gameOverScores"
            :key="player.id"
            class="final-score-row"
            :class="{ winner: i === 0 }"
          >
            <span class="final-rank">{{ ['🏆','🥈','🥉'][i] || `#${i+1}` }}</span>
            <span class="final-name">{{ player.name }}</span>
            <span class="final-score">{{ player.score }} 分</span>
          </div>
        </div>
        <button class="btn btn-back" @click="backToRoom">返回房间</button>
      </div>
    </div>

    <Transition name="rules">
      <div v-if="showRules" class="rules-overlay" @click.self="showRules = false">
        <div class="rules-card">
          <button class="rules-close" @click="showRules = false">&#x2715;</button>
          <h2 class="rules-title">&#x1F3C6; 积分规则</h2>
          <div class="rules-body">
            <div class="rule-row">
              <span class="rule-icon">&#x1F3C1;</span>
              <div class="rule-info">
                <span class="rule-label">第一个猜对</span>
                <span class="rule-score">+100 分</span>
              </div>
            </div>
            <div class="rule-row">
              <span class="rule-icon">&#x1F947;</span>
              <div class="rule-info">
                <span class="rule-label">后续猜对</span>
                <span class="rule-score">+50 分</span>
              </div>
            </div>
            <div class="rule-row">
              <span class="rule-icon">&#x1F3A8;</span>
              <div class="rule-info">
                <span class="rule-label">画手每有人猜对</span>
                <span class="rule-score">+50 分</span>
              </div>
            </div>
            <div class="rule-divider"></div>
            <p class="rule-note">每得一百分获得一个道具（第一、第二名额外+1）</p>
          </div>
        </div>
      </div>
    </Transition>

    <div class="flying-items-overlay">
      <div
        v-for="f in flyingItems"
        :key="f.id"
        :ref="el => onFlyEl(el, f)"
        class="flying-item"
      >{{ f.item }}</div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useNotificationStore } from '../stores/notification.js'
import DrawingCanvas from '../components/DrawingCanvas.vue'
import ChatPanel from '../components/ChatPanel.vue'
import ScoreBoard from '../components/ScoreBoard.vue'
import TimerBar from '../components/TimerBar.vue'
import WordSelector from '../components/WordSelector.vue'

const game = useGameStore()
const notify = useNotificationStore()
const canvasRef = ref(null)
const scoreRef = ref(null)
const lastAnswer = ref('')
const showRules = ref(false)
const rightWidth = ref(340)
const isMobile = ref(window.innerWidth < 768)
const showMobileMenu = ref(false)
let initialViewportHeight = 0
let initialInnerHeight = 0

function onResize() {
  isMobile.value = window.innerWidth < 768
}

function onVisualViewportResize() {
  if (!isMobile.value || !window.visualViewport) return
  const vh = window.visualViewport.height
  const gameEl = document.querySelector('.game')
  if (vh >= initialViewportHeight * 0.95) {
    if (gameEl) gameEl.style.height = ''
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && active.closest('.chat-panel')) {
      active.blur()
    }
  } else {
    if (gameEl) gameEl.style.height = vh + 'px'
  }
}

const drawerAvatar = computed(() => {
  const drawer = game.players.find(p => p.id === game.drawerId)
  return drawer?.avatar || '🎨'
})

function handleWordSelect(word) {
  game.selectWord(word)
}

function handleDrawLine(points, color, width) {
  game.drawLine(points, color, width)
}

function handleCompleteStroke(points, color, width) {
  game.completeStroke(points, color, width)
}

function handleClearCanvas() {
  game.clearCanvas()
}

const guessedNames = computed(() => {
  return game.guessedPlayers.map(id => {
    const p = game.players.find(p => p.id === id)
    return p?.name || '?'
  }).join(', ')
})

const wordHintDisplay = computed(() => {
  return game.wordLength ? '_ '.repeat(game.wordLength).trim() : ''
})

function kickPlayer(targetId) {
  game.kickPlayer(targetId)
}

const otherPlayers = computed(() => {
  return game.players.filter(p => p.id !== game.playerId)
})

const hasOtherPlayers = computed(() => otherPlayers.value.length > 0)

const groupedReward = computed(() => {
  const counts = {}
  for (const item of game.lastItemReward) {
    counts[item] = (counts[item] || 0) + 1
  }
  return Object.entries(counts).map(([emoji, n]) => n > 1 ? `${emoji}×${n}` : emoji).join(' ')
})

function onBubbleDrop(targetId) {
  const item = game.activeDragItem
  if (!item) return
  game.useItem(item, targetId)
  game.activeDragItem = ''
  game.showItems = false
}

function onPlayerClick(playerId) {
  const item = game.activeDragItem
  if (!item) return
  game.useItem(item, playerId)
  game.activeDragItem = ''
  game.showItems = false
}

function onItemSelect(item) {
  game.activeDragItem = game.activeDragItem === item ? '' : item
}

function onItemDragStart(e, item) {
  game.activeDragItem = item
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', item)
}

function onItemDragEnd() {
  game.activeDragItem = ''
}

function closeItemsPanel() {
  game.showItems = false
  game.activeDragItem = ''
}

const uniqueItems = computed(() => {
  const map = {}
  for (const emoji of game.items) {
    map[emoji] = (map[emoji] || 0) + 1
  }
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }))
})

function backToRoom() {
  if (game.isHost) {
    game.restartRoom()
  } else {
    game.navigateToRoom()
  }
}

async function confirmDisband() {
  const ok = await notify.showConfirm('解散房间', '确定解散房间？所有玩家将被移出。')
  if (ok) game.disbandRoom()
}

function startResizeRight(e) {
  e.preventDefault()
  const startX = e.clientX
  const startW = rightWidth.value
  const parent = document.querySelector('.game-content')
  const maxW = parent ? parent.getBoundingClientRect().width - 200 : 800

  function onMove(e) {
    const diff = e.clientX - startX
    rightWidth.value = Math.max(160, Math.min(maxW, startW - diff))
  }

  function onUp() {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onDrawLine(data) {
  if (canvasRef.value) {
    canvasRef.value.drawRemoteLine(data.points, data.color, data.width)
  }
}

function onClearCanvas() {
  if (canvasRef.value) {
    canvasRef.value.remoteClear()
  }
}

function onRoundEnded(data) {
  lastAnswer.value = data.word
}

function onGameStarted() {
  lastAnswer.value = ''
  resetGameCanvas()
}

function onRoundStarted() {
  game.lastItemReward = []
  resetGameCanvas()
}

function resetGameCanvas() {
  if (canvasRef.value) {
    canvasRef.value.resetCanvas()
  }
}

function onItemUsed(data) {
  if (scoreRef.value) {
    scoreRef.value.showEffect(data.targetId, data.item)
  }
  startFlyingItem(data.item, data.targetId)
}

const flyingItems = ref([])
let flyId = 0

function startFlyingItem(item, targetId) {
  const id = ++flyId
  flyingItems.value = [...flyingItems.value, { id, item, targetId }]
}

function onFlyEl(el, flight) {
  if (!el) return
  const targetEl = document.querySelector(`[data-player-id="${flight.targetId}"]`)
  if (!targetEl) {
    setTimeout(() => removeFlyingItem(flight.id), 800)
    return
  }
  const target = targetEl.getBoundingClientRect()
  const emojiSize = 22
  const startX = window.innerWidth / 2 - emojiSize
  const startY = window.innerHeight / 2 - emojiSize
  const endX = target.left + target.width / 2 - emojiSize
  const endY = target.top + target.height / 2 - emojiSize
  el.style.left = startX + 'px'
  el.style.top = startY + 'px'
  const anim = el.animate([
    { transform: 'scale(1.8) translate(0, 0)', opacity: 1, offset: 0 },
    { transform: 'scale(0.7) translate(' + (endX - startX) + 'px, ' + (endY - startY) + 'px)', opacity: 1, offset: 0.8 },
    { transform: 'scale(0.4) translate(' + (endX - startX) + 'px, ' + (endY - startY) + 'px)', opacity: 0, offset: 1 }
  ], {
    duration: 700,
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
    fill: 'forwards'
  })
  anim.onfinish = () => removeFlyingItem(flight.id)
}

function removeFlyingItem(id) {
  flyingItems.value = flyingItems.value.filter(f => f.id !== id)
}

onMounted(() => {
  const socket = game.socket
  if (socket) {
    socket.on('draw_line', onDrawLine)
    socket.on('clear_canvas', onClearCanvas)
    socket.on('round_ended', onRoundEnded)
    socket.on('game_started', onGameStarted)
    socket.on('round_started', onRoundStarted)
    socket.on('item_used', onItemUsed)
  }
  window.addEventListener('resize', onResize)
  if (isMobile.value) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (window.visualViewport) {
      initialViewportHeight = window.visualViewport.height
      initialInnerHeight = window.innerHeight
      window.visualViewport.addEventListener('resize', onVisualViewportResize)
    }
  }
})

watch(() => game.drawHistory, (history) => {
  nextTick(() => {
    if (!canvasRef.value) return
    canvasRef.value.remoteClear()
    for (const action of history) {
      if (action.type === 'clear_canvas') {
        canvasRef.value.remoteClear()
      } else if (action.type === 'draw_line') {
        canvasRef.value.drawRemoteLine(action.points, action.color, action.width)
      }
    }
  })
}, { immediate: true })

onUnmounted(() => {
  const socket = game.socket
  if (socket) {
    socket.off('draw_line', onDrawLine)
    socket.off('clear_canvas', onClearCanvas)
    socket.off('round_ended', onRoundEnded)
    socket.off('game_started', onGameStarted)
    socket.off('round_started', onRoundStarted)
    socket.off('item_used', onItemUsed)
  }
  window.removeEventListener('resize', onResize)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onVisualViewportResize)
  }
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.game {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  overflow: hidden;
}

.game-topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.round-info {
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.drawer-name {
  font-size: 15px;
  color: #f5a623;
}

.topbar-right {
  flex: 1;
  max-width: 400px;
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-rules {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-rules:hover {
  background: rgba(78, 205, 196, 0.2);
}

.btn-reset-layout {
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #778;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-reset-layout:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #aab;
}

.btn-end-round {
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(245, 166, 35, 0.1);
  color: #f5a623;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-end-round:hover {
  background: rgba(245, 166, 35, 0.2);
}

.btn-leave-game {
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #8899aa;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-leave-game:hover {
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
}

.btn-disband-game {
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(233, 69, 96, 0.1);
  color: #e94560;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-disband-game:hover {
  background: rgba(233, 69, 96, 0.2);
}

.game-content {
  flex: 1;
  display: flex;
  padding: 12px 6px;
  min-height: 0;
  position: relative;
}

.game-canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1a1a2e;
  min-width: 200px;
}

.items-panel {
  position: absolute;
  width: 220px;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  z-index: 60;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.items-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px 6px;
  font-size: 13px;
  color: #f5a623;
  font-weight: 600;
}

.items-panel-close {
  background: none;
  border: none;
  color: #667;
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.items-panel-close:hover {
  color: #fff;
}

.items-panel-players {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.items-panel-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid transparent;
  cursor: pointer;
  transition: background 0.1s, border-color 0.15s;
}

.items-panel-player:hover {
  background: rgba(78, 205, 196, 0.1);
  border-color: rgba(78, 205, 196, 0.3);
}

.items-panel-player.target-highlight {
  border-color: rgba(245, 166, 35, 0.4);
}

.player-avatar {
  font-size: 24px;
  line-height: 1;
}

.player-name {
  font-size: 14px;
  color: #ccc;
  line-height: 1;
}

.items-panel-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
}

.items-panel-items {
  padding: 6px 8px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.items-panel-empty {
  font-size: 12px;
  color: #556;
  font-style: italic;
  padding: 4px 2px;
}

.items-panel-item {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.1s, transform 0.1s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1;
}

.items-panel-item:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: scale(1.15);
}

.items-panel-item.item-selected {
  background: rgba(245, 166, 35, 0.2);
  border-color: rgba(245, 166, 35, 0.5);
  box-shadow: 0 0 12px rgba(245, 166, 35, 0.2);
}

.items-panel-item .item-icon {
  font-size: 26px;
  line-height: 1;
}

.items-panel-item .item-count {
  font-size: 12px;
  color: #f5a623;
  font-weight: 600;
  line-height: 1;
}

.panel-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.panel-leave-active {
  transition: opacity 0.15s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.panel-leave-to {
  opacity: 0;
}

.game-right {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin: 0 6px;
  position: relative;
}

.resizer {
  width: 12px;
  cursor: col-resize;
  flex-shrink: 0;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  touch-action: none;
}

.resizer::before {
  content: '';
  width: 3px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  pointer-events: none;
  transition: background 0.15s, height 0.15s;
}

.resizer:hover::before,
.resizer:active::before {
  background: rgba(78, 205, 196, 0.5);
  height: 80px;
}

.my-word {
  background: rgba(78, 205, 196, 0.12);
  border: 1px solid rgba(78, 205, 196, 0.2);
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #4ecdc4;
  text-align: center;
  flex-shrink: 0;
  margin: 10px 10px 0;
}

.my-word.waiting {
  background: rgba(245, 166, 35, 0.12);
  border-color: rgba(245, 166, 35, 0.2);
  color: #f5a623;
}

.my-word strong {
  font-size: 18px;
}

.my-word .word-strong {
  font-size: 28px;
  letter-spacing: 4px;
}

.my-word .word-hint {
  font-size: 28px;
  letter-spacing: 6px;
  font-weight: 800;
}

.join-request-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.join-request-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 24px 32px;
  text-align: center;
}

.join-request-card p {
  font-size: 16px;
  margin-bottom: 16px;
}

.join-request-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-approve {
  padding: 8px 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4ecdc4, #44b3ab);
  color: white;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.15s;
}

.btn-approve:hover {
  transform: translateY(-1px);
}

.btn-reject {
  padding: 8px 24px;
  border-radius: 8px;
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.15s;
}

.btn-reject:hover {
  background: rgba(233, 69, 96, 0.3);
}

.drawer-name.is-drawer {
  background: rgba(245, 166, 35, 0.12);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(245, 166, 35, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.drawer-icon {
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  font-size: 16px;
  flex-shrink: 0;
}

.drawer-label {
  font-weight: 700;
  font-size: 16px;
}

.drawer-me {
  font-weight: 400;
  font-size: 13px;
  color: #8899aa;
}

.game-guessed {
  background: rgba(78, 205, 196, 0.08);
  border: 1px solid rgba(78, 205, 196, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
}

.guessed-label { color: #4ecdc4; }
.guessed-names { color: #eee; }

.game-right-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.game-chat {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.game-guessed {
  flex-shrink: 0;
}

.round-end-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(5px);
}

.round-end-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
}

.round-end-card h2 { font-size: 28px; margin-bottom: 12px; }
.answer { font-size: 18px; color: #8899aa; }
.answer strong { color: #f5a623; font-size: 28px; }
.next-hint { margin-top: 20px; color: #667; font-size: 14px; }
.reward-row { margin-top: 16px; font-size: 18px; }
.reward-label { color: #8899aa; }
.reward-items { font-size: 32px; letter-spacing: 6px; vertical-align: middle; }

.pending-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #f5a623;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.game-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(8px);
}

.game-over-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 420px;
  width: 90vw;
}

.game-over-card h2 {
  font-size: 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #e94560, #f5a623);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.final-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.final-score-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.2s;
}

.final-score-row.winner {
  background: rgba(245, 166, 35, 0.1);
  border: 1px solid rgba(245, 166, 35, 0.2);
  transform: scale(1.05);
}

.final-rank { font-size: 24px; }
.final-name { flex: 1; font-size: 16px; font-weight: 600; text-align: left; }
.final-score { font-size: 20px; font-weight: 700; color: #4ecdc4; }

.btn-back {
  padding: 14px 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4ecdc4, #44b3ab);
  color: white;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
}

.rules-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
}

.rules-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 36px 40px;
  max-width: 380px;
  width: 90vw;
  position: relative;
}

.rules-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #667;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
}

.rules-close:hover {
  color: #e94560;
}

.rules-title {
  font-size: 22px;
  margin-bottom: 20px;
  text-align: center;
}

.rules-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 10px 14px;
}

.rule-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.rule-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
}

.rule-label {
  color: #ccd;
  font-size: 14px;
}

.rule-score {
  color: #4ecdc4;
  font-weight: 700;
  font-size: 16px;
}

.rule-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 2px 0;
}

.rule-note {
  color: #778;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.rules-enter-active {
  transition: opacity 0.2s ease;
}

.rules-leave-active {
  transition: opacity 0.15s ease;
}

.rules-enter-from,
.rules-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.flying-items-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}

.flying-item {
  position: fixed;
  font-size: 44px;
  line-height: 1;
  z-index: 1000;
  pointer-events: none;
}

/* ── Mobile responsive ── */
.canvas-top-info {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(6px);
  font-size: 11px;
  z-index: 5;
  flex-shrink: 0;
}

.cti-round {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 5px;
  font-weight: 600;
}

.cti-drawer {
  color: #f5a623;
  font-weight: 600;
}

.cti-timer {
  margin-left: auto;
  color: #4ecdc4;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cti-menu-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #aab;
  font-size: 16px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.4;
  font-weight: 700;
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.mobile-menu-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.mm-btn {
  padding: 12px 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #ccd;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.1s;
}

.mm-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.mm-leave {
  color: #e94560;
}

.mm-disband {
  color: #e94560;
  background: rgba(233, 69, 96, 0.08);
}

.mm-cancel {
  color: #667;
  font-weight: 500;
  font-size: 13px;
}

.menu-enter-active {
  transition: opacity 0.15s ease;
}

.menu-leave-active {
  transition: opacity 0.1s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .game-topbar {
    display: none;
  }

  .game-content {
    flex-direction: column;
    padding: 0;
    gap: 0;
  }

  .game-canvas-area {
    flex: 0 0 55%;
    min-height: 0;
    border-radius: 6px;
  }

  .resizer {
    display: none;
  }

  .game-right.game-right-mobile {
    width: 100% !important;
    flex: 1;
    min-height: 0;
    margin: 0;
    gap: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .game-right.game-right-mobile .game-guessed {
    display: none;
  }

  .game-right.game-right-mobile .game-right-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    padding-bottom: 80px;
    gap: 0;
  }

  .game-right.game-right-mobile .game-right-body > .game-chat {
    flex: 1;
    min-width: 0;
    border-radius: 0;
    border: none;
    border-left: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .round-end-card {
    padding: 20px 16px;
  }

  .round-end-card h2 {
    font-size: 18px;
  }

  .answer strong {
    font-size: 20px;
  }

  .reward-items {
    font-size: 24px;
  }

  .game-over-card {
    padding: 24px 16px;
  }

  .game-over-card h2 {
    font-size: 24px;
    margin-bottom: 16px;
  }

  .final-score-row {
    padding: 10px 12px;
  }

  .final-name {
    font-size: 14px;
  }

  .final-score {
    font-size: 16px;
  }

  .rules-card {
    padding: 20px 16px;
  }

  .rules-title {
    font-size: 18px;
  }

  .items-panel {
    width: auto;
    border-radius: 12px 12px 0 0;
    max-height: 45vh;
  }

  .items-panel-header {
    padding: 8px 10px 4px;
    font-size: 12px;
  }

  .items-panel-player {
    padding: 6px 8px;
  }

  .items-panel-items {
    padding: 4px 8px 8px;
    gap: 6px;
  }

  .items-panel-item .item-icon {
    font-size: 22px;
  }

  .my-word {
    margin: 4px 4px 0;
    padding: 3px 10px;
    font-size: 11px;
    border-radius: 6px;
  }

  .my-word strong {
    font-size: 12px;
  }

  .my-word .word-strong,
  .my-word .word-hint {
    font-size: 15px;
    letter-spacing: 3px;
  }

  :deep(.score-board) {
    flex: 1;
    min-width: 0;
    padding: 2px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  :deep(.score-board .score-title) {
    display: none;
  }

  :deep(.score-board .score-list) {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0;
  }

  :deep(.score-board .score-row) {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px 3px;
    border-radius: 3px;
    min-height: 0;
  }

  :deep(.score-board .score-avatar) {
    width: 14px;
    height: 14px;
    font-size: 10px;
    line-height: 14px;
  }

  :deep(.score-board .score-value) {
    min-width: auto;
    font-size: 9px;
    order: 1;
  }

  :deep(.score-board .score-unit) {
    font-size: 8px;
  }

  :deep(.score-board .score-name) {
    flex: 1;
    font-size: 9px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.score-board .score-me-badge),
  :deep(.score-board .score-host-badge),
  :deep(.score-board .score-drawer-badge) {
    font-size: 7px;
    padding: 0 2px;
  }

  :deep(.score-board .score-kick) {
    font-size: 8px;
    padding: 0 2px;
  }
}
</style>

<style>
@media (max-width: 767px) {
  .game-right.game-right-mobile .chat-panel .chat-messages {
    padding: 4px;
    gap: 2px;
  }

  .game-right.game-right-mobile .chat-panel .chat-input-row {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 3px 6px;
    gap: 3px;
    background: #1a1a2e;
    z-index: 50;
  }

  .game-right.game-right-mobile .chat-panel .chat-actions {
    gap: 3px;
  }

  .game-right.game-right-mobile .chat-panel .guess-input {
    padding: 4px 6px;
    font-size: 12px;
  }

  .game-right.game-right-mobile .chat-panel .send-btn {
    padding: 4px 10px;
    font-size: 12px;
  }

  .game-right.game-right-mobile .chat-panel .action-btn {
    font-size: 10px;
    padding: 3px 5px;
  }

  .game-right.game-right-mobile .chat-panel .message {
    font-size: 11px;
    padding: 3px 6px;
    line-height: 1.2;
  }

  .game-right.game-right-mobile .chat-panel .chat-image {
    max-width: 80px;
    max-height: 60px;
  }
}
</style>
