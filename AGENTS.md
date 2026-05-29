# AGENTS.md

## Commands (run from repo root)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Starts **both** server & client via `concurrently` |
| `npm run dev:server` | Server: `node --watch index.js` (Node 18+ built-in watch, not nodemon) |
| `npm run dev:client` | Client: `vite` with HMR |
| `npm run install:all` | `npm install` in root + server + client |

No lint, typecheck, or test commands exist — none installed.

## Development Rules

- **Only restart what changed**: If you only edit `client/` files, do NOT restart the server. Vite HMR handles client updates automatically. Only restart the server when `server/` files change.

## Architecture

- Monorepo with two ESM packages (`"type": "module"` in both `server/` and `client/` `package.json`)
- **Server** (`server/index.js`) — Express + Socket.IO on port `8081` (override via `PORT` env). In-memory store only, no database.
- **Client** (`client/src/main.js`) — Vue 3 + Pinia + Vue Router + Vite. Dev server proxies `/socket.io` → `localhost:8081` with `ws: true` (see `client/vite.config.js`).
- Socket handler registration mirrors client ↔ server: `room.js`, `game.js`, `chat.js`, `draw.js`, `connection.js` in both `client/src/handlers/` and `server/handlers/`.

## Key flows & quirks

- **Session identity**: A random session ID is generated once and persisted in `localStorage` (`draw_credential`). Room info is in `draw_room`. This enables reconnection with a 2-second grace window (`server/store.js:4`).
- **Mid-game join**: If `room.phase !== 'waiting'`, joining players go into `pendingJoins` and the host must approve via `respond_join`.
- **Word selection**: Drawer gets 3 options, 10s timeout (`SELECT_TIME`); if they don't pick, the first option is auto-selected.
- **Scoring**: First guesser +100, others +50, drawer gets +50 per correct guesser (`ROOM_CONFIG` in `server/config.js`).
- **Between rounds**: 4-second delay before next round starts.
- **Drawer leaves mid-game**: Round ends immediately, `startRound` fires after 3s.
- Chinese-only UI and word dictionary (`server/words.js`).
- No `.gitignore` at root — only `client/.gitignore` exists.
