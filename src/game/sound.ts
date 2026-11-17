export type SoundKind = 'correct' | 'wrong' | 'timeout' | 'levelup' | 'skip' | 'tick' | 'go' | 'end'

const SOUND_KEY = 'abysse-sound'
let audioContext: AudioContext | null = null
let enabled = readSoundEnabled()

export function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setSoundEnabled(value: boolean): void {
  enabled = value
  try {
    localStorage.setItem(SOUND_KEY, String(value))
  } catch {
    // Sound still works for this session.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      return null
    }
  }
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

export function primeSound(): void {
  getAudioContext()
}

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.min(0.15, volume), start + Math.min(0.015, duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.01)
}

function noiseWhoosh(context: AudioContext, start: number) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.28), context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1100, start)
  filter.frequency.exponentialRampToValueAtTime(220, start + 0.26)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.035, start + 0.035)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.27)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start(start)
  source.stop(start + 0.29)
}

function wrongWobble(context: AudioContext, start: number) {
  const oscillator = context.createOscillator()
  const wobble = context.createOscillator()
  const wobbleDepth = context.createGain()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(250, start)
  oscillator.frequency.exponentialRampToValueAtTime(135, start + 0.28)
  wobble.type = 'sine'
  wobble.frequency.value = 7
  wobbleDepth.gain.value = 18
  wobble.connect(wobbleDepth)
  wobbleDepth.connect(oscillator.frequency)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
  oscillator.connect(gain)
  gain.connect(context.destination)
  wobble.start(start)
  oscillator.start(start)
  wobble.stop(start + 0.3)
  oscillator.stop(start + 0.3)
}

export function playSound(kind: SoundKind): void {
  if (!enabled) return
  const context = getAudioContext()
  if (!context) return
  const now = context.currentTime + 0.005

  switch (kind) {
    case 'correct':
      tone(context, 470, now, 0.18, 0.07, 'sine', 940)
      break
    case 'wrong':
      wrongWobble(context, now)
      break
    case 'timeout':
      tone(context, 190, now, 0.18, 0.06, 'sine', 155)
      tone(context, 145, now + 0.21, 0.22, 0.06, 'sine', 110)
      break
    case 'levelup':
      [440, 554, 659, 880].forEach((frequency, index) => {
        tone(context, frequency, now + index * 0.105, 0.14, 0.045)
      })
      break
    case 'skip':
      noiseWhoosh(context, now)
      break
    case 'tick':
      tone(context, 1050, now, 0.045, 0.035, 'sine', 760)
      break
    case 'go':
      [523, 659, 784].forEach((frequency) => tone(context, frequency, now, 0.3, 0.045))
      break
    case 'end':
      [392, 523, 659].forEach((frequency, index) => {
        tone(context, frequency, now + index * 0.09, 0.32, 0.04)
      })
      break
  }
}
