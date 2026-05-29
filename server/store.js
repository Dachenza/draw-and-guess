const rooms = new Map()
const sessionRooms = new Map()
const pendingDisconnects = new Map() // sessionId -> { timer, room, playerId }
const RECONNECT_TIMEOUT = 2000

const AVATARS = ['🐶','🐱','🐼','🐸','🦊','🐰','🦁','🐯','🦄','🐧','🐳','🦋','🐙','🦖','🐲','🦚','🐮','🐷','🐵','🦉','🐺','🐨','🦧','🐔']
export const ITEMS = ['💥','🔥','💩','❤️','🎉','⚡','🧨','🍕','🦴','🎨','💎','🧊','🌮','🍜']

export function pickRandomItems(n) {
  const result = []
  for (let i = 0; i < n; i++) {
    result.push(ITEMS[Math.floor(Math.random() * ITEMS.length)])
  }
  return result
}

export function playersToData(players) {
  return players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, avatar: p.avatar }))
}

export function pickAvatar(room) {
  const used = new Set(room.players.map(p => p.avatar))
  const pool = AVATARS.filter(a => !used.has(a))
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

export function addPendingDisconnect(sessionId, room, playerId, onTimeout) {
  cancelPendingDisconnect(sessionId)
  const timer = setTimeout(() => {
    pendingDisconnects.delete(sessionId)
    onTimeout()
  }, RECONNECT_TIMEOUT)
  pendingDisconnects.set(sessionId, { timer, room, playerId })
}

export function cancelPendingDisconnect(sessionId) {
  const entry = pendingDisconnects.get(sessionId)
  if (entry) {
    clearTimeout(entry.timer)
    pendingDisconnects.delete(sessionId)
    return entry
  }
  return null
}

export function findPlayerBySession(room, sessionId) {
  return room.players.find(p => p.sessionId === sessionId)
}

export function bindSession(sessionId, roomId) {
  if (sessionRooms.has(sessionId)) return false
  sessionRooms.set(sessionId, roomId)
  return true
}

export function unbindSession(sessionId) {
  sessionRooms.delete(sessionId)
}

export function sessionExists(sessionId) {
  return sessionRooms.has(sessionId)
}

export function createRoom(roomId, hostSessionId) {
  const room = {
    id: roomId,
    players: [],
    gameState: null,
    currentDrawer: null,
    currentWord: null,
    wordOptions: null,
    timer: null,
    phase: 'waiting',
    pendingJoins: [],
    hostSessionId,
    messages: [],
    drawHistory: []
  }
  rooms.set(roomId, room)
  return room
}

export function getRoom(roomId) {
  return rooms.get(roomId)
}

export function deleteRoom(roomId) {
  const room = rooms.get(roomId)
  if (room) {
    clearRoomTimers(room)
    room.players.forEach(p => { if (p.sessionId) unbindSession(p.sessionId) })
    room.pendingJoins.forEach(p => { if (p.sessionId) unbindSession(p.sessionId) })
  }
  rooms.delete(roomId)
}

export function addPlayer(room, playerData) {
  const player = { ...playerData, avatar: pickAvatar(room) }
  room.players.push(player)
  return player
}

export function removePlayer(room, playerId) {
  const idx = room.players.findIndex(p => p.id === playerId)
  if (idx === -1) return null
  const [player] = room.players.splice(idx, 1)
  return player
}

export function clearRoomTimers(room) {
  if (room.timer) {
    clearInterval(room.timer)
    room.timer = null
  }
}
