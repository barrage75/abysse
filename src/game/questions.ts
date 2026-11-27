import type { Level, Range } from './levels'
import type { RandomSource } from './rng'

export type Operation = '+' | '-' | '×' | '÷'

export interface Question {
  text: string
  answer: number
  op: Operation
}

export interface QuestionConfig {
  operations: Operation[]
  addition: Range
  subtraction: Range
  multiplicationLeft: Range
  multiplicationRight: Range
  divisionDivisor: Range
  divisionQuotient: Range
  allowNegative?: boolean
}

function integerInRange(rng: RandomSource, range: Range): number {
  return Math.floor(rng() * (range.max - range.min + 1)) + range.min
}

export function configFromLevel(level: Level): QuestionConfig {
  return {
    operations: level.operations,
    addition: level.addition,
    subtraction: level.subtraction,
    multiplicationLeft: level.multiplicationLeft,
    multiplicationRight: level.multiplicationRight,
    divisionDivisor: level.divisionDivisor,
    divisionQuotient: level.divisionQuotient,
    allowNegative: level.allowNegative,
  }
}

export function generateQuestion(rng: RandomSource, config: QuestionConfig): Question {
  if (config.operations.length === 0) {
    throw new Error('Au moins une opération est nécessaire.')
  }

  const op = config.operations[integerInRange(rng, { min: 0, max: config.operations.length - 1 })]

  if (op === '+') {
    const left = integerInRange(rng, config.addition)
    const right = integerInRange(rng, config.addition)
    return { text: `${left} + ${right}`, answer: left + right, op }
  }

  if (op === '-') {
    let left = integerInRange(rng, config.subtraction)
    let right = integerInRange(rng, config.subtraction)
    while (!config.allowNegative && left === right) {
      right = integerInRange(rng, config.subtraction)
    }
    if (!config.allowNegative && left < right) [left, right] = [right, left]
    return { text: `${left} − ${right}`, answer: left - right, op }
  }

  if (op === '×') {
    const left = integerInRange(rng, config.multiplicationLeft)
    const right = integerInRange(rng, config.multiplicationRight)
    return { text: `${left} × ${right}`, answer: left * right, op }
  }

  const divisor = integerInRange(rng, config.divisionDivisor)
  const quotient = integerInRange(rng, config.divisionQuotient)
  return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient, op }
}

export function nextLevelQuestion(
  rng: RandomSource,
  config: QuestionConfig,
  recent: string[],
): Question {
  let candidate = generateQuestion(rng, config)
  for (let attempt = 1; attempt < 20 && recent.includes(candidate.text); attempt += 1) {
    candidate = generateQuestion(rng, config)
  }
  return candidate
}
