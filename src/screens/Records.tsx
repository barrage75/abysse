import type { StoredGameData } from '../game/storage'
import { useLang } from '../i18n/useLang'
import { formatDateKey, localeFor, modeLabel } from '../i18n/helpers'

interface RecordsProps {
  data: StoredGameData
  onBack: () => void
}

function formatZenBest(key: string, t: ReturnType<typeof useLang>['t']): string {
  const value = key.slice('Chrono libre:'.length)
  const separator = value.indexOf('-')
  if (separator < 0) return t.modes.timeAttack
  const duration = Number(value.slice(0, separator))
  const operations = [...value.slice(separator + 1)]
    .map((operation) => operation === '-' ? '−' : operation)
    .join(' ')
  return t.records.timeAttackBest(duration, operations)
}

export function Records({ data, onBack }: RecordsProps) {
  const { lang, t } = useLang()
  const bests = Object.entries(data.bestScores)
  return (
    <main className="page-shell list-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.records.eyebrow}</p>
      <h1>{t.records.title}</h1>

      <section className="record-section">
        <h2>{t.records.bestScores}</h2>
        {bests.length === 0 ? <p className="empty-copy">{t.records.emptyBests}</p> : (
          <div className="best-list">
            {bests.map(([key, value]) => (
              <div className="best-row" key={key}>
                <span>{key.startsWith('Chrono libre:')
                  ? formatZenBest(key, t)
                  : key === 'Niveaux' || key === 'Défi Quotidien'
                    ? modeLabel(key, t)
                    : key}</span>
                <strong>{value.score.toLocaleString(localeFor(lang))}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="record-section">
        <h2>{t.records.history}</h2>
        {data.history.length === 0 ? <p className="empty-copy">{t.records.emptyHistory}</p> : (
          <div className="history-list">
            {data.history.map((record, index) => (
              <article className="history-row" key={`${record.date}-${record.mode}-${index}`}>
                <div>
                  <strong>{modeLabel(record.mode, t)}</strong>
                  <span>{formatDateKey(record.date, lang)}{record.duration ? ` · ${t.records.duration(record.duration)}` : ''}</span>
                </div>
                <div className="history-score">
                  <strong>{record.score.toLocaleString(localeFor(lang))}</strong>
                  <span>{record.accuracy}% · {t.records.average(new Intl.NumberFormat(localeFor(lang), {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(record.averageResponseTime))}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
