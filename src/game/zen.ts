import type { Operation } from './questions'
import type { RandomSource } from './rng'
import { generateQuestion } from './questions'

export const ZEN_DURATIONS = [30, 60, 120, 180] as const
export type ZenDuration = (typeof ZEN_DURATIONS)[number]

export interface ZenConfig {
  operations: Operation[]
  duration: ZenDuration
  showTimer: boolean
  showScore: boolean
}

export interface ZenErrors {
  operations?: string
  duration?: string
}

export function validateZenConfig(config: ZenConfig): ZenErrors {
  const errors: ZenErrors = {}
  if (config.operations.length === 0) errors.operations = 'Choisissez au moins une opération.'
  if (!ZEN_DURATIONS.includes(config.duration)) errors.duration = 'Choisissez une durée proposée.'
  return errors
}

export function generateZenQuestion(rng: RandomSource, operations: Operation[]) {
  if (operations.length === 0) throw new Error('Choisissez au moins une opération.')
  const selected = operations[Math.floor(rng() * operations.length)]

  if (selected === '-') {
    const first = Math.floor(rng() * 99) + 2
    const second = Math.floor(rng() * 99) + 2
    return {
      text: `${first + second} − ${first}`,
      answer: second,
      op: '-' as const,
    }
  }

  return generateQuestion(rng, {
    operations: [selected],
    addition: { min: 2, max: 100 },
    subtraction: { min: 2, max: 100 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 100 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 100 },
  })
}

export function zenAccuracy(correct: number, wrongAttempts: number): number {
  const total = correct + wrongAttempts
  return total === 0 ? 100 : Math.round((correct / total) * 100)
}

export function zenComboKey(config: Pick<ZenConfig, 'duration' | 'operations'>): string {
  return `${config.duration}-${[...config.operations].sort().join('')}`
}
