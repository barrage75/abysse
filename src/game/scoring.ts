import { getLevel } from './levels'

export interface AnswerScore {
  points: 50 | 100 | 150
  label: 'Normal' | 'Rapide' | 'Éclair'
}

export interface LevelProgress {
  correctAnswers: number
  level: number
  leveledUp: boolean
}

export function scoreCorrectAnswer(seconds: number): AnswerScore {
  if (seconds < 3) return { points: 150, label: 'Éclair' }
  if (seconds < 6) return { points: 100, label: 'Rapide' }
  return { points: 50, label: 'Normal' }
}

export function progressAfterCorrectAnswer(progress: LevelProgress): LevelProgress {
  const correctAnswers = progress.correctAnswers + 1
  const shouldLevelUp = correctAnswers % 10 === 0 && progress.level < 6
  return {
    correctAnswers,
    level: shouldLevelUp ? progress.level + 1 : progress.level,
    leveledUp: shouldLevelUp,
  }
}

export function adjustedScore(rawScore: number, startingLevel: number): number {
  return Math.round(rawScore * getLevel(startingLevel).multiplier)
}
