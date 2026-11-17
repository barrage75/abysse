import type { Question, Operation } from '../game/questions'
import type { GameMode } from '../game/storage'
import type { ZenDuration } from '../game/zen'

export interface GameSession {
  mode: GameMode
  question: Question
  questionNumber: number
  startingLevel: number
  level: number
  score: number
  lives: number
  correct: number
  mistakes: number
  streak: number
  bestStreak: number
  lightningStreak: number
  bestLightningStreak: number
  highestLevel: number
  questionStartedAt: number
  timeLimitSeconds: number
  totalResponseMs: number
  responseCount: number
  deadline?: number
  duration?: ZenDuration
  operations?: Operation[]
  showTimer?: boolean
  showScore?: boolean
  zenWrongAttempts: number
  dailyDate?: string
}

export interface GameResult {
  mode: GameMode
  score: number
  adjustedScore: number
  accuracy: number
  averageResponseTime: number
  bestStreak: number
  correct: number
  mistakes: number
  startingLevel: number
  highestLevel: number
  duration?: number
  isNewRecord: boolean
}
