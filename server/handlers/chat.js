import { getRoom, pickRandomItems } from '../store.js'
import { endRound } from '../game.js'
import { ROOM_CONFIG } from '../config.js'

export function register(io, socket) {

  socket.on('send_chat', ({ text }) => {
    const room = getRoom(socket.roomId)
    if (!room) return

    const player = room.players.find(p => p.id === socket.id)
    const name = player?.name || 'unknown'

    const isDrawer = socket.id === room.currentDrawer
    let displayText = text

    if (!isDrawer && room.currentWord && !room.gameState?.guessedPlayers.has(socket.id)) {
      const isCorrect = text.trim().toLowerCase() === room.currentWord.toLowerCase()
      if (isCorrect) {
        displayText = '****'
        room.gameState.guessedPlayers.add(socket.id)
        const isFirst = room.gameState.guessedPlayers.size === 1
        const guesserScore = isFirst ? ROOM_CONFIG.POINTS_CORRECT_FIRST : ROOM_CONFIG.POINTS_CORRECT
        room.gameState.scores[socket.id] = (room.gameState.scores[socket.id] || 0) + guesserScore

        const drawerScore = room.gameState.scores[room.currentDrawer] || 0
        room.gameState.scores[room.currentDrawer] = drawerScore + ROOM_CONFIG.POINTS_DRAWER_PER_GUESS

        const guessMsg = isFirst ? `${name} 猜对了！+100分！` : `${name} 也猜对了！+50分！`
        room.messages.push({ type: 'system', text: guessMsg })

        const newItems = pickRandomItems(isFirst ? 2 : 1)
        room.gameState.playerItems[socket.id] = [...(room.gameState.playerItems[socket.id] || []), ...newItems]

        io.to(socket.roomId).emit('correct_guess', {
          playerId: socket.id,
          playerName: name,
          isFirst,
          scores: room.gameState.scores,
          guessedPlayers: [...room.gameState.guessedPlayers]
        })

        io.to(socket.id).emit('items_update', { items: room.gameState.playerItems[socket.id], newItems })

        const nonDrawers = room.players.filter(p => p.id !== room.currentDrawer)
        if (room.gameState.guessedPlayers.size >= nonDrawers.length) {
          endRound(socket.roomId, 'all_guessed')
        }
      }
    }

    room.messages.push({ type: 'guess', name, text: displayText })
    io.to(socket.roomId).emit('chat_message', { name, text: displayText })
  })

  socket.on('send_image', ({ imageData, filename }) => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    const msg = { type: 'image', name: player.name, imageData, filename: filename || '图片' }
    room.messages.push(msg)
    io.to(socket.roomId).emit('chat_message', msg)
  })

  socket.on('send_sticker', ({ sticker }) => {
    const room = getRoom(socket.roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    const msg = { type: 'sticker', name: player.name, sticker }
    room.messages.push(msg)
    io.to(socket.roomId).emit('chat_message', msg)
  })

  socket.on('use_item', ({ item, targetId }) => {
    const room = getRoom(socket.roomId)
    if (!room?.gameState) return
    const items = room.gameState.playerItems[socket.id]
    if (!items || !items.length) return
    const idx = items.indexOf(item)
    if (idx === -1) return
    items.splice(idx, 1)
    io.to(socket.roomId).emit('item_used', { item, sourceId: socket.id, targetId })
    io.to(socket.id).emit('items_update', { items })

    const sourcePlayer = room.players.find(p => p.id === socket.id)
    const targetPlayer = room.players.find(p => p.id === targetId)
    const sourceName = sourcePlayer?.name || 'unknown'
    const targetName = targetPlayer?.name || 'unknown'
    const useMsg = `${sourceName} 对 ${targetName} 使用了 ${item}`
    room.messages.push({ type: 'system', text: useMsg })
    io.to(socket.roomId).emit('chat_message', { type: 'system', text: useMsg })
  })
}
