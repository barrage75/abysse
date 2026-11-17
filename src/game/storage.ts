import type { ZenConfig } from './zen'
import { zenComboKey } from './zen'

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
}

export function emptyGameData(): StoredGameData {
  return { version: 1, bestScores: {}, achievements: [], dailyResults: [], history: [] }
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeGameData(value: unknown): StoredGameData {
  if (!isRecord(value) || value.version !== 1) return emptyGameData()
  return {
    version: 1,
    bestScores: isRecord(value.bestScores) ? value.bestScores as Record<string, BestScore> : {},
    achievements: Array.isArray(value.achievements) ? value.achievements as UnlockedAchievement[] : [],
    dailyResults: Array.isArray(value.dailyResults) ? value.dailyResults as DailyResult[] : [],
    history: Array.isArray(value.history) ? value.history.slice(0, 50) as GameRecord[] : [],
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
  const isNewRecord = !previous || record.score > previous.score

  data.history = [record, ...data.history].slice(0, 50)
  if (isNewRecord) {
    data.bestScores[key] = { score: record.score, date: record.date, accuracy: record.accuracy }
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
  return readGameData(storage).dailyResults.some((result) => result.date === date)
}

export function lockDailyChallenge(date: string, storage?: StorageLike): StoredGameData {
  const data = readGameData(storage)
  if (!data.dailyResults.some((result) => result.date === date)) {
    data.dailyResults = [...data.dailyResults, { date }]
    writeGameData(data, storage)
  }
  return data
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
