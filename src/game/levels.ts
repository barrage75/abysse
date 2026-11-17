import type { Operation } from './questions'

export interface Range {
  min: number
  max: number
}

export interface Level {
  id: number
  name: string
  secondsPerQuestion: number
  operations: Operation[]
  addition: Range
  subtraction: Range
  multiplicationLeft: Range
  multiplicationRight: Range
  divisionDivisor: Range
  divisionQuotient: Range
  multiplier: number
  allowNegative: boolean
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Facile',
    secondsPerQuestion: 12,
    operations: ['+', '-'],
    addition: { min: 1, max: 20 },
    subtraction: { min: 1, max: 20 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 12 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 12 },
    multiplier: 1,
    allowNegative: false,
  },
  {
    id: 2,
    name: 'Moyen',
    secondsPerQuestion: 10,
    operations: ['+', '-'],
    addition: { min: 10, max: 99 },
    subtraction: { min: 10, max: 99 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 12 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 12 },
    multiplier: 1.2,
    allowNegative: false,
  },
  {
    id: 3,
    name: 'Difficile',
    secondsPerQuestion: 9,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 10, max: 99 },
    subtraction: { min: 10, max: 99 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 12 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 12 },
    multiplier: 1.5,
    allowNegative: false,
  },
  {
    id: 4,
    name: 'Expert',
    secondsPerQuestion: 7,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 1, max: 999 },
    subtraction: { min: 1, max: 999 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 99 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 99 },
    multiplier: 1.8,
    allowNegative: false,
  },
  {
    id: 5,
    name: 'Maître',
    secondsPerQuestion: 6,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 1, max: 999 },
    subtraction: { min: 1, max: 999 },
    multiplicationLeft: { min: 2, max: 99 },
    multiplicationRight: { min: 2, max: 99 },
    divisionDivisor: { min: 2, max: 25 },
    divisionQuotient: { min: 2, max: 999 },
    multiplier: 2.2,
    allowNegative: false,
  },
  {
    id: 6,
    name: 'Cauchemar',
    secondsPerQuestion: 5,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 1, max: 9999 },
    subtraction: { min: 1, max: 9999 },
    multiplicationLeft: { min: 2, max: 999 },
    multiplicationRight: { min: 2, max: 999 },
    divisionDivisor: { min: 2, max: 99 },
    divisionQuotient: { min: 2, max: 999 },
    multiplier: 3,
    allowNegative: false,
  },
]

export function getLevel(id: number): Level {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}
