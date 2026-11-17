import { Flask } from '../components/Flask'
import type { StoredGameData } from '../game/storage'
import { useLang } from '../i18n/useLang'
import { localeFor } from '../i18n/helpers'

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
  dailyScore?: number
  onLevels: () => void
  onZen: () => void
  onDaily: () => void
  onRecords: () => void
  onAchievements: () => void
}

export function Accueil({
  data,
  dailyPlayed,
  dailyScore,
  onLevels,
  onZen,
  onDaily,
  onRecords,
  onAchievements,
}: AccueilProps) {
  const { lang, t } = useLang()
  const formatScore = (score: number) => score.toLocaleString(localeFor(lang))
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
        <p className="home-tagline">{t.home.tagline}</p>

        <nav className="flask-shelf" aria-label={t.home.modesAria}>
          <Flask
            shape="tube"
            color="#43d9ff"
            label={t.home.levelLabel}
            icon="★"
            detail={levelsBest ? t.home.levelBest(formatScore(levelsBest)) : t.home.levelDetail}
            onClick={onLevels}
          />
          <Flask
            shape="round"
            color="#a66bff"
            label={t.home.timeAttackLabel}
            icon={ClockIcon}
            detail={zenBest ? t.home.timeAttackBest(formatScore(zenBest)) : t.home.timeAttackDetail}
            onClick={onZen}
          />
          <Flask
            shape="cone"
            color="#9dff3a"
            label={t.home.dailyLabel}
            icon="✦"
            detail={dailyPlayed ? t.home.dailyPlayed(formatScore(dailyScore ?? 0)) : t.home.dailyAvailable}
            disabled={dailyPlayed}
            onClick={onDaily}
          />
          <Flask shape="tube" color="#3fe0d0" label={t.home.recordsLabel} icon={TrophyIcon} onClick={onRecords} />
          <Flask
            shape="round"
            color="#ff5fb4"
            label={t.home.achievementsLabel}
            icon={MedalIcon}
            detail={t.home.achievementCount(data.achievements.length)}
            onClick={onAchievements}
          />
        </nav>

        <div className="best-plaque" aria-label={t.home.bestAria}>
          <span>{t.home.bestLabel}</span>
          <strong>{best ? formatScore(best) : '—'}</strong>
        </div>
        <p className="home-footer">{t.home.offline}</p>
      </section>
    </main>
  )
}
