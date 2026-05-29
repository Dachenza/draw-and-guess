import { useGameStore } from '../stores/game.js'
import { useNotificationStore } from '../stores/notification.js'
import { saveRoomInfo } from '../services/credential.js'
import router from '../router/index.js'

export function register(socket) {

  socket.on('room_created', (data) => {
    const store = useGameStore()
    store.playerId = data.playerId
    store.roomId = data.roomId
    store.players = data.players
    store.isHost = true
    saveRoomInfo(data.roomId, data.players.find(p => p.id === data.playerId)?.name || '')
    router.push(`/room/${data.roomId}`)
  })

  socket.on('room_joined', (data) => {
    const store = useGameStore()
    store.playerId = data.playerId
    store.roomId = data.roomId
    store.players = data.players
    store.isHost = data.players.find(p => p.id === data.playerId)?.isHost || false
    const myName = data.players.find(p => p.id === data.playerId)?.name || ''
    saveRoomInfo(data.roomId, myName)

    if (data.gameState) {
      const gs = data.gameState
      store.phase = gs.phase
      store.round = gs.round
      store.maxRounds = gs.maxRounds
      store.drawerId = gs.drawerId
      store.drawerName = gs.drawerName
      store.myTurn = gs.drawerId === data.playerId
      store.scores = gs.scores || {}
      store.timer = gs.timer || 0
      store.guessedPlayers = gs.guessedPlayers || []
      store.wordLength = gs.currentWordLength || 0
      store.wordOptions = gs.wordOptions || []
      store.messages = gs.messages || [{ type: 'system', text: '你已中途加入游戏！' }]
      store.drawHistory = gs.drawHistory || []
      router.push(`/game/${data.roomId}`)
    } else {
      router.push(`/room/${data.roomId}`)
    }
  })

  socket.on('player_joined', (data) => {
    const store = useGameStore()
    store.players = [...store.players, { id: data.id, name: data.name, isHost: false, avatar: data.avatar }]
    store.messages = [...store.messages, { type: 'system', text: `${data.name} 加入了房间` }]
  })

  socket.on('player_left', (data) => {
    const store = useGameStore()
    store.players = data.players || store.players.filter(p => p.id !== data.playerId)
    const leftPlayer = store.players.find(p => p.id === data.playerId)
    store.messages = [...store.messages, { type: 'system', text: `${data.name || '玩家'} 离开了房间` }]
    useNotificationStore().showToast(`${data.name || '玩家'} 离开了房间`, 'info')
  })

  socket.on('host_changed', (data) => {
    const store = useGameStore()
    store.isHost = data.newHostId === store.playerId
  })
}
