import octo from '../assets/octo.webp'
import type { GameResult } from './types'

interface FinDePartieProps {
  result: GameResult
  onReplay: () => void
  onHome: () => void
}

export function FinDePartie({ result, onReplay, onHome }: FinDePartieProps) {
  return (
    <main className="page-shell result-page">
      <button className="back-button" onClick={onHome}>← Accueil</button>
      <img className="result-octo" src={octo} alt="" />
      <p className="eyebrow">Fin de partie, {result.mode}</p>
      <h1>{result.score}<span className="result-unit"> points</span></h1>
      {result.mode === 'Niveaux' && (
        <p className="adjusted-score">Score ajusté <strong>{result.adjustedScore}</strong></p>
      )}
      {result.isNewRecord && result.score > 0 && <div className="record-badge">Nouveau record</div>}
      <section className="result-stats">
        <div><span>Précision</span><strong>{result.accuracy}%</strong></div>
        <div><span>Temps moyen</span><strong>{result.averageResponseTime.toFixed(1)} s</strong></div>
        <div><span>Meilleure série</span><strong>{result.bestStreak}</strong></div>
        <div><span>Bonnes réponses</span><strong>{result.correct}</strong></div>
        {result.mode === 'Chrono libre' && <div><span>Passées</span><strong>{result.skipped}</strong></div>}
      </section>
      <div className="result-actions">
        {result.mode !== 'Défi Quotidien' && <button className="button button-primary" onClick={onReplay}>Rejouer</button>}
        <button className="button button-secondary" onClick={onHome}>Accueil</button>
      </div>
      {result.mode === 'Défi Quotidien' && <p className="daily-note">Un nouveau défi vous attend demain.</p>}
      {result.mode !== 'Défi Quotidien' && <p className="keyboard-hint">Entrée ou R pour rejouer</p>}
    </main>
  )
}
