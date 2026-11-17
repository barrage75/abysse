import type { Language } from '../i18n/context'
import { localeFor } from '../i18n/helpers'
import en from '../i18n/en'
import fr from '../i18n/fr'

export function formatDailyShareText(
  lang: Language,
  date: string,
  score: number,
  correct: number,
  streak: number,
): string {
  const [year, month, day] = date.split('-').map(Number)
  const formattedDate = new Intl.DateTimeFormat(localeFor(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
  const formattedScore = new Intl.NumberFormat(localeFor(lang)).format(score)
  const share = lang === 'fr' ? fr.results.dailyShare : en.results.dailyShare
  return share(formattedDate, formattedScore, correct, streak)
}
