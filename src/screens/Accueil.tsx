import { LEVELS } from '../game/levels'
import type { StoredGameData } from '../game/storage'

interface AccueilProps {
  data: StoredGameData
  dailyPlayed: boolean
  onLevels: () => void
  onZen: () => void
  onDaily: () => void
  onRecords: () => void
  onAchievements: () => void
}

export function Accueil({
  data,
  dailyPlayed,
  onLevels,
  onZen,
  onDaily,
  onRecords,
  onAchievements,
}: AccueilProps) {
  const levelsBest = data.bestScores.Niveaux
  const dailyBest = data.bestScores['Défi Quotidien']
  const zenBest = Object.entries(data.bestScores)
    .filter(([key]) => key.startsWith('Chrono libre:'))
    .reduce((best, [, score]) => Math.max(best, score.score), 0)

  return (
    <main className="home page-shell">
      <header className="site-header">
        <a className="wordmark" href="#" onClick={(event) => event.preventDefault()} aria-label="Calcul, accueil">
          <span className="wordmark-mark">∑</span> calcul
        </a>
        <span className="offline-label"><span /> Hors ligne</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">Le calcul, à votre rythme</p>
        <h1>Un peu de calcul.<br />Beaucoup de réflexes.</h1>
        <p className="welcome-copy">Choisissez votre terrain de jeu et lancez-vous.</p>
      </section>

      <section className="mode-list" aria-label="Modes de jeu">
        <button className="mode-row mode-primary" onClick={onLevels}>
          <span className="mode-symbol">+</span>
          <span className="mode-copy"><strong>Solo Niveaux</strong><small>Une partie qui monte avec vous</small></span>
          <span className="mode-best">{levelsBest ? `${levelsBest.score} pts` : `${LEVELS.length} niveaux`}</span>
          <span className="mode-arrow" aria-hidden="true">→</span>
        </button>
        <button className="mode-row" onClick={onZen}>
          <span className="mode-symbol">◷</span>
          <span className="mode-copy"><strong>Chrono libre</strong><small>Réglez le temps et les opérations</small></span>
          <span className="mode-best">{zenBest ? `${zenBest} pts` : 'À votre mesure'}</span>
          <span className="mode-arrow" aria-hidden="true">→</span>
        </button>
        <button className="mode-row" onClick={onDaily} disabled={dailyPlayed}>
          <span className="mode-symbol">✳</span>
          <span className="mode-copy"><strong>Défi Quotidien</strong><small>{dailyPlayed ? 'Déjà joué aujourd’hui' : 'La même série pour tout le monde'}</small></span>
          <span className="mode-best">{dailyBest ? `Record ${dailyBest.score}` : 'Niv. 3'}</span>
          <span className="mode-arrow" aria-hidden="true">→</span>
        </button>
      </section>

      <section className="home-summary" aria-label="Vos records">
        <div><span>Record Niveaux</span><strong>{levelsBest?.score ?? '—'}</strong></div>
        <div><span>Parties jouées</span><strong>{data.history.length}</strong></div>
        <div><span>Succès</span><strong>{data.achievements.length}/10</strong></div>
      </section>

      <nav className="home-links" aria-label="Plus">
        <button className="text-button" onClick={onRecords}>Records locaux</button>
        <button className="text-button" onClick={onAchievements}>Succès</button>
      </nav>
      <footer className="site-footer">Vos résultats restent sur cet appareil.</footer>
    </main>
  )
}
