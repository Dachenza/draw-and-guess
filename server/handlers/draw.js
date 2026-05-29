import { getRoom } from '../store.js'

export function register(io, socket) {

  socket.on('draw_line', ({ points, color, width }) => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    socket.to(socket.roomId).emit('draw_line', { points, color, width })
  })

  socket.on('complete_stroke', ({ points, color, width }) => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    room.drawHistory.push({ type: 'draw_line', points, color, width })
  })

  socket.on('clear_canvas', () => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    room.drawHistory = [{ type: 'clear_canvas' }]
    io.to(socket.roomId).emit('clear_canvas')
  })

  socket.on('undo_draw', () => {
    const room = getRoom(socket.roomId)
    if (!room || room.currentDrawer !== socket.id) return
    for (let i = room.drawHistory.length - 1; i >= 0; i--) {
      if (room.drawHistory[i].type === 'draw_line') {
        room.drawHistory.splice(i, 1)
        break
      }
    }
    io.to(socket.roomId).emit('draw_undo', { drawHistory: [...room.drawHistory] })
  })
}
