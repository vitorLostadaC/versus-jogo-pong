
export interface Player {
  wsId: string
  playerNumber: number
  score: number
  x: number
  y: number
}

export interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}


export interface Room {
  id: string
  players: Player[]
  ball: Ball
  winner: number | null
}

export type EventResponse = {
  event: "player-number"
  data: number
} | {
  event: 'all-ready'
} | {
  event: 'starting-game'
} | {
  event: 'started-game' | 'update-game' | 'end-game'
  data: Room
}

export interface MoveEventData {
  direction: "up" | "down"
  roomId: string
  playerNumber: number
}

export type Event = {
  event: 'join'
} | {
  event: 'move'
  data: MoveEventData
}

