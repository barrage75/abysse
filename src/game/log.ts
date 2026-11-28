import type { Question } from './questions'

export type LogResult = 'correct' | 'wrong' | 'timeout' | 'skipped'

export interface QuestionLogEntry {
  text: string
  answer: number
  result: LogResult
  given?: string
  seconds?: number
  attempts?: number
}

export type LogFilter = 'all' | 'correct' | 'wrong' | 'unanswered'

export const MAX_LOG_ENTRIES = 200

export function appendLog(log: QuestionLogEntry[], entry: QuestionLogEntry): QuestionLogEntry[] {
  if (log.length >= MAX_LOG_ENTRIES) return log.slice(0, MAX_LOG_ENTRIES)
  return [...log, entry]
}

export function countLog(log: QuestionLogEntry[]): Record<LogFilter, number> {
  const counts: Record<LogFilter, number> = {
    all: log.length,
    correct: 0,
    wrong: 0,
    unanswered: 0,
  }
  for (const entry of log) {
    if (entry.result === 'correct') counts.correct += 1
    else if (entry.result === 'wrong') counts.wrong += 1
    else counts.unanswered += 1
  }
  return counts
}

export function filterLog(log: QuestionLogEntry[], filter: LogFilter): QuestionLogEntry[] {
  if (filter === 'all') return log
  if (filter === 'unanswered') return log.filter(({ result }) => result === 'timeout' || result === 'skipped')
  return log.filter(({ result }) => result === filter)
}

export function roundLogSeconds(seconds: number): number {
  return Math.round(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 10) / 10
}

export function timeAttackCorrectEntry(
  question: Pick<Question, 'text' | 'answer'>,
  given: string,
  seconds: number,
  attempts: number,
): QuestionLogEntry {
  return {
    text: question.text,
    answer: question.answer,
    result: 'correct',
    given,
    seconds: roundLogSeconds(seconds),
    ...(attempts > 0 ? { attempts } : {}),
  }
}

export function timeAttackSkipEntry(
  question: Pick<Question, 'text' | 'answer'>,
  lastWrongAttempt?: string,
): QuestionLogEntry {
  return {
    text: question.text,
    answer: question.answer,
    result: 'skipped',
    ...(lastWrongAttempt === undefined ? {} : { given: lastWrongAttempt }),
  }
}

export function timeAttackExpiryEntry(
  question: Pick<Question, 'text' | 'answer'>,
  lastWrongAttempt?: string,
): QuestionLogEntry {
  return lastWrongAttempt === undefined
    ? { text: question.text, answer: question.answer, result: 'timeout' }
    : { text: question.text, answer: question.answer, result: 'wrong', given: lastWrongAttempt }
}
