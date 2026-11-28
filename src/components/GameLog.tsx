import { useState } from 'react'
import { countLog, filterLog, type LogFilter, type LogResult, type QuestionLogEntry } from '../game/log'
import { localeFor } from '../i18n/helpers'
import { useLang } from '../i18n/useLang'

interface GameLogProps {
  entries: QuestionLogEntry[]
}

const FILTERS: LogFilter[] = ['all', 'correct', 'wrong', 'unanswered']
const MARKS: Record<LogResult, { mark: string; className: string }> = {
  correct: { mark: '✓', className: 'is-correct' },
  wrong: { mark: '✗', className: 'is-wrong' },
  timeout: { mark: '–', className: 'is-unanswered' },
  skipped: { mark: '–', className: 'is-unanswered' },
}

export function GameLog({ entries }: GameLogProps) {
  const { lang, t } = useLang()
  const [filter, setFilter] = useState<LogFilter>('all')
  const counts = countLog(entries)
  const matchingEntries = new Set(filterLog(entries, filter))
  const visibleEntries = entries
    .map((entry, index) => ({ entry, number: index + 1 }))
    .filter(({ entry }) => matchingEntries.has(entry))
  const formatSeconds = (seconds: number) => new Intl.NumberFormat(localeFor(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(seconds)

  function noteFor(entry: QuestionLogEntry): string {
    if (entry.result === 'correct') {
      const time = entry.seconds === undefined
        ? ''
        : `${formatSeconds(entry.seconds)} ${t.records.secondsUnit}`
      return `${time}${entry.attempts ? t.gameLog.attemptNote(entry.attempts) : ''}`
    }
    if (entry.result === 'wrong') return t.gameLog.yourAnswer(entry.given ?? '')
    if (entry.result === 'timeout') return t.gameLog.timeout
    return entry.given === undefined
      ? t.gameLog.skipped
      : `${t.gameLog.skipped} · ${t.gameLog.yourAnswer(entry.given)}`
  }

  return (
    <section className="game-log" aria-labelledby="game-log-title">
      <h2 id="game-log-title">{t.gameLog.title}</h2>
      <div className="game-log-filters" role="group" aria-label={t.gameLog.filterLabel}>
        {FILTERS.map((option) => (
          <button
            className={`game-log-filter${filter === option ? ' is-active' : ''}`}
            type="button"
            key={option}
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {t.gameLog.filters[option](counts[option])}
          </button>
        ))}
      </div>
      {visibleEntries.length === 0 ? (
        <p className="game-log-empty">{t.gameLog.empty}</p>
      ) : (
        <ol className="game-log-list">
          {visibleEntries.map(({ entry, number }) => {
            const mark = MARKS[entry.result]
            return (
              <li className="game-log-row" key={number}>
                <span className={`game-log-mark ${mark.className}`} aria-hidden="true">{mark.mark}</span>
                <span className="game-log-number">{number.toLocaleString(localeFor(lang))}.</span>
                <div className="game-log-copy">
                  <span className="game-log-equation">{entry.text} = <strong>{entry.answer.toLocaleString(localeFor(lang))}</strong></span>
                  <small className="game-log-note">{noteFor(entry)}</small>
                </div>
                <span className="visually-hidden">{t.gameLog.status[entry.result]}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
