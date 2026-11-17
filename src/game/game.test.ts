import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, evaluate, type AchievementStats } from './achievements'
import { DAILY_LEVEL_SCHEDULE, DAILY_QUESTION_COUNT, dailyQuestion } from './daily'
import { LEVELS } from './levels'
import { generateQuestion, configFromLevel } from './questions'
import { mulberry32, seedFromDate } from './rng'
import { adjustedScore, progressAfterCorrectAnswer, scoreCorrectAnswer } from './scoring'
import {
  emptyGameData,
  isDailyPlayed,
  readGameData,
  saveGameRecord,
  STORAGE_KEY,
  type StorageLike,
} from './storage'
import { generateZenQuestion, validateZenConfig, type ZenConfig } from './zen'

describe('randomness and dates', () => {
  it('produces the same sequence for the same seed', () => {
    const first = mulberry32(91)
    const second = mulberry32(91)
    expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second))
  })

  it('hashes local calendar dates consistently and distinguishes days', () => {
    expect(seedFromDate(new Date(2025, 4, 8, 1))).toBe(seedFromDate(new Date(2025, 4, 8, 23)))
    expect(seedFromDate(new Date(2025, 4, 8))).not.toBe(seedFromDate(new Date(2025, 4, 9)))
  })

  it('generates the same daily question sequence for everyone on the same date', () => {
    const firstDate = new Date(2025, 4, 8)
    const otherDate = new Date(2025, 4, 9)
    const first = Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => dailyQuestion(firstDate, index))
    const repeated = Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => dailyQuestion(firstDate, index))
    const other = Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => dailyQuestion(otherDate, index))
    expect(first).toEqual(repeated)
    expect(first).not.toEqual(other)
    expect(DAILY_LEVEL_SCHEDULE).toHaveLength(20)
    expect(DAILY_QUESTION_COUNT).toBe(20)
  })
})

describe('question generation', () => {
  it.each(LEVELS)('generates valid integer questions for level $id', (level) => {
    const rng = mulberry32(level.id * 37)
    const config = configFromLevel(level)
    for (let index = 0; index < 2000; index += 1) {
      const question = generateQuestion(rng, config)
      expect(Number.isInteger(question.answer)).toBe(true)
      if (question.op === '-') expect(question.answer).toBeGreaterThanOrEqual(0)

      const [leftText, rightText] = question.text.split(/[+−×÷]/).map((part) => Number(part.trim()))
      if (question.op === '+' || question.op === '-') {
        expect(leftText).toBeGreaterThanOrEqual(level[question.op === '+' ? 'addition' : 'subtraction'].min)
        expect(leftText).toBeLessThanOrEqual(level[question.op === '+' ? 'addition' : 'subtraction'].max)
        expect(rightText).toBeGreaterThanOrEqual(level[question.op === '+' ? 'addition' : 'subtraction'].min)
        expect(rightText).toBeLessThanOrEqual(level[question.op === '+' ? 'addition' : 'subtraction'].max)
      }
      if (question.op === '×') {
        expect(leftText).toBeGreaterThanOrEqual(level.multiplicationLeft.min)
        expect(leftText).toBeLessThanOrEqual(level.multiplicationLeft.max)
        expect(rightText).toBeGreaterThanOrEqual(level.multiplicationRight.min)
        expect(rightText).toBeLessThanOrEqual(level.multiplicationRight.max)
      }
      if (question.op === '÷') {
        expect(rightText).toBeGreaterThanOrEqual(level.divisionDivisor.min)
        expect(rightText).toBeLessThanOrEqual(level.divisionDivisor.max)
        expect(question.answer).toBeGreaterThanOrEqual(level.divisionQuotient.min)
        expect(question.answer).toBeLessThanOrEqual(level.divisionQuotient.max)
        expect(leftText % rightText).toBe(0)
        expect(leftText / rightText).toBe(question.answer)
      }
    }
  })
})

describe('level scoring', () => {
  it.each([
    [2.99, 150, 'Éclair'],
    [3, 100, 'Rapide'],
    [5.99, 100, 'Rapide'],
    [6, 50, 'Normal'],
  ] as const)('scores an answer at %s seconds', (seconds, points, label) => {
    expect(scoreCorrectAnswer(seconds)).toEqual({ points, label })
  })

  it('levels up on every tenth correct answer, up to level six', () => {
    expect(progressAfterCorrectAnswer({ correctAnswers: 8, level: 1, leveledUp: false }))
      .toEqual({ correctAnswers: 9, level: 1, leveledUp: false })
    expect(progressAfterCorrectAnswer({ correctAnswers: 9, level: 1, leveledUp: false }))
      .toEqual({ correctAnswers: 10, level: 2, leveledUp: true })
    expect(progressAfterCorrectAnswer({ correctAnswers: 59, level: 6, leveledUp: false }))
      .toEqual({ correctAnswers: 60, level: 6, leveledUp: false })
  })

  it('adjusts the raw score using the starting level multiplier', () => {
    expect(adjustedScore(100, 2)).toBe(120)
    expect(adjustedScore(100, 6)).toBe(300)
  })
})

