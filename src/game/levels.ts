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
    multiplicationRight: { min: 2, max: 25 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 25 },
    multiplier: 1.8,
    allowNegative: false,
  },
  {
    id: 5,
    name: 'Maître',
    secondsPerQuestion: 6,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 100, max: 999 },
    subtraction: { min: 100, max: 999 },
    multiplicationLeft: { min: 3, max: 19 },
    multiplicationRight: { min: 3, max: 19 },
    divisionDivisor: { min: 2, max: 15 },
    divisionQuotient: { min: 2, max: 50 },
    multiplier: 2.2,
    allowNegative: false,
  },
  {
    id: 6,
    name: 'Cauchemar',
    secondsPerQuestion: 5,
    operations: ['+', '-', '×', '÷'],
    addition: { min: 100, max: 1999 },
    subtraction: { min: 100, max: 1999 },
    multiplicationLeft: { min: 6, max: 25 },
    multiplicationRight: { min: 6, max: 25 },
    divisionDivisor: { min: 3, max: 25 },
    divisionQuotient: { min: 5, max: 99 },
    multiplier: 3,
    allowNegative: false,
  },
]

export function getLevel(id: number): Level {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}
