import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, evaluate, type AchievementStats } from './achievements'
import { DAILY_LEVEL_SCHEDULE, DAILY_QUESTION_COUNT, dailyQuestion } from './daily'
import { LEVELS } from './levels'
import { generateQuestion, nextLevelQuestion, configFromLevel } from './questions'
import { recordMissed } from './review'
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
import {
  applyZenSkip,
  generateZenQuestion,
  nextZenQuestion,
  validateZenConfig,
  ZEN_SKIP_PENALTY_MS,
  type ZenConfig,
  type ZenQuestionAdvance,
  type ZenQuestionState,
} from './zen'

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

  it.each(LEVELS)('never generates zero subtraction questions for level $id', (level) => {
    const rng = mulberry32(level.id * 97)
    const config: ReturnType<typeof configFromLevel> = {
      ...configFromLevel(level),
      operations: ['-'],
    }
    for (let index = 0; index < 2000; index += 1) {
      expect(generateQuestion(rng, config).answer).not.toBe(0)
    }
  })

  it('avoids recently used questions in levels mode', () => {
    const rng = mulberry32(8675309)
    const config = configFromLevel(LEVELS[0])
    let recent: string[] = []

    for (let index = 0; index < 500; index += 1) {
      const next = nextLevelQuestion(rng, config, recent)
      expect(recent).not.toContain(next.text)
      recent = [...recent, next.text].slice(-5)
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

  it('uses time attack operand ranges and exact inverse division', () => {
    const rng = mulberry32(123)
    for (const op of ['+', '-', '×', '÷'] as const) {
      for (let index = 0; index < 3000; index += 1) {
        const question = generateZenQuestion(rng, [op])
        const [left, right] = question.text.split(/[+−×÷]/).map((part) => Number(part.trim()))
        if (op === '+') {
          expect(left).toBeGreaterThanOrEqual(2)
          expect(left).toBeLessThanOrEqual(100)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
          expect(question.answer).toBe(left + right)
          expect(left % 10 === 0 && right % 10 === 0).toBe(false)
        }
        if (op === '-') {
          expect(left).toBeGreaterThanOrEqual(4)
          expect(left).toBeLessThanOrEqual(200)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
          expect(question.answer).toBeGreaterThanOrEqual(2)
          expect(question.answer).toBeLessThanOrEqual(100)
          expect(left - right).toBe(question.answer)
          expect(right % 10 === 0 && question.answer % 10 === 0).toBe(false)
        }
        if (op === '×') {
          expect(left).toBeGreaterThanOrEqual(2)
          expect(left).toBeLessThanOrEqual(12)
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(100)
          expect(left).not.toBe(10)
          expect(right % 10).not.toBe(0)
          expect(question.answer).toBe(left * right)
        }
        if (op === '÷') {
          expect(right).toBeGreaterThanOrEqual(2)
          expect(right).toBeLessThanOrEqual(12)
          expect(question.answer).toBeGreaterThanOrEqual(2)
          expect(question.answer).toBeLessThanOrEqual(100)
          expect(left % right).toBe(0)
          expect(right).not.toBe(10)
          expect(question.answer % 10).not.toBe(0)
          expect(question.answer).toBe(left / right)
        }
      }
    }
  })

  it('avoids repeating a question from the recent history', () => {
    const rng = mulberry32(8675309)
    let state: ZenQuestionState = { questionNumber: 0, recent: [], requeue: [] }

    for (let index = 0; index < 200; index += 1) {
      const next = nextZenQuestion(rng, ['+', '-', '×', '÷'], state)
      expect(state.recent).not.toContain(next.question.text)
      state = next
    }

    expect(state.questionNumber).toBe(200)
  })

  it('requeues a skipped question at its due question number, including a second skip', () => {
    const rng = mulberry32(2468)
    const question = { text: '14 × 2', answer: 28, op: '×' as const }
    let state: ZenQuestionAdvance = {
      question,
      questionNumber: 1,
      recent: [question.text],
      requeue: [],
    }

    state = nextZenQuestion(rng, ['×'], state, question)
    expect(state.questionNumber).toBe(2)
    expect(state.requeue).toEqual([{ question, dueAt: 5 }])
    state = nextZenQuestion(rng, ['×'], state)
    state = nextZenQuestion(rng, ['×'], state)
    state = nextZenQuestion(rng, ['×'], state)
    expect(state.questionNumber).toBe(5)
    expect(state.question).toEqual(question)
    expect(state.requeue).toEqual([])

    state = nextZenQuestion(rng, ['×'], state, state.question)
    expect(state.questionNumber).toBe(6)
    expect(state.requeue).toEqual([{ question, dueAt: 9 }])
    state = nextZenQuestion(rng, ['×'], state)
    state = nextZenQuestion(rng, ['×'], state)
    state = nextZenQuestion(rng, ['×'], state)
    expect(state.questionNumber).toBe(9)
    expect(state.question).toEqual(question)
    expect(state.requeue).toEqual([])
  })

  it('subtracts three seconds per skip and clamps at the current time', () => {
    expect(ZEN_SKIP_PENALTY_MS).toBe(3000)
    expect(applyZenSkip(10_000, 4_000)).toBe(7_000)
    expect(applyZenSkip(6_000, 4_000)).toBe(4_000)
  })
})

describe('review tracking', () => {
  it('appends a missed question', () => {
    const wrong = { text: '8 + 7', answer: 15, given: '14', reason: 'wrong' as const }
    expect(recordMissed([], wrong)).toEqual([wrong])
  })

  it('replaces the existing entry for the same question', () => {
    const first = { text: '8 + 7', answer: 15, given: '14', reason: 'wrong' as const }
    const updated = { ...first, given: '13' }
    expect(recordMissed([first], updated)).toEqual([updated])
  })

  it('does not duplicate an already-skipped question', () => {
    const skipped = { text: '8 + 7', answer: 15, reason: 'skipped' as const }
    expect(recordMissed([skipped], skipped)).toEqual([skipped])
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
  it('compares Levels records using adjusted scores', () => {
    let value: string | null = null
    const storage: StorageLike = {
      getItem: () => value,
      setItem: (_key, nextValue) => { value = nextValue },
    }
    const baseRecord = {
      mode: 'Niveaux' as const,
      date: '2025-05-08',
      accuracy: 80,
      averageResponseTime: 4,
      bestStreak: 5,
    }

    saveGameRecord({ ...baseRecord, score: 100, adjustedScore: 300 }, storage)
    const second = saveGameRecord({ ...baseRecord, score: 200, adjustedScore: 200 }, storage)

    expect(second.isNewRecord).toBe(false)
    expect(second.data.bestScores.Niveaux.score).toBe(300)
  })

  it('migrates legacy Levels best scores to the best adjusted history score', () => {
    const legacyRecord = {
      mode: 'Niveaux' as const,
      score: 150,
      adjustedScore: 450,
      date: '2025-05-08',
      accuracy: 80,
      averageResponseTime: 4,
      bestStreak: 5,
    }
    let value: string | null = JSON.stringify({
      version: 1,
      bestScores: { Niveaux: { score: 150, date: legacyRecord.date, accuracy: 80 } },
      achievements: [],
      dailyResults: [],
      history: [legacyRecord],
    })
    const storage: StorageLike = {
      getItem: () => value,
      setItem: (_key, nextValue) => { value = nextValue },
    }

    const migrated = readGameData(storage)
    expect(migrated.bestScores.Niveaux.score).toBe(450)
    expect(migrated.levelsBestAdjusted).toBe(true)

    const saved = saveGameRecord({ ...legacyRecord, score: 200, adjustedScore: 300 }, storage)
    expect(saved.isNewRecord).toBe(false)
    expect(saved.data.bestScores.Niveaux.score).toBe(450)
  })

  it('preserves a legacy Levels best score when its history is empty', () => {
    const storage: StorageLike = {
      getItem: () => JSON.stringify({
        version: 1,
        bestScores: { Niveaux: { score: 500, date: '2025-05-08', accuracy: 80 } },
        history: [],
      }),
      setItem: () => undefined,
    }

    const migrated = readGameData(storage)
    expect(migrated.bestScores.Niveaux.score).toBe(500)
    expect(migrated.levelsBestAdjusted).toBe(true)
  })

  it('returns empty data when saved JSON is corrupted', () => {
    const storage: StorageLike = {
      getItem: (key) => key === STORAGE_KEY ? '{ broken json' : null,
      setItem: () => undefined,
    }
    expect(readGameData(storage)).toEqual(emptyGameData())
  })

  it('does not lock during setup/countdown and locks only after a finished result is saved', () => {
    let value = JSON.stringify({
      ...emptyGameData(),
      dailyResults: [{ date: '2025-05-08' }],
    })
    const storage: StorageLike = {
      getItem: (key) => key === STORAGE_KEY ? value : null,
      setItem: (_key, nextValue) => { value = nextValue },
    }
    // Setup and countdown do not persist a daily result.
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
