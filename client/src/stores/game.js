import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { getSessionId, getSavedRoom, clearRoomInfo } from '../services/credential.js'
import { registerAll } from '../handlers/index.js'
import router from '../router/index.js'

export const useGameStore = defineStore('game', () => {
  const sessionId = getSessionId()
  const socket = ref(null)
  const playerId = ref('')
  const roomId = ref('')
  const players = ref([])
  const phase = ref('waiting')
  const round = ref(0)
  const maxRounds = ref(3)
  const drawerId = ref('')
  const drawerName = ref('')
  const currentWord = ref('')
  const wordLength = ref(0)
  const wordOptions = ref([])
  const myTurn = ref(false)
  const scores = ref({})
  const timer = ref(0)
  const messages = ref([])
  const guessedPlayers = ref([])
  const gameOverScores = ref([])
  const isHost = ref(false)
  const selectTime = ref(10)
  const joinPending = ref(false)
  const pendingRequests = ref([])
  const drawHistory = ref([])
  const items = ref([])
  const lastItemReward = ref([])
  const activeDragItem = ref('')
  const showItems = ref(false)

  function connect() {
    if (socket.value?.connected) return

    socket.value = io(window.location.origin, {
      transports: ['websocket', 'polling']
    })

    registerAll(socket.value)

    socket.value.on('connect', () => {
      const saved = getSavedRoom()
      if (saved && (roomId.value || window.location.pathname !== '/')) {
        socket.value.emit('reconnect', { sessionId })
      }
    })
  }

  function createRoom(name) {
    clearRoomInfo()
    connect()
    socket.value.emit('create_room', { name, sessionId })
  }

  function joinRoom(roomId, name) {
    clearRoomInfo()
    connect()
    socket.value.emit('join_room', { roomId, name, sessionId })
  }

  function startGame(maxRounds) {
    socket.value.emit('start_game', { maxRounds })
  }

  function selectWord(word) {
    socket.value.emit('select_word', { word })
  }

  function drawLine(points, color, width) {
    socket.value?.emit('draw_line', { points, color, width })
  }

  function completeStroke(points, color, width) {
    socket.value?.emit('complete_stroke', { points, color, width })
  }

  function clearCanvas() {
    socket.value.emit('clear_canvas')
  }

  function useItem(item, targetId) {
    socket.value?.emit('use_item', { item, targetId })
  }

  function sendChat(text) {
    socket.value?.emit('send_chat', { text })
  }

  function sendImage(imageData, filename) {
    socket.value?.emit('send_image', { imageData, filename })
  }

  function sendSticker(sticker) {
    socket.value?.emit('send_sticker', { sticker })
  }

  function addMessage(msg) {
    messages.value.push(msg)
  }

  function restartRoom() {
    socket.value?.emit('restart_room')
  }

  function endRoundEarly() {
    socket.value?.emit('end_round_early')
  }

  function undoDraw() {
    socket.value?.emit('undo_draw')
  }

  function disbandRoom() {
    socket.value?.emit('disband_room')
  }

  function kickPlayer(targetId) {
    socket.value?.emit('kick_player', { targetId })
  }

  function respondJoin(requesterId, approved) {
    socket.value?.emit('respond_join', { requesterId, approved })
    pendingRequests.value = pendingRequests.value.filter(r => r.requesterId !== requesterId)
  }

  function backToLobby() {
    if (socket.value?.connected && roomId.value) {
      socket.value?.emit('leave_room', { sessionId })
    }
    resetState()
    clearRoomInfo()
    router.push('/')
  }

  function navigateToRoom() {
    router.push(`/room/${roomId.value}`)
  }

  function resetState() {
    phase.value = 'waiting'
    round.value = 0
    drawerId.value = ''
    drawerName.value = ''
    currentWord.value = ''
    wordLength.value = 0
    wordOptions.value = []
    myTurn.value = false
    scores.value = {}
    timer.value = 0
    messages.value = []
    guessedPlayers.value = []
    gameOverScores.value = []
    isHost.value = false
    joinPending.value = false
    pendingRequests.value = []
    drawHistory.value = []
    roomId.value = ''
    playerId.value = ''
    players.value = []
    maxRounds.value = 3
    selectTime.value = 10
    items.value = []
    lastItemReward.value = []
    activeDragItem.value = ''
    showItems.value = false
  }

  // Auto-connect on page load to reconnect to room
  const saved = getSavedRoom()
  if (saved) {
    connect()
  }

  return {
    sessionId, socket, playerId, roomId, players, phase, round, maxRounds,
    drawerId, drawerName, currentWord, wordLength, wordOptions,
    myTurn, scores, timer, messages, guessedPlayers, gameOverScores,
    isHost, selectTime, joinPending, pendingRequests, drawHistory,
    items, lastItemReward, activeDragItem, showItems,
    connect, createRoom, joinRoom, startGame, selectWord,
    drawLine, completeStroke, clearCanvas, sendChat, addMessage, restartRoom, endRoundEarly, undoDraw,
    disbandRoom, kickPlayer, respondJoin, useItem, sendImage, sendSticker,
    backToLobby, navigateToRoom, resetState
  }
})
