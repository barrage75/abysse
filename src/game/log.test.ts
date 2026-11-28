import { describe, expect, it } from 'vitest'
import {
  appendLog,
  countLog,
  filterLog,
  MAX_LOG_ENTRIES,
  timeAttackCorrectEntry,
  timeAttackExpiryEntry,
  timeAttackSkipEntry,
  type QuestionLogEntry,
} from './log'

describe('question log', () => {
  it('keeps the earliest entries when the log cap is reached', () => {
    const log = Array.from({ length: MAX_LOG_ENTRIES }, (_, index) => ({
      text: `question ${index}`,
      answer: index,
      result: 'correct' as const,
    }))

    const appended = appendLog(log, { text: 'newest', answer: 1, result: 'wrong' })

    expect(appended).toHaveLength(MAX_LOG_ENTRIES)
    expect(appended[0].text).toBe('question 0')
    expect(appended[MAX_LOG_ENTRIES - 1].text).toBe(`question ${MAX_LOG_ENTRIES - 1}`)
  })

  it('counts and filters correct, wrong, and unanswered results', () => {
    const log: QuestionLogEntry[] = [
      { text: '1 + 1', answer: 2, result: 'correct' },
      { text: '3 + 4', answer: 7, result: 'wrong', given: '8' },
      { text: '8 − 2', answer: 6, result: 'timeout' },
      { text: '5 × 5', answer: 25, result: 'skipped' },
    ]

    expect(countLog(log)).toEqual({ all: 4, correct: 1, wrong: 1, unanswered: 2 })
    expect(filterLog(log, 'correct')).toEqual([log[0]])
    expect(filterLog(log, 'wrong')).toEqual([log[1]])
    expect(filterLog(log, 'unanswered')).toEqual([log[2], log[3]])
    expect(filterLog(log, 'all')).toBe(log)
  })

  it('records Time Attack attempts, skips, and expiry outcomes', () => {
    const question = { text: '7 × 8', answer: 56 }

    expect(timeAttackCorrectEntry(question, '56', 2.16, 1)).toEqual({
      ...question,
      result: 'correct',
      given: '56',
      seconds: 2.2,
      attempts: 1,
    })
    expect(timeAttackSkipEntry(question, '54')).toEqual({
      ...question,
      result: 'skipped',
      given: '54',
    })
    expect(timeAttackExpiryEntry(question, '54')).toEqual({
      ...question,
      result: 'wrong',
      given: '54',
    })
    expect(timeAttackExpiryEntry(question)).toEqual({ ...question, result: 'timeout' })
  })
})
