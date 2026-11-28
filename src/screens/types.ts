import type { Question, Operation } from '../game/questions'
import type { GameMode } from '../game/storage'
import type { QuestionLogEntry } from '../game/log'
import type { ZenDuration, ZenRequeueItem } from '../game/zen'

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
  zenWrongAttempts: number
  zenWrongAttemptsOnQuestion: number
  zenLastWrongAttempt?: string
  zenRecent: string[]
  zenRequeue: ZenRequeueItem[]
  recentQuestions: string[]
  log: QuestionLogEntry[]
  missed: MissedQuestion[]
  dailyDate?: string
  skipped: number
}

export interface MissedQuestion {
  text: string
  answer: number
  given?: string
  reason: 'wrong' | 'timeout' | 'skipped'
}

export interface GameResult {
  mode: GameMode
  date: string
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
  skipped: number
  log: QuestionLogEntry[]
  missed: MissedQuestion[]
}

export type FxKind = 'correct' | 'wrong' | 'timeout' | 'levelup' | 'skip'

export interface Fx {
  kind: FxKind
  id: number
  points?: number
}
