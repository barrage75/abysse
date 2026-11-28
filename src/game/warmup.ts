import { getLevel } from './levels'
import { configFromLevel, nextLevelQuestion, type Question } from './questions'
import type { RandomSource } from './rng'

export function nextWarmup(rng: RandomSource, previousText?: string): Question {
  return nextLevelQuestion(
    rng,
    configFromLevel(getLevel(1)),
    previousText ? [previousText] : [],
  )
}

export function checkWarmup(value: string, question: Question): boolean {
  return value !== '' && Number(value) === question.answer
}
