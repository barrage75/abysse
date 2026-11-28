import { describe, expect, it } from 'vitest'
import { emptyGameData, readGameData, saveGameRecord, writeGameData, type GameRecord, type StorageLike } from './storage'
import { MAX_LOG_ENTRIES, type QuestionLogEntry } from './log'

function memoryStorage(initial: string | null = null): StorageLike & { value: string | null } {
  return {
    value: initial,
    getItem() {
      return this.value
    },
    setItem(_key, value) {
      this.value = value
    },
  }
}

function gameRecord(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    mode: 'Niveaux',
    score: 150,
    date: '2025-05-08',
    accuracy: 100,
    averageResponseTime: 2.1,
    bestStreak: 1,
    ...overrides,
  }
}

const correctEntry: QuestionLogEntry = {
  text: '7 × 8',
  answer: 56,
  result: 'correct',
  given: '56',
  seconds: 2.1,
}

describe('game log storage', () => {
  it('roundtrips a valid log with its game record', () => {
    const storage = memoryStorage()
    saveGameRecord(gameRecord({ log: [correctEntry] }), storage)

    expect(readGameData(storage).history[0].log).toEqual([correctEntry])
  })

  it('drops invalid log entries without rejecting the game record', () => {
    const storage = memoryStorage(JSON.stringify({
      ...emptyGameData(),
      history: [gameRecord({
        log: [
          correctEntry,
          { text: '', answer: 3, result: 'wrong' },
          { text: '2 + 2', answer: 4, result: 'unknown' },
          { text: '3 + 3', answer: 6, result: 'correct', seconds: -1 },
          { text: '4 + 4', answer: 8, result: 'correct', n: 0 },
        ] as QuestionLogEntry[],
      })],
    }))

    const data = readGameData(storage)

    expect(data.history).toHaveLength(1)
    expect(data.history[0].score).toBe(150)
    expect(data.history[0].log).toEqual([correctEntry])
  })

  it('keeps the newest 200 entries when normalizing a saved log', () => {
    const log = Array.from({ length: MAX_LOG_ENTRIES + 1 }, (_, index) => ({
      text: `question ${index + 1}`,
      answer: index + 1,
      result: 'correct' as const,
      n: index + 1,
    }))
    const storage = memoryStorage(JSON.stringify({
      ...emptyGameData(),
      history: [gameRecord({ log })],
    }))

    const savedLog = readGameData(storage).history[0].log ?? []

    expect(savedLog).toHaveLength(MAX_LOG_ENTRIES)
    expect(savedLog[0]).toEqual(log[1])
    expect(savedLog[MAX_LOG_ENTRIES - 1]).toEqual(log[MAX_LOG_ENTRIES])
  })

  it('keeps legacy records without a log loadable', () => {
    const storage = memoryStorage(JSON.stringify({
      ...emptyGameData(),
      history: [gameRecord()],
    }))

    const data = readGameData(storage)

    expect(data.history).toHaveLength(1)
    expect(data.history[0]).not.toHaveProperty('log')
  })

  it('persists logs only on the 20 newest history records', () => {
    const history = Array.from({ length: 21 }, (_, index) => gameRecord({
      score: index,
      log: [correctEntry],
    }))
    const storage = memoryStorage()

    writeGameData({ ...emptyGameData(), history }, storage)

    const persisted = JSON.parse(storage.value ?? '{}') as { history: GameRecord[] }
    expect(persisted.history.slice(0, 20).every((record) => record.log?.length === 1)).toBe(true)
    expect(persisted.history[20]).not.toHaveProperty('log')
    expect(persisted.history[20].score).toBe(20)
  })
})
