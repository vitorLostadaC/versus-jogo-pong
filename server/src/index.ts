import cors from "@elysiajs/cors";
import { Context, Elysia } from "elysia";
import { Prettify } from "elysia/dist/types";
import { ElysiaWS } from "elysia/dist/ws";

// Boa sorte rapazes, n mexi nada no codigo

interface Player {
  wsId: string
  playerNumber: number
  score: number
  x: number
  y: number
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}


interface Room {
  id: string
  players: Player[]
  ball: Ball
  winner: number | null
}

type EventResponse = {
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

interface MoveEventData {
  direction: "up" | "down"
  roomId: string
  playerNumber: number
}

type Event = {
  event: 'join'
} | {
  event: 'move'
  data: MoveEventData
}

interface Store {
  roomId: string
}

// gambiarra
type WS = Prettify<ElysiaWS<Context, any>>

let roomsDb: Room[] = []


const app = new Elysia()
  .use(cors({
    origin: true
  }))
  .ws('/websocket', {


    open(ws) {

      let room: Room | null = null
      const rooms = getRooms()


      const isLastRoomFull = rooms.length > 0 && rooms[rooms.length - 1].players.length !== 1

      console.log('isladt room full', isLastRoomFull)

      if (!isLastRoomFull) {
        room = rooms[rooms.length - 1]
      }


      if (room) {
        console.log('joining in a room')
        ws.subscribe(room.id);
        (ws.data.store as Store).roomId = room.id

        const playerNumber: EventResponse = {
          event: "player-number",
          data: 2
        }

        console.log('sending player number')
        ws.send(playerNumber);


        const newPlayer: Player = {
          wsId: ws.id,
          playerNumber: 2,
          score: 0,
          x: 690,
          y: 200,
        }

        room.players.push(newPlayer);

        // Both players are now in the room – broadcast all-ready to everyone
        const allReady: EventResponse = { event: 'all-ready' }
        ws.publish(room.id, allReady)
        ws.send(allReady)
      }
      else {
        console.log('creating a session')
        room = {
          id: crypto.randomUUID(),
          players: [{
            wsId: ws.id,
            playerNumber: 1,
            score: 0,
            x: 90,
            y: 200,
          }],
          ball: {
            x: 395,
            y: 245,
            dx: Math.random() < 0.5 ? 1 : -1,
            dy: 0,
          },
          winner: 0,
        }

        rooms.push(room);
        ws.subscribe(room.id);
        (ws.data.store as Store).roomId = room.id


        const playerNumber: EventResponse = {
          event: "player-number",
          data: 1
        }

        console.log('sending player number')
        ws.send(playerNumber);
      }
      console.log('sub', ws.subscriptions);

      console.log('connected')
    },
    message(ws, message: Event) {
      console.log('received event: ', message.event, ws.subscriptions)

      // @ts-ignore
      if (message.event === "ignore") return


      switch (message.event) {
        case "join":
          try {
            const rooms = getRooms()

            console.log('join - sub', ws.subscriptions)

            const room = rooms.find(r => r.id === (ws.data.store as Store).roomId)!

            const startingGame: EventResponse = {
              event: 'starting-game'
            }
            console.log('starting game...')

            ws.publish(room.id, startingGame)
            ws.send(startingGame)

            setTimeout(() => {
              const startedGame: EventResponse = {
                event: "started-game",
                data: room
              }

              ws.publish(room.id, startedGame)
              ws.send(startedGame)


              console.log('game started')
              startGame(room, ws);
            }, 3000);
          } catch (error) {
            console.log(error)
          }
          break
        case "move":
          const rooms = getRooms()
          const { data } = message
          let room = rooms.find(room => room.id === data.roomId)!

          if (room) {
            if (data.direction === 'up') {
              room.players[data.playerNumber - 1].y -= 10;

              if (room.players[data.playerNumber - 1].y < 0) {
                room.players[data.playerNumber - 1].y = 0;
              }
            }
            else if (data.direction === 'down') {
              room.players[data.playerNumber - 1].y += 10;

              if (room.players[data.playerNumber - 1].y > 440) {
                room.players[data.playerNumber - 1].y = 440;
              }
            }
          }

          // update rooms
          setRooms(rooms.map(r => {
            if (r.id === room.id) {
              return room;
            }
            else {
              return r;
            }
          }))
          const updateGameEvent: EventResponse = {
            event: "update-game",
            data: room
          }
          ws.publish(room.id, updateGameEvent)
          ws.send(updateGameEvent)
          break
      }



    }
  })
  .get("/", () => "Hello Elysia")
  .listen(3333);

const getRooms = () => {
  return roomsDb
}

const setRooms = (rooms: Room[]) => {
  roomsDb = rooms
}

function move(ws: WS, data: MoveEventData) {

}

function joinGame(ws: WS) {


}

function startGame(room: Room, ws: WS) {
  let interval = setInterval(() => {
    const rooms = getRooms()
    room.ball.x += room.ball.dx * 5;
    room.ball.y += room.ball.dy * 5;

    // check if ball hits player 1
    if (room.ball.x < 110 && room.ball.y > room.players[0].y && room.ball.y < room.players[0].y + 60) {
      room.ball.dx = 1;

      // change ball direction
      if (room.ball.y < room.players[0].y + 30) {
        room.ball.dy = -1;
      }
      else if (room.ball.y > room.players[0].y + 30) {
        room.ball.dy = 1;
      }
      else {
        room.ball.dy = 0;
      }
    }

    // check if ball hits player 2
    if (room.ball.x > 690 && room.ball.y > room.players[1].y && room.ball.y < room.players[1].y + 60) {
      room.ball.dx = -1;

      // change ball direction
      if (room.ball.y < room.players[1].y + 30) {
        room.ball.dy = -1;
      }
      else if (room.ball.y > room.players[1].y + 30) {
        room.ball.dy = 1;
      }
      else {
        room.ball.dy = 0;
      }
    }

    // up and down walls
    if (room.ball.y < 5 || room.ball.y > 490) {
      room.ball.dy *= -1;
    }


    // left and right walls
    if (room.ball.x < 5) {
      room.players[1].score += 1;
      room.ball.x = 395;
      room.ball.y = 245;
      room.ball.dx = 1;
      room.ball.dy = 0;
    }

    if (room.ball.x > 795) {
      room.players[0].score += 1;
      room.ball.x = 395;
      room.ball.y = 245;
      room.ball.dx = -1;
      room.ball.dy = 0;
    }


    if (room.players[0].score === 5) {
      room.winner = 1;
      setRooms(rooms.filter(r => r.id !== room.id))
      const endGameEvent: EventResponse = {
        event: "end-game",
        data: room
      }
      ws.publish(room.id, endGameEvent)
      ws.send(endGameEvent)
      clearInterval(interval);
    }

    if (room.players[1].score === 10) {
      room.winner = 2;
      setRooms(rooms.filter(r => r.id !== room.id))
      const endGameEvent: EventResponse = {
        event: "end-game",
        data: room
      }
      ws.publish(room.id, endGameEvent)
      ws.send(endGameEvent)
      clearInterval(interval);
    }

    const updateGameEvent: EventResponse = {
      event: "update-game",
      data: room
    }
    ws.publish(room.id, updateGameEvent)
    ws.send(updateGameEvent)

  }, 1000 / 60);
}


console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);


