import { getRoom, createRoom, deleteRoom, bindSession, unbindSession, sessionExists, addPlayer, removePlayer, clearRoomTimers, playersToData } from '../store.js'
import { startRound } from '../game.js'
import { ROOM_CONFIG } from '../config.js'

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

  socket.on('create_room', ({ name, sessionId }) => {
    if (!sessionId) {
      socket.emit('error', { message: '会话异常，请刷新页面' })
      return
    }
    if (sessionExists(sessionId)) {
      socket.emit('error', { message: '你已经在一个房间中了' })
      return
    }

    const roomId = String(Math.floor(1000 + Math.random() * 9000))
    const room = createRoom(roomId, sessionId)
    bindSession(sessionId, roomId)
    socket.sessionId = sessionId

    addPlayer(room, { id: socket.id, name, isHost: true, score: 0, sessionId })
    socket.join(roomId)
    socket.roomId = roomId

    socket.emit('room_created', {
      roomId,
      playerId: socket.id,
      players: playersToData(room.players)
    })
  })

  socket.on('join_room', ({ roomId, name, sessionId }) => {
    if (!sessionId) {
      socket.emit('error', { message: '会话异常，请刷新页面' })
      return
    }

    const room = getRoom(roomId)
    if (!room) {
      socket.emit('error', { message: '房间不存在' })
      return
    }

    if (sessionExists(sessionId)) {
      socket.emit('error', { message: '你已经在一个房间中了' })
      return
    }

    if (room.players.length >= ROOM_CONFIG.MAX_PLAYERS) {
      socket.emit('error', { message: '房间已满' })
      return
    }
    if (room.phase === 'game_over') {
      socket.emit('error', { message: '游戏已结束' })
      return
    }

    if (room.phase !== 'waiting') {
      const host = room.players.find(p => p.isHost)
      if (!host) {
        socket.emit('error', { message: '房间异常，没有房主' })
        return
      }
      room.pendingJoins.push({ id: socket.id, name, sessionId })
      socket.sessionId = sessionId
      io.to(host.id).emit('join_request', { requesterId: socket.id, requesterName: name })
      socket.emit('join_pending', { message: '正在等待房主审批...' })
      return
    }

    joinPlayerToRoom(socket, room, name, sessionId)
  })

  socket.on('respond_join', ({ requesterId, approved }) => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player?.isHost) return

    const idx = room.pendingJoins.findIndex(p => p.id === requesterId)
    if (idx === -1) return
    const pending = room.pendingJoins[idx]
    room.pendingJoins.splice(idx, 1)

    if (approved) {
      const targetSocket = io.sockets.sockets.get(requesterId)
      if (targetSocket) {
        if (sessionExists(pending.sessionId)) {
          io.to(targetSocket.id).emit('join_rejected', { message: '你已经在一个房间中了' })
        } else {
          joinPlayerToRoom(targetSocket, room, pending.name, pending.sessionId)
        }
      }
    } else {
      io.to(requesterId).emit('join_rejected', { message: '房主拒绝了你的加入请求' })
    }
  })

  socket.on('leave_room', () => {
    const room = getRoom(socket.roomId)
    if (!room) return

    const removedPlayer = removePlayer(room, socket.id)
    if (!removedPlayer) return

    if (removedPlayer.sessionId) unbindSession(removedPlayer.sessionId)
    room.pendingJoins = room.pendingJoins.filter(p => p.id !== socket.id)
    socket.leave(room.id)
    socket.roomId = null

    if (room.players.length === 0) {
      clearRoomTimers(room)
      deleteRoom(room.id)
      return
    }

    if (removedPlayer.isHost) {
      room.players[0].isHost = true
      io.to(room.id).emit('host_changed', { newHostId: room.players[0].id })
    }

    io.to(room.id).emit('player_left', {
      playerId: socket.id,
      name: removedPlayer.name,
      players: playersToData(room.players)
    })

    interruptIfAlone(io, room)
    handleDrawerLeft(io, room, socket.id)
  })

  socket.on('disband_room', () => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player?.isHost) return

    clearRoomTimers(room)
    room.players.forEach(p => { if (p.sessionId) unbindSession(p.sessionId) })
    room.pendingJoins.forEach(p => { if (p.sessionId) unbindSession(p.sessionId) })
    io.to(room.id).emit('room_disbanded')
    deleteRoom(room.id)
  })

  socket.on('kick_player', ({ targetId }) => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player?.isHost) return
    if (targetId === socket.id) return

    const targetPlayer = removePlayer(room, targetId)
    if (!targetPlayer) return

    if (targetPlayer.sessionId) unbindSession(targetPlayer.sessionId)
    room.pendingJoins = room.pendingJoins.filter(p => p.id !== targetId)

    io.to(targetId).emit('kicked', { message: '你已被房主移出房间' })
    io.to(room.id).emit('player_left', {
      playerId: targetId,
      name: targetPlayer.name,
      players: playersToData(room.players)
    })

    interruptIfAlone(io, room)
    handleDrawerLeft(io, room, targetId)
  })
}

function joinPlayerToRoom(socket, room, name, sessionId) {
  if (sessionId) {
    bindSession(sessionId, room.id)
    socket.sessionId = sessionId
  }
  addPlayer(room, { id: socket.id, name, isHost: false, score: 0, sessionId })
  socket.join(room.id)
  socket.roomId = room.id

  const gameState = buildGameState(room)

  socket.emit('room_joined', {
    roomId: room.id,
    playerId: socket.id,
    players: playersToData(room.players),
    gameState
  })

  const self = room.players.find(p => p.id === socket.id)
  socket.to(room.id).emit('player_joined', { id: socket.id, name, avatar: self?.avatar })
}

function buildGameState(room) {
  if (room.phase === 'waiting' || !room.gameState) return null
  const gs = {
    phase: room.phase,
    round: room.gameState.round,
    maxRounds: room.gameState.maxRounds,
    drawerId: room.currentDrawer,
    drawerName: room.players.find(p => p.id === room.currentDrawer)?.name || '',
    scores: room.gameState.scores,
    guessedPlayers: [...room.gameState.guessedPlayers],
    currentWordLength: room.currentWord ? room.currentWord.length : 0,
    timer: room.phase === 'selecting_word' ? ROOM_CONFIG.SELECT_TIME : ROOM_CONFIG.ROUND_TIME,
    wordOptions: null,
    messages: room.messages,
    drawHistory: room.drawHistory
  }
  if (room.phase === 'selecting_word') gs.wordOptions = []
  return gs
}

function handleDrawerLeft(io, room, leavingPlayerId) {
  if (leavingPlayerId === room.currentDrawer && room.phase !== 'waiting') {
    clearRoomTimers(room)
    io.to(room.id).emit('round_ended', {
      word: room.currentWord || '未知',
      reason: 'drawer_left'
    })
    setTimeout(() => startRound(room.id), 3000)
  }
}
