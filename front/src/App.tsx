/* eslint-disable react-hooks/exhaustive-deps */

import { Gamepad2, Zap } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage } from 'react-konva'
import useWebSocket from 'react-use-websocket'
import Silk from './color-bends'
import { Ball } from './components/ball'
import { Player } from './components/player'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'
import { playGameOverSound, playWinSound } from './sounds/play-sounds'
import plopSoundUrl from './sounds/plop.mp3'
import type { Event, EventResponse, Room } from './types'

const COUNTDOWN_DURATION = 3000
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!']

const PADDLE_WIDTH = 20
const PADDLE_HEIGHT = 60
const BALL_RADIUS = 10

export function App() {
  const [playerNumber, setPlayerNumber] = useState(1)
  const [roomId, setRoomId] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [allReady, setAllReady] = useState(false)
  const [gameState, setGameState] = useState<
    'idle' | 'starting' | 'started' | 'finished'
  >('idle')
  const [countdownStep, setCountdownStep] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const prevBallRef = useRef<Room['ball'] | null>(null)
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(
    'ws://localhost:3333/websocket',
    {
      shouldReconnect: () => false
    }
  )

  useEffect(() => {
    const message = lastJsonMessage as EventResponse
    if (!message) return

    if (message.event === 'player-number') {
      setPlayerNumber(message.data)
      setAllReady(false)
    }

    if (message.event === 'all-ready') {
      setAllReady(true)
    }

    if (message.event === 'starting-game') {
      setGameState('starting')
      setCountdownStep(0)
    }

    if (message.event === 'started-game' && 'data' in message) {
      setGameState('started')
      setRoom(message.data)
      setRoomId(message.data.id)
      prevBallRef.current = message.data.ball
    }

    if (message.event === 'update-game' && 'data' in message) {
      const newRoom = message.data
      const newBall = newRoom.ball
      const prevBall = prevBallRef.current

      if (prevBall && prevBall.dx !== newBall.dx) {
        const isGoalReset = newBall.x === 395 && newBall.y === 245
        if (!isGoalReset) {
          const audio = new Audio(plopSoundUrl)
          audio.volume = 0.5
          audio.play().catch(() => {})
        }
      }

      prevBallRef.current = newBall
      setRoom(newRoom)
    }

    if (message.event === 'end-game' && 'data' in message) {
      setGameState('finished')
      setRoom(message.data)
      prevBallRef.current = null
      if (message.data.winner === playerNumber) {
        playWinSound()
      } else {
        playGameOverSound()
      }
      const timeout = setTimeout(() => {
        setRoom(null)
        setRoomId('')
        setAllReady(false)
        setGameState('idle')
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [JSON.stringify(lastJsonMessage)])

  const handleStartGame = useCallback(() => {
    sendJsonMessage({ event: 'join' } satisfies Event)
  }, [sendJsonMessage])

  useEffect(() => {
    if (gameState !== 'starting') return

    const stepDuration = COUNTDOWN_DURATION / COUNTDOWN_STEPS.length
    const interval = setInterval(() => {
      setCountdownStep((prev) => {
        if (prev >= COUNTDOWN_STEPS.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'started' || !roomId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!['arrowup', 'arrowdown', 'w', 's'].includes(key)) return
      e.preventDefault()
      const direction = key === 'arrowup' || key === 'w' ? 'up' : 'down'
      sendJsonMessage({
        event: 'move',
        data: { roomId, playerNumber, direction }
      } satisfies Event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, roomId, playerNumber, sendJsonMessage])

  const showGameCanvas =
    room && (gameState === 'started' || gameState === 'finished')
  const playerColors = ['#00f5d4', '#7b2cbf'] as const
  const courtBg = '#0a0e14'
  const centerLineColor = 'rgba(255,255,255,0.12)'

  return (
    <div className="min-h-screen flex justify-center items-center flex-col gap-8 p-6">
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="font-mono text-lg font-medium uppercase tracking-[0.4em] text-white/70"
      >
        Pong
      </motion.h1>
      <div className="inset-0 fixed -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#5227ff"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <Stage width={800} height={500} className="rounded-2xl">
          <Layer>
            {/* Court background */}
            <Rect
              x={0}
              y={0}
              width={800}
              height={500}
              fill={courtBg}
              listening={false}
            />
            {/* Center line */}
            <Line
              points={[400, 0, 400, 500]}
              stroke={centerLineColor}
              strokeWidth={2}
              dash={[15, 20]}
              listening={false}
            />
            {showGameCanvas && room.players.length >= 2 && (
              <>
                <Player
                  x={room.players[0].x}
                  y={room.players[0].y}
                  width={PADDLE_WIDTH}
                  height={PADDLE_HEIGHT}
                  color={playerColors[0]}
                />
                <Player
                  x={room.players[1].x}
                  y={room.players[1].y}
                  width={PADDLE_WIDTH}
                  height={PADDLE_HEIGHT}
                  color={playerColors[1]}
                />
                <Ball
                  x={room.ball.x}
                  y={room.ball.y}
                  radius={BALL_RADIUS}
                  color="#00f5d4"
                />
              </>
            )}
          </Layer>
        </Stage>

        {/* Score overlay */}
        {showGameCanvas && room && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-16 pt-8">
            <span
              className="font-mono text-6xl tabular-nums font-bold tracking-[0.2em] text-white/95"
              style={{ textShadow: `0 0 30px ${playerColors[0]}90` }}
            >
              {room.players[0].score}
            </span>
            <span
              className="font-mono text-6xl tabular-nums font-bold tracking-[0.2em] text-white/95"
              style={{ textShadow: `0 0 30px ${playerColors[1]}90` }}
            >
              {room.players[1].score}
            </span>
          </div>
        )}

        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-[#0a0e14]/95"
          >
            <motion.div
              initial={{
                scale: prefersReducedMotion ? 1 : 0.9,
                opacity: 0
              }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center gap-4"
            >
              <Gamepad2
                className="size-14 text-[#00f5d4]"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 0 12px #00f5d460)' }}
              />
              <p className="font-mono text-sm uppercase tracking-widest text-white/50">
                {allReady ? 'Everyone is ready!' : 'Waiting for opponent'}
              </p>
            </motion.div>
            <Button
              onClick={handleStartGame}
              size="lg"
              className="border-[#00f5d4]/50 bg-[#00f5d4]/10 font-mono text-sm uppercase tracking-widest text-[#00f5d4] transition-all duration-200 hover:bg-[#00f5d4]/20 hover:text-[#00f5d4] active:scale-[0.98]"
            >
              <Zap className="size-4" />
              Join match
            </Button>
          </motion.div>
        )}
        {gameState === 'starting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/98"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdownStep}
                initial={{
                  scale: prefersReducedMotion ? 1 : 0.5,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  transition: prefersReducedMotion
                    ? { duration: 0.2 }
                    : {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25
                      }
                }}
                exit={{
                  scale: prefersReducedMotion ? 1 : 1.5,
                  opacity: 0,
                  transition: { duration: 0.15 }
                }}
                className={cn(
                  'font-mono text-9xl font-bold tabular-nums select-none tracking-widest',
                  countdownStep === COUNTDOWN_STEPS.length - 1
                    ? 'text-[#00f5d4]'
                    : 'text-white/90'
                )}
                style={
                  countdownStep === COUNTDOWN_STEPS.length - 1
                    ? { textShadow: '0 0 60px #00f5d480' }
                    : undefined
                }
              >
                {COUNTDOWN_STEPS[countdownStep]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
        {gameState === 'started' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5,
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-white/35"
          >
            W ↑ · S ↓
          </motion.p>
        )}
        {gameState === 'finished' && room && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0e14]/95"
          >
            <motion.div
              initial={{
                scale: prefersReducedMotion ? 1 : 0.95,
                opacity: 0
              }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.2, delay: 0.1 }
                  : {
                      type: 'spring',
                      stiffness: 320,
                      damping: 28,
                      delay: 0.08
                    }
              }
              className="flex flex-col items-center gap-6"
            >
              <p
                className={cn(
                  'font-mono text-4xl font-bold tracking-[0.3em] uppercase',
                  room.winner === playerNumber
                    ? 'text-[#00f5d4]'
                    : 'text-white/40'
                )}
                style={
                  room.winner === playerNumber
                    ? { textShadow: '0 0 40px #00f5d480' }
                    : undefined
                }
              >
                {room.winner === playerNumber ? 'Victory' : 'Defeat'}
              </p>
              <p className="font-mono text-2xl tabular-nums text-white/60">
                {room.players[0].score}
                <span className="mx-3 text-white/30">—</span>
                {room.players[1].score}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default App
