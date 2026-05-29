import { useGameStore } from '../stores/game.js'
import { useNotificationStore } from '../stores/notification.js'

export function register(socket) {

  socket.on('room_disbanded', () => {
    const store = useGameStore()
    store.messages = [...store.messages, { type: 'system', text: '房间已被房主解散' }]
    useNotificationStore().showToast('房间已被房主解散', 'warning')
    store.backToLobby()
  })

  socket.on('join_pending', () => {
    useGameStore().joinPending = true
  })

  socket.on('join_rejected', (data) => {
    const store = useGameStore()
    store.joinPending = false
    useNotificationStore().showToast(data.message, 'warning')
    store.backToLobby()
  })

  socket.on('join_request', (data) => {
    const store = useGameStore()
    store.pendingRequests = [...store.pendingRequests, data]
  })

  socket.on('kicked', (data) => {
    useNotificationStore().showToast(data.message, 'error')
    useGameStore().backToLobby()
  })

  socket.on('error', (data) => {
    if (data.message === '未找到玩家数据，请重新加入房间' || data.message === '找不到玩家信息') {
      useGameStore().backToLobby()
    } else if (data.message === '房间不存在') {
      useNotificationStore().showToast('房间不存在', 'error')
      useGameStore().backToLobby()
    } else {
      useNotificationStore().showToast(data.message, 'error')
    }
  })
}
