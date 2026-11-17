import type { StoredGameData } from '../game/storage'

interface RecordsProps {
  data: StoredGameData
  onBack: () => void
}

const MODE_LABELS: Record<string, string> = {
  Niveaux: 'Solo Niveaux',
  'Défi Quotidien': 'Défi Quotidien',
}

function formatZenBest(key: string): string {
  const value = key.slice('Chrono libre:'.length)
  const separator = value.indexOf('-')
  if (separator < 0) return 'Chrono libre'
  const duration = value.slice(0, separator)
  const operations = [...value.slice(separator + 1)]
    .map((operation) => operation === '-' ? '−' : operation)
    .join(' ')
  return `Chrono libre, ${duration} s, ${operations}`
}

export function Records({ data, onBack }: RecordsProps) {
  const bests = Object.entries(data.bestScores)
  return (
    <main className="page-shell list-page">
      <button className="back-button" onClick={onBack}>← Accueil</button>
      <p className="eyebrow">Sur cet appareil</p>
      <h1>Records</h1>

      <section className="record-section">
        <h2>Meilleurs scores</h2>
        {bests.length === 0 ? <p className="empty-copy">Vos records apparaîtront après une partie.</p> : (
          <div className="best-list">
            {bests.map(([key, value]) => (
              <div className="best-row" key={key}>
                <span>{key.startsWith('Chrono libre:') ? formatZenBest(key) : MODE_LABELS[key] ?? key}</span>
                <strong>{value.score}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="record-section">
        <h2>Dernières parties</h2>
        {data.history.length === 0 ? <p className="empty-copy">Aucune partie jouée pour le moment.</p> : (
          <div className="history-list">
            {data.history.map((record, index) => (
              <article className="history-row" key={`${record.date}-${record.mode}-${index}`}>
                <div>
                  <strong>{MODE_LABELS[record.mode] ?? record.mode}</strong>
                  <span>{record.date}{record.duration ? ` · ${record.duration} s` : ''}</span>
                </div>
                <div className="history-score">
                  <strong>{record.score}</strong>
                  <span>{record.accuracy}% · moyenne {record.averageResponseTime.toFixed(1)} s</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
