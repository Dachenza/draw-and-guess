const CREDENTIAL_KEY = 'draw_credential'
const ROOM_KEY = 'draw_room'

export function getSessionId() {
  let id = localStorage.getItem(CREDENTIAL_KEY)
  if (!id) {
    id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    localStorage.setItem(CREDENTIAL_KEY, id)
  }
  return id
}

export function saveRoomInfo(roomId, name) {
  localStorage.setItem(ROOM_KEY, JSON.stringify({ roomId, name }))
}

export function getSavedRoom() {
  const raw = localStorage.getItem(ROOM_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearRoomInfo() {
  localStorage.removeItem(ROOM_KEY)
}
