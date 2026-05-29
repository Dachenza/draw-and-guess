import { useGameStore } from '../stores/game.js'

export function register(socket) {
  socket.on('draw_line', () => {})
  socket.on('clear_canvas', () => {})
  socket.on('draw_undo', (data) => {
    useGameStore().drawHistory = data.drawHistory
  })
}
