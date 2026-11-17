import { getLevel } from './levels'
import { configFromLevel, generateQuestion, type Question } from './questions'
import { mulberry32, seedFromDate } from './rng'

export const DAILY_QUESTION_COUNT = 20
export const DAILY_LEVEL_SCHEDULE = [
  2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6,
] as const

export interface DailyQuestion {
  question: Question
  levelId: number
}

export function dailyQuestion(date: Date, index: number): DailyQuestion {
  const levelId = DAILY_LEVEL_SCHEDULE[index]
  if (levelId === undefined) throw new RangeError('Question quotidienne hors limites.')
  const rng = mulberry32((seedFromDate(date) + Math.imul(index + 1, 0x9e3779b9)) >>> 0)

  return {
    question: generateQuestion(rng, configFromLevel(getLevel(levelId))),
    levelId,
  }
}
