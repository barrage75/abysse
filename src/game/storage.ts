import type { ZenConfig } from './zen'
import { zenComboKey } from './zen'
import { MAX_LOG_ENTRIES, type QuestionLogEntry } from './log'

export const STORAGE_KEY = 'jeu-calcul:v1'

export type GameMode = 'Niveaux' | 'Chrono libre' | 'Défi Quotidien'

export interface GameRecord {
  mode: GameMode
  score: number
  date: string
  accuracy: number
  averageResponseTime: number
  bestStreak: number
  duration?: number
  operations?: string[]
  adjustedScore?: number
  startingLevel?: number
  log?: QuestionLogEntry[]
}

export interface BestScore {
  score: number
  date: string
  accuracy: number
}

export interface UnlockedAchievement {
  id: string
  date: string
}

export interface DailyResult {
  date: string
  score?: number
}

export interface StoredGameData {
  version: 1
  bestScores: Record<string, BestScore>
  achievements: UnlockedAchievement[]
  dailyResults: DailyResult[]
  history: GameRecord[]
  levelsBestAdjusted?: true
}

export function emptyGameData(): StoredGameData {
  return { version: 1, bestScores: {}, achievements: [], dailyResults: [], history: [], levelsBestAdjusted: true }
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function isGameMode(value: unknown): value is GameMode {
  return value === 'Niveaux' || value === 'Chrono libre' || value === 'Défi Quotidien'
}

function isBestScore(value: unknown): value is BestScore {
  return isRecord(value)
    && isFiniteNumber(value.score) && value.score >= 0
    && isDateKey(value.date)
    && isFiniteNumber(value.accuracy) && value.accuracy >= 0 && value.accuracy <= 100
}

function isGameRecord(value: unknown): value is GameRecord {
  if (!isRecord(value)
    || !isGameMode(value.mode)
    || !isFiniteNumber(value.score) || value.score < 0
    || !isDateKey(value.date)
    || !isFiniteNumber(value.accuracy) || value.accuracy < 0 || value.accuracy > 100
    || !isFiniteNumber(value.averageResponseTime) || value.averageResponseTime < 0
    || !isFiniteNumber(value.bestStreak) || value.bestStreak < 0) return false
  if (value.duration !== undefined && (!isFiniteNumber(value.duration) || value.duration <= 0)) return false
  if (value.adjustedScore !== undefined && (!isFiniteNumber(value.adjustedScore) || value.adjustedScore < 0)) return false
  if (value.startingLevel !== undefined && (!isFiniteNumber(value.startingLevel) || value.startingLevel < 1)) return false
  return value.operations === undefined
    || (Array.isArray(value.operations)
      && value.operations.length > 0
      && value.operations.every((operation) => operation === '+' || operation === '-' || operation === '×' || operation === '÷'))
}

function isUnlockedAchievement(value: unknown): value is UnlockedAchievement {
  return isRecord(value) && typeof value.id === 'string' && isDateKey(value.date)
}

function isDailyResult(value: unknown): value is DailyResult {
  return isRecord(value)
    && isDateKey(value.date)
    && (value.score === undefined || (isFiniteNumber(value.score) && value.score >= 0))
}

function isQuestionLogEntry(value: unknown): value is QuestionLogEntry {
  return isRecord(value)
    && typeof value.text === 'string'
    && value.text.length > 0
    && isFiniteNumber(value.answer)
    && (value.result === 'correct' || value.result === 'wrong' || value.result === 'timeout' || value.result === 'skipped')
    && (value.given === undefined || typeof value.given === 'string')
    && (value.seconds === undefined || (isFiniteNumber(value.seconds) && value.seconds >= 0))
    && (value.attempts === undefined || (isFiniteNumber(value.attempts) && Number.isInteger(value.attempts) && value.attempts >= 0))
}

function normalizeGameRecord(record: GameRecord): GameRecord {
  const { log, ...withoutLog } = record
  if (!Array.isArray(log)) return withoutLog
  return { ...withoutLog, log: log.filter(isQuestionLogEntry).slice(0, MAX_LOG_ENTRIES) }
}

function retainRecentLogs(history: GameRecord[]): GameRecord[] {
  return history.map((record, index) => {
    if (index < 20 || record.log === undefined) return record
    const { log: _log, ...withoutLog } = record
    return withoutLog
  })
}

function normalizeGameData(value: unknown): StoredGameData {
  if (!isRecord(value) || value.version !== 1) return emptyGameData()
  const bestScores: Record<string, BestScore> = {}
  if (isRecord(value.bestScores)) {
    for (const [key, score] of Object.entries(value.bestScores)) {
      if (isBestScore(score)) bestScores[key] = score
    }
  }
  const history = Array.isArray(value.history)
    ? retainRecentLogs(value.history.filter(isGameRecord).slice(0, 50).map(normalizeGameRecord))
    : []
  const achievements = Array.isArray(value.achievements)
    ? value.achievements.filter(isUnlockedAchievement)
    : []
  const dailyResults = Array.isArray(value.dailyResults)
    ? value.dailyResults.filter(isDailyResult)
    : []

  if (value.levelsBestAdjusted !== true) {
    const previous = bestScores.Niveaux
    const bestRun = history
      .filter((record) => record.mode === 'Niveaux')
      .reduce<GameRecord | undefined>((best, record) => (
        !best || (record.adjustedScore ?? record.score) > (best.adjustedScore ?? best.score)
          ? record
          : best
      ), undefined)
    if (bestRun) {
      const score = bestRun.adjustedScore ?? bestRun.score
      if (!previous || score > previous.score) {
        bestScores.Niveaux = { score, date: bestRun.date, accuracy: bestRun.accuracy }
      }
    }
  }

  return {
    version: 1,
    bestScores,
    achievements,
    dailyResults,
    history,
    levelsBestAdjusted: true,
  }
}

export function readGameData(storage?: StorageLike): StoredGameData {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
    const raw = target?.getItem(STORAGE_KEY)
    return raw ? normalizeGameData(JSON.parse(raw) as unknown) : emptyGameData()
  } catch {
    return emptyGameData()
  }
}

