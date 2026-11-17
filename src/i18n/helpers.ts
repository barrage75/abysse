import type { GameMode } from '../game/storage'
import type { Dictionary, Language } from './context'

export function modeLabel(mode: GameMode, t: Dictionary): string {
  switch (mode) {
    case 'Niveaux':
      return t.modes.levels
    case 'Chrono libre':
      return t.modes.timeAttack
    case 'Défi Quotidien':
      return t.modes.daily
  }
}

export function levelName(id: number, t: Dictionary): string {
  return t.levels.names[id as keyof typeof t.levels.names] ?? t.levels.names[1]
}

export function localeFor(lang: Language): string {
  return lang === 'fr' ? 'fr-FR' : 'en-GB'
}

export function formatDateKey(dateKey: string, lang: Language, long = false): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat(localeFor(lang), long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(date)
}
