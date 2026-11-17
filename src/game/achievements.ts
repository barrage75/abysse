import type { GameRecord } from './storage'

export interface AchievementStats {
  mode: GameRecord['mode']
  finished: boolean
  correctAnswers: number
  lightningAnswers: number
  bestStreak: number
  lightningStreak: number
  highestLevel: number
  startingLevel: number
  adjustedScore: number
  duration?: number
  score: number
  dailyDate?: string
  dailyDates?: string[]
}

export interface Achievement {
  id: string
  name: string
  description: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'premier-pas', name: 'Premier pas', description: 'Terminer une première partie.' },
  { id: 'eclair', name: 'Éclair', description: 'Donner une réponse en moins de 3 secondes.' },
  { id: 'sans-faute', name: 'Sans faute', description: 'Enchaîner 15 bonnes réponses.' },
  { id: 'tempete', name: 'Tempête', description: 'Enchaîner 5 réponses Éclair.' },
  { id: 'esprit-expert', name: 'Esprit expert', description: 'Atteindre le niveau 4.' },
  { id: 'cauchemar-vaincu', name: 'Cauchemar vaincu', description: 'Atteindre le niveau 6.' },
  { id: 'fidele', name: 'Fidèle', description: 'Jouer le Défi Quotidien pendant 3 jours.' },
  { id: 'mi-parcours', name: 'Mi-parcours', description: 'Marquer 2 500 points ajustés en mode Niveaux.' },
  { id: 'chrono-maitre', name: 'Chrono maître', description: 'Marquer 40 points en Chrono libre de 60 s.' },
  { id: 'grand-parieur', name: 'Grand parieur', description: 'Commencer une partie au niveau 6.' },
]

export function evaluate(stats: AchievementStats, history: GameRecord[]): Achievement[] {
  const dailyDays = new Set(
    history.filter((record) => record.mode === 'Défi Quotidien').map((record) => record.date),
  )
  for (const date of stats.dailyDates ?? []) dailyDays.add(date)
  if (stats.mode === 'Défi Quotidien' && stats.dailyDate) dailyDays.add(stats.dailyDate)

  const unlocked = new Set<string>()
  if (stats.finished && history.length === 0) unlocked.add('premier-pas')
  if (stats.lightningAnswers > 0) unlocked.add('eclair')
  if (stats.bestStreak >= 15) unlocked.add('sans-faute')
  if (stats.lightningStreak >= 5) unlocked.add('tempete')
  if (stats.highestLevel >= 4) unlocked.add('esprit-expert')
  if (stats.highestLevel >= 6) unlocked.add('cauchemar-vaincu')
  if (dailyDays.size >= 3) unlocked.add('fidele')
  if (stats.mode === 'Niveaux' && stats.adjustedScore >= 2500) unlocked.add('mi-parcours')
  if (stats.mode === 'Chrono libre' && stats.duration === 60 && stats.score >= 40) unlocked.add('chrono-maitre')
  if (stats.mode === 'Niveaux' && stats.startingLevel === 6) unlocked.add('grand-parieur')

  return ACHIEVEMENTS.filter((achievement) => unlocked.has(achievement.id))
}
