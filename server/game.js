import { getRoom, clearRoomTimers, playersToData, pickRandomItems } from './store.js'
import { getRandomWords } from './words.js'
import { ROOM_CONFIG } from './config.js'

let io = null

export function init(socketIo) {
  io = socketIo
}

function startTimer(roomId, duration, callback) {
  const room = getRoom(roomId)
  if (!room) return
  clearInterval(room.timer)
  room.timerStart = Date.now()
  room.timer = setInterval(() => {
    const remaining = duration - (Date.now() - room.timerStart) / 1000
    if (remaining <= 0) {
      clearInterval(room.timer)
      callback()
    } else {
      io.to(roomId).emit('timer_tick', Math.ceil(remaining))
    }
  }, 1000)
}

export function startGame(roomId) {
  const room = getRoom(roomId)
  if (!room) return

  if (room.players.length < ROOM_CONFIG.MIN_PLAYERS) return

  room.messages = []
  room.drawHistory = []
  const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5)
  room.gameState = {
    round: 0,
    maxRounds: room.configMaxRounds || ROOM_CONFIG.MAX_ROUNDS,
    drawerOrder: shuffledPlayers.map(p => p.id),
    scores: Object.fromEntries(room.players.map(p => [p.id, 0])),
    guessedPlayers: new Set(),
    playerItems: Object.fromEntries(room.players.map(p => [p.id, []]))
  }

  io.to(roomId).emit('game_started', {
    players: playersToData(room.players),
    maxRounds: room.gameState.maxRounds
  })

  startRound(roomId)
}

export function startRound(roomId) {
  const room = getRoom(roomId)
  if (!room || !room.gameState) return

  room.gameState.guessedPlayers = new Set()
  room.gameState.round++
  room.drawHistory = []

  if (room.gameState.round > room.gameState.maxRounds) {
    endGame(roomId)
    return
  }

  const drawerIndex = (room.gameState.round - 1) % room.gameState.drawerOrder.length
  room.currentDrawer = room.gameState.drawerOrder[drawerIndex]
  const wordOptions = getRandomWords(3)
  room.wordOptions = wordOptions.map(w => w.word)
  room.currentWord = null
  room.phase = 'selecting_word'

  if (!room.gameState.playerItems[room.currentDrawer]) {
    room.gameState.playerItems[room.currentDrawer] = []
  }
  const newDrawerItems = pickRandomItems(2)
  room.gameState.playerItems[room.currentDrawer] = [...room.gameState.playerItems[room.currentDrawer], ...newDrawerItems]
  io.to(room.currentDrawer).emit('items_update', { items: room.gameState.playerItems[room.currentDrawer], newItems: newDrawerItems })

  const drawerPlayer = room.players.find(p => p.id === room.currentDrawer)

  room.messages.push({ type: 'system', text: `第 ${room.gameState.round}/${room.gameState.maxRounds} 轮 - ${drawerPlayer?.name || '未知'} 正在选择词语...` })

  io.to(roomId).emit('round_started', {
    round: room.gameState.round,
    maxRounds: room.gameState.maxRounds,
    drawerId: room.currentDrawer,
    drawerName: drawerPlayer?.name || '',
    phase: 'selecting_word',
    selectTime: ROOM_CONFIG.SELECT_TIME
  })

  io.to(room.currentDrawer).emit('word_options', {
    words: wordOptions.map(w => w.word)
  })

  room.timerStart = Date.now()
  startTimer(roomId, ROOM_CONFIG.SELECT_TIME, () => {
    if (room.phase === 'selecting_word') {
      setWord(roomId, wordOptions[0].word)
    }
  })
}

export function setWord(roomId, word) {
  const room = getRoom(roomId)
  if (!room) return

  room.currentWord = word
  room.wordOptions = null
  room.phase = 'drawing'
  room.messages.push({ type: 'system', text: `画师已选好词语（${word.length}个字），开始画画！` })
  io.to(roomId).emit('word_selected', { wordLength: word.length })
  io.to(room.currentDrawer).emit('your_word', { word })

  room.timerStart = Date.now()
  startTimer(roomId, ROOM_CONFIG.ROUND_TIME, () => {
    endRound(roomId, 'timeout')
  })
}

export function endRound(roomId, reason) {
  const room = getRoom(roomId)
  if (!room) return

  clearRoomTimers(room)

  room.messages.push({ type: 'system', text: `本轮结束！答案是：${room.currentWord}` })

  io.to(roomId).emit('round_ended', {
    word: room.currentWord,
    drawerId: room.currentDrawer,
    scores: room.gameState?.scores,
    guessedPlayers: [...(room.gameState?.guessedPlayers || [])],
    reason
  })

  room.phase = 'round_end'

  setTimeout(() => {
    if (getRoom(roomId)) {
      startRound(roomId)
    }
  }, 4000)
}

function endGame(roomId) {
  const room = getRoom(roomId)
  if (!room) return

  clearRoomTimers(room)

  const scores = room.gameState?.scores || {}
  const sortedPlayers = [...room.players]
    .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
    .map(p => ({ id: p.id, name: p.name, score: scores[p.id] || 0 }))

  io.to(roomId).emit('game_over', { scores: sortedPlayers })
  room.phase = 'game_over'
  room.gameState = null
  room.currentDrawer = null
  room.currentWord = null
  room.wordOptions = null
}
