import { getRoom, addPendingDisconnect, cancelPendingDisconnect, deleteRoom, clearRoomTimers, unbindSession, findPlayerBySession, playersToData } from '../store.js'
import { startRound } from '../game.js'

function interruptIfAlone(io, room) {
  if (room.phase !== 'waiting' && room.players.length < 2) {
    clearRoomTimers(room)
    room.phase = 'waiting'
    room.gameState = null
    room.currentDrawer = null
    room.currentWord = null
    io.to(room.id).emit('game_interrupted')
  }
}

export function register(io, socket) {

  socket.on('reconnect', ({ sessionId }) => {
    if (!sessionId) {
      socket.emit('error', { message: '会话异常' })
      return
    }

    const entry = cancelPendingDisconnect(sessionId)
    if (!entry) {
      socket.emit('error', { message: '未找到玩家数据，请重新加入房间' })
      return
    }

    const room = entry.room
    const player = findPlayerBySession(room, sessionId)
    if (!player) {
      socket.emit('error', { message: '未找到玩家数据，请重新加入房间' })
      return
    }

    const oldId = player.id
    player.id = socket.id
    socket.roomId = room.id
    socket.sessionId = sessionId
    socket.join(room.id)

    if (room.gameState?.scores) {
      const score = room.gameState.scores[oldId]
      if (score !== undefined) {
        room.gameState.scores[socket.id] = score
        if (oldId !== socket.id) delete room.gameState.scores[oldId]
      }
    }
    if (room.currentDrawer === oldId) {
      room.currentDrawer = socket.id
    }
    if (room.gameState?.drawerOrder) {
      const idx = room.gameState.drawerOrder.indexOf(oldId)
      if (idx !== -1) room.gameState.drawerOrder[idx] = socket.id
    }
    if (room.gameState?.guessedPlayers?.has(oldId)) {
      room.gameState.guessedPlayers.delete(oldId)
      room.gameState.guessedPlayers.add(socket.id)
    }

    const gameState = buildGameState(room)
    socket.emit('room_joined', {
      roomId: room.id,
      playerId: socket.id,
      players: playersToData(room.players),
      gameState
    })

    if (room.currentDrawer === socket.id) {
      if (room.phase === 'selecting_word' && room.wordOptions) {
        socket.emit('word_options', { words: room.wordOptions })
      } else if (room.phase === 'drawing' && room.currentWord) {
        socket.emit('your_word', { word: room.currentWord })
      }
    }
  })

  socket.on('disconnect', () => {
    const roomId = socket.roomId
    if (!roomId) return

    const room = getRoom(roomId)
    if (!room) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player) return

    // If player has a sessionId, give them a grace period to reconnect
    if (player.sessionId) {
      addPendingDisconnect(player.sessionId, room, player.id, () => {
        const idx = room.players.findIndex(p => p.id === player.id)
        if (idx === -1) return
        const [removed] = room.players.splice(idx, 1)

        if (removed.sessionId) unbindSession(removed.sessionId)

        if (room.players.length === 0) {
          clearRoomTimers(room)
          deleteRoom(roomId)
          return
        }

        if (removed.isHost) {
          room.players[0].isHost = true
          io.to(roomId).emit('host_changed', { newHostId: room.players[0].id })
        }

        io.to(roomId).emit('player_left', {
          playerId: player.id,
          name: removed.name,
          players: playersToData(room.players)
        })

        interruptIfAlone(io, room)

        if (player.id === room.currentDrawer && room.phase !== 'waiting') {
          clearRoomTimers(room)
          io.to(roomId).emit('round_ended', {
            word: room.currentWord || '未知',
            reason: 'drawer_left'
          })
          setTimeout(() => startRound(roomId), 3000)
        }
      })
    } else {
      // No sessionId, remove immediately
      const idx = room.players.findIndex(p => p.id === socket.id)
      if (idx === -1) return
      const [removed] = room.players.splice(idx, 1)

      if (room.players.length === 0) {
        clearRoomTimers(room)
        deleteRoom(roomId)
        return
      }

      if (removed.isHost) {
        room.players[0].isHost = true
        io.to(roomId).emit('host_changed', { newHostId: room.players[0].id })
      }

      io.to(roomId).emit('player_left', {
        playerId: socket.id,
        name: removed.name,
        players: playersToData(room.players)
      })

      interruptIfAlone(io, room)

      if (socket.id === room.currentDrawer && room.phase !== 'waiting') {
        clearRoomTimers(room)
        io.to(roomId).emit('round_ended', {
          word: room.currentWord || '未知',
          reason: 'drawer_left'
        })
        setTimeout(() => startRound(roomId), 3000)
      }
    }
  })
}

function buildGameState(room) {
  if (room.phase === 'waiting' || !room.gameState) return null
  return {
    phase: room.phase,
    round: room.gameState.round,
    maxRounds: room.gameState.maxRounds,
    drawerId: room.currentDrawer,
    drawerName: room.players.find(p => p.id === room.currentDrawer)?.name || '',
    scores: room.gameState.scores,
    guessedPlayers: [...room.gameState.guessedPlayers],
    currentWordLength: room.currentWord ? room.currentWord.length : 0,
    timer: room.phase === 'selecting_word' ? 10 : 60,
    wordOptions: room.phase === 'selecting_word' ? [] : null,
    messages: room.messages,
    drawHistory: room.drawHistory
  }
}
