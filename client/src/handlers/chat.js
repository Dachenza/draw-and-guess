import { useGameStore } from '../stores/game.js'

export function register(socket) {
  socket.on('chat_message', (data) => {
    const store = useGameStore()
    if (data.type === 'image') {
      store.messages = [...store.messages, { type: 'image', name: data.name, imageData: data.imageData, filename: data.filename }]
    } else if (data.type === 'sticker') {
      store.messages = [...store.messages, { type: 'sticker', name: data.name, sticker: data.sticker }]
    } else {
      const type = data.type === 'system' ? 'system' : 'guess'
      store.messages = [...store.messages, { type, name: data.name, text: data.text }]
    }
  })
}
