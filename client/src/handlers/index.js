import { register as registerRoom } from './room.js'
import { register as registerGame } from './game.js'
import { register as registerChat } from './chat.js'
import { register as registerDraw } from './draw.js'
import { register as registerConnection } from './connection.js'

export function registerAll(socket) {
  registerRoom(socket)
  registerGame(socket)
  registerChat(socket)
  registerDraw(socket)
  registerConnection(socket)
}
