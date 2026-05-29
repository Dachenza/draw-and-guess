import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'

import { init } from './game.js'
import { register as registerRoom } from './handlers/room.js'
import { register as registerGame } from './handlers/game.js'
import { register as registerChat } from './handlers/chat.js'
import { register as registerDraw } from './handlers/draw.js'
import { register as registerConnection } from './handlers/connection.js'

const app = express()
app.use(cors())
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

init(io)

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`)

  registerRoom(io, socket)
  registerGame(io, socket)
  registerChat(io, socket)
  registerDraw(io, socket)
  registerConnection(io, socket)
})

const PORT = process.env.PORT || 8081
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