describe('Chrono libre', () => {
  const baseConfig: ZenConfig = {
    operations: ['+'],
    duration: 60,
  }

  it('requires at least one operation and accepts supported durations', () => {
    expect(validateZenConfig({ ...baseConfig, operations: [] }).operations).toBeDefined()
    expect(validateZenConfig(baseConfig)).toEqual({})
    expect(validateZenConfig({ ...baseConfig, duration: 45 as ZenConfig['duration'] }).duration).toBeDefined()
  })

  it('uses Zetamac operand ranges and exact inverse division', () => {
    const rng = mulberry32(123)
    for (const op of ['+', '-', '×', '÷'] as const) {
      for (let index = 0; index < 500; index += 1) {
        const question = generateZenQuestion(rng, [op])
        const [left, right] = question.text.split(/[+−×÷]/).map((part) => Number(part.trim()))
        if (op === '+') {
          expect(left).toBeGreaterThanOrEqual(2)
          expect(left).toBeLessThanOrEqual(100)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
        }
        if (op === '-') {
          expect(left).toBeGreaterThanOrEqual(4)
          expect(left).toBeLessThanOrEqual(200)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
          expect(question.answer).toBeGreaterThanOrEqual(2)
          expect(question.answer).toBeLessThanOrEqual(100)
          expect(left - right).toBe(question.answer)
        }
        if (op === '×') {
          expect(left).toBeGreaterThanOrEqual(2)
          expect(left).toBeLessThanOrEqual(12)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
        }
        if (op === '÷') {
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(12)
          expect(question.answer).toBeGreaterThanOrEqual(2)
          expect(question.answer).toBeLessThanOrEqual(100)
          expect(left % right).toBe(0)
        }
      }
    }
  })
})

describe('achievements', () => {
  const baseline: AchievementStats = {
    mode: 'Niveaux',
    finished: false,
    correctAnswers: 0,
    lightningAnswers: 0,
    bestStreak: 0,
    lightningStreak: 0,
    highestLevel: 1,
    startingLevel: 1,
    adjustedScore: 0,
    score: 0,
  }

  it.each([
    ['premier-pas', { finished: true }, []],
    ['eclair', { lightningAnswers: 1 }, []],
    ['sans-faute', { bestStreak: 15 }, []],
    ['tempete', { lightningStreak: 5 }, []],
    ['esprit-expert', { highestLevel: 4 }, []],
    ['cauchemar-vaincu', { highestLevel: 6 }, []],
    ['mi-parcours', { adjustedScore: 2500 }, []],
    ['grand-parieur', { startingLevel: 6 }, []],
    ['chrono-maitre', { mode: 'Chrono libre', duration: 60, score: 40 }, []],
    ['fidele', { mode: 'Défi Quotidien', dailyDate: '2025-01-03' }, [
      { mode: 'Défi Quotidien' as const, score: 1, date: '2025-01-01', accuracy: 100, averageResponseTime: 1, bestStreak: 1 },
      { mode: 'Défi Quotidien' as const, score: 1, date: '2025-01-02', accuracy: 100, averageResponseTime: 1, bestStreak: 1 },
    ]],
  ])('unlocks %s when its condition is met, but not before', (id, updates, history) => {
    const earned = evaluate({ ...baseline, ...updates } as AchievementStats, history)
    expect(earned.map((item) => item.id)).toContain(id)

    if (id === 'fidele') {
      expect(evaluate({ ...baseline, mode: 'Défi Quotidien', dailyDate: '2025-01-03' }, []).map((item) => item.id))
        .not.toContain(id)
    } else if (id === 'premier-pas') {
      expect(evaluate({ ...baseline, finished: true }, [
        { mode: 'Niveaux', score: 0, date: '2025-01-01', accuracy: 0, averageResponseTime: 0, bestStreak: 0 },
      ]).map((item) => item.id)).not.toContain(id)
    } else {
      expect(evaluate(baseline, []).map((item) => item.id)).not.toContain(id)
    }
  })

  it('returns only known achievements', () => {
    expect(evaluate({ ...baseline, finished: true, lightningAnswers: 1 }, []))
      .toEqual(ACHIEVEMENTS.filter(({ id }) => ['premier-pas', 'eclair'].includes(id)))
  })
})

describe('local storage', () => {
  it('returns empty data when saved JSON is corrupted', () => {
    const storage: StorageLike = {
      getItem: (key) => key === STORAGE_KEY ? '{ broken json' : null,
      setItem: () => undefined,
    }
    expect(readGameData(storage)).toEqual(emptyGameData())
  })

  it('locks a daily challenge only after saving a finished result', () => {
    let value = JSON.stringify({
      ...emptyGameData(),
      dailyResults: [{ date: '2025-05-08' }],
    })
    const storage: StorageLike = {
      getItem: (key) => key === STORAGE_KEY ? value : null,
      setItem: (_key, nextValue) => { value = nextValue },
    }
    expect(isDailyPlayed('2025-05-08', storage)).toBe(false)

    saveGameRecord({
      mode: 'Défi Quotidien',
      score: 650,
      date: '2025-05-08',
      accuracy: 80,
      averageResponseTime: 4,
      bestStreak: 5,
    }, storage)

    expect(isDailyPlayed('2025-05-08', storage)).toBe(true)
  })
})
