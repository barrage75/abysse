import { Flask } from '../components/Flask'
import type { StoredGameData } from '../game/storage'

const ClockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></svg>
)
const TrophyIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3Zm-1 4v1a2 2 0 0 0 1.2 1.8L7 7H6Zm11 0-.2 2.8A2 2 0 0 0 18 8V7h-1Z" /></svg>
)
const MedalIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h4l2 5 2-5h4l-4 8.2A6 6 0 1 1 10 10.2L6 2Zm6 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.5 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3 1-2Z" /></svg>
)

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
  const levelsBest = data.bestScores.Niveaux?.score ?? 0
  const dailyBest = data.bestScores['Défi Quotidien']?.score ?? 0
  const zenBest = Object.entries(data.bestScores)
    .filter(([key]) => key.startsWith('Chrono libre:'))
    .reduce((best, [, score]) => Math.max(best, score.score), 0)
  const best = Math.max(levelsBest, dailyBest)

  return (
    <main className="home">
      <section className="home-panel">
        <h1 className="logo">ABYSSE</h1>
        <p className="home-tagline">Le labo de calcul mental du professeur Poulpe</p>

        <nav className="flask-shelf" aria-label="Modes de jeu">
          <Flask
            shape="tube"
            color="#43d9ff"
            label="Niveaux"
            icon="★"
            detail={levelsBest ? `Record ${levelsBest}` : '6 niveaux, 3 vies'}
            onClick={onLevels}
          />
          <Flask
            shape="round"
            color="#a66bff"
            label="Chrono libre"
            icon={ClockIcon}
            detail={zenBest ? `Record ${zenBest}` : '30 s à 3 min'}
            onClick={onZen}
          />
          <Flask
            shape="cone"
            color="#9dff3a"
            label="Défi du jour"
            icon="✦"
            detail={dailyPlayed ? 'Reviens demain' : 'Même série pour tous'}
            disabled={dailyPlayed}
            onClick={onDaily}
          />
          <Flask shape="tube" color="#3fe0d0" label="Records" icon={TrophyIcon} onClick={onRecords} />
          <Flask
            shape="round"
            color="#ff5fb4"
            label="Succès"
            icon={MedalIcon}
            detail={`${data.achievements.length} sur 10`}
            onClick={onAchievements}
          />
        </nav>

        <div className="best-plaque" aria-label="Meilleur score">
          <span>Meilleur score</span>
          <strong>{best ? best.toLocaleString('fr-FR') : '—'}</strong>
        </div>
        <p className="home-footer">Hors ligne. Tes scores restent sur cet appareil.</p>
      </section>
    </main>
  )
}
