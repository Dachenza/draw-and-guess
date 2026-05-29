import { getRoom } from '../store.js'
import { startGame, setWord, endRound } from '../game.js'
import { clearRoomTimers } from '../store.js'
import { ROOM_CONFIG } from '../config.js'

export function register(io, socket) {

  socket.on('start_game', ({ maxRounds } = {}) => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player?.isHost) {
      socket.emit('error', { message: '只有房主可以开始游戏' })
      return
    }
    room.configMaxRounds = maxRounds || ROOM_CONFIG.MAX_ROUNDS
    startGame(socket.roomId)
  })

  socket.on('select_word', ({ word }) => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    if (room.phase !== 'selecting_word') return
    setWord(socket.roomId, word)
  })

  socket.on('end_round_early', () => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    if (room.phase !== 'drawing') return
    endRound(socket.roomId, 'drawer_ended')
  })

  socket.on('restart_room', () => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player?.isHost) return

    clearRoomTimers(room)
    room.phase = 'waiting'
    room.gameState = null
    room.currentDrawer = null
    room.currentWord = null
    room.players.forEach(p => { p.score = 0 })

    io.to(socket.roomId).emit('room_reset')
  })
}
