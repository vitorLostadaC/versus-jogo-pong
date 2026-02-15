# versus-jogo-pong

Multiplayer Pong game — 1v1 real-time matches over WebSocket.

## How to run

**Prerequisites:** Node.js, pnpm (frontend), Bun (backend)

1. **Start the server** (port 3333):

   ```bash
   cd server && bun run dev
   ```

2. **Start the frontend** (default Vite port):

   ```bash
   cd front && pnpm dev
   ```

3. Open `http://localhost:5173` in **two browser windows** — one per player — and click "Join match" in both. First to 5 points wins.

---

## Structure

### `server/`

Backend built with **Elysia** (Bun). Single WebSocket endpoint:

- **Rooms:** In-memory `Room[]`. First WS joins creates a room; second joins the same room.
- **Events (server → client):** `player-number`, `all-ready`, `starting-game`, `started-game`, `update-game`, `end-game`.
- **Events (client → server):** `join` (starts countdown/game), `move` (paddle up/down).
- **Game loop:** 60 FPS `setInterval` on the server. Collision detection, scoring, ball physics. State broadcast via `update-game` to all clients in the room.

### `front/`

React + Vite + Konva 2D canvas + Motion for animations.

- **Connection:** `react-use-websocket` → `ws://localhost:3333/websocket`
- **Components:**
  - `App.tsx` — orchestrates game state, WebSocket events, UI overlays (idle / countdown / playing / victory)
  - `Player` — paddle rect (glow, fill, highlight)
  - `Ball` — circle with shadow
- **Controls:** Player 1: W ↑ / S ↓ — Player 2: same keys in the second window.
- **Types:** `Room`, `Player`, `Ball`, `Event`, `EventResponse` shared between front/server (duplicated in `front/src/types.ts`).

Boa sorte rapazes.
