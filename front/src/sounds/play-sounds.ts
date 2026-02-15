let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

export function playWinSound(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const frequencies = [523.25, 659.25, 783.99, 1046.5]
    const duration = 0.12

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + duration)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + duration)
    })
  } catch {
    // Ignore audio errors (e.g. autoplay blocked)
  }
}

export function playGameOverSound(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const frequencies = [392, 349.23, 293.66]
    const duration = 0.2

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(freq, now)
      osc.type = 'sawtooth'
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + duration)
    })
  } catch {
    // Ignore audio errors
  }
}