export function bestNiveauxScore(data: StoredGameData): number {
  return data.history.reduce((best, record) => (
    record.mode === 'Niveaux'
      ? Math.max(best, record.adjustedScore ?? record.score)
      : best
  ), data.bestScores.Niveaux?.score ?? 0)
}

export function writeGameData(data: StoredGameData, storage?: StorageLike): void {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
    target?.setItem(STORAGE_KEY, JSON.stringify(normalizeGameData(data)))
  } catch {
    // Storage can be unavailable in private browsing; gameplay remains usable.
  }
}

export function bestScoreKey(record: Pick<GameRecord, 'mode' | 'duration' | 'operations'>): string {
  if (record.mode === 'Chrono libre' && record.duration && record.operations) {
    return `Chrono libre:${zenComboKey({ duration: record.duration as ZenConfig['duration'], operations: record.operations as ZenConfig['operations'] })}`
  }
  return record.mode
}

export function saveGameRecord(
  record: GameRecord,
  storage?: StorageLike,
): { data: StoredGameData; isNewRecord: boolean } {
  const data = readGameData(storage)
  const key = bestScoreKey(record)
  const previous = data.bestScores[key]
  const bestScore = record.mode === 'Niveaux'
    ? record.adjustedScore ?? record.score
    : record.score
  const isNewRecord = !previous || bestScore > previous.score

  data.history = retainRecentLogs(
    [record, ...data.history].slice(0, 50).map(normalizeGameRecord),
  )
  if (isNewRecord) {
    data.bestScores[key] = { score: bestScore, date: record.date, accuracy: record.accuracy }
  }
  if (record.mode === 'Défi Quotidien') {
    const existingDaily = data.dailyResults.find((item) => item.date === record.date)
    if (existingDaily) existingDaily.score = record.score
    else data.dailyResults = [...data.dailyResults, { date: record.date, score: record.score }]
  }
  writeGameData(data, storage)
  return { data, isNewRecord }
}

export function isDailyPlayed(date: string, storage?: StorageLike): boolean {
  return readGameData(storage).dailyResults.some((result) => result.date === date && result.score !== undefined)
}

export function unlockAchievements(
  ids: string[],
  date: string,
  storage?: StorageLike,
): StoredGameData {
  const data = readGameData(storage)
  const known = new Set(data.achievements.map(({ id }) => id))
  data.achievements = [
    ...data.achievements,
    ...ids.filter((id) => !known.has(id)).map((id) => ({ id, date })),
  ]
  writeGameData(data, storage)
  return data
}
