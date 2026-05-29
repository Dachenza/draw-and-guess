# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Server** (in `server/` directory):
- `cd server && npm run dev` — Start dev server with `--watch` (auto-restart on changes)
- `cd server && npm start` — Start production server
- Server runs on port defined in `server/config.js`

**Client** (in `client/` directory):
- `cd client && npm run dev` — Start Vite dev server with HMR
- `cd client && npm run build` — Build for production
- Client dev server proxies API/Socket.IO to the backend server (configured in `vite.config.js`)

## Architecture

Real-time multiplayer "Draw and Guess" (你画我猜) game. A drawer is given a word and draws it on a canvas while other players guess the word via chat.

### Client (Vue 3 + Vite)

- **Router** (`[client/src/router/index.js](client/src/router/index.js)`) — Three routes: `/` (Home), `/room/:roomId` (Room/lobby), `/game/:roomId` (Game)
- **Pinia store** (`[client/src/stores/game.js](client/src/stores/game.js)`) — Central game state: room info, players, phase, scores, timer, drawing data, chat messages
- **Socket event handlers** (`[client/src/handlers/](client/src/handlers/)`) — Socket.IO event registration split by domain: connection, room, game, draw, chat. All handlers subscribe events on the socket and update the Pinia store.
- **Credential service** (`[client/src/services/credential.js](client/src/services/credential.js)`) — localStorage-based session ID persistence and room rejoin info
- **Views** (`[client/src/views/](client/src/views/)`) — HomeView (create/join room), RoomView (lobby before game starts), GameView (main gameplay)
- **Components** (`[client/src/components/](client/src/components/)`) — DrawingCanvas (HTML5 canvas drawing), ChatPanel (guess chat), ScoreBoard, TimerBar, WordSelector

### Server (Node.js + Express + Socket.IO)

- **Entry** (`[server/index.js](server/index.js)`) — Express app, Socket.IO server, HTTP endpoint for client build serving
- **Game logic** (`[server/game.js](server/game.js)`) — Room-level game loop: round progression, drawer selection, word assignment, timer, scoring, guess validation
- **Store** (`[server/store.js](server/store.js)`) — In-memory data store for rooms and players
- **Config** (`[server/config.js](server/config.js)`) — Server port and game settings (rounds, timer durations, max players per room)
- **Words** (`[server/words.js](server/words.js)`) — Chinese word dictionary with category, difficulty level, and random selection function

### Key Flow

1. Player creates/joins a room from HomeView
2. Host starts game from RoomView
3. Server orchestrates rounds: selects a drawer, presents 3 word options, drawer picks one
4. Drawer draws on canvas (real-time via Socket.IO), other players guess in chat
5. Server validates guesses, awards scores, advances rounds
6. Game ends after all rounds, scores are displayed

### Reconnection

Players are identified by a session ID stored in localStorage. On disconnect, their room membership is preserved for a grace period. Reconnecting players are restored to their previous game state if the game is still in progress.
