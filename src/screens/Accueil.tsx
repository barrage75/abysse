import { Octo } from '../components/Octo'
import { ACHIEVEMENTS } from '../game/achievements'
import type { StoredGameData } from '../game/storage'
import { useLang } from '../i18n/useLang'
import { localeFor } from '../i18n/helpers'

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </svg>
  )
}

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
  const { t, lang } = useLang()
  const formatScore = (score: number) => score.toLocaleString(localeFor(lang))
  const levelsBest = data.bestScores.Niveaux?.score ?? 0
  const zenBest = Object.entries(data.bestScores)
    .filter(([key]) => key.startsWith('Chrono libre:'))
    .reduce((best, [, score]) => Math.max(best, score.score), 0)
  const achievements = data.achievements.length
  const dailyStatus = dailyPlayed
    ? t.home.dailyStatusPlayed(formatScore(dailyScore ?? 0))
    : t.home.dailyStatusAvailable
  const levelDetail = levelsBest
    ? t.home.levelBest(formatScore(levelsBest))
    : t.home.levelDetail
  const timeAttackDetail = zenBest
    ? t.home.timeAttackBest(formatScore(zenBest))
    : t.home.timeAttackDetail
  const recordsDetail = data.history.length > 0
    ? t.home.recordsCount(data.history.length)
    : undefined
  const achievementCount = t.home.achievementCount(achievements, ACHIEVEMENTS.length)

  return (
    <main className="home page-shell">
      <header className="home-heading">
        <h1 className="logo-badge">ABYSSE</h1>
        <span className="home-summary-chip">{achievementCount}</span>
      </header>

      <nav className="sonar-pond" aria-label={t.home.modesAria}>
        <div className="sonar-rings" aria-hidden="true">
          <span className="sonar-ring sonar-ring-one" />
          <span className="sonar-ring sonar-ring-two" />
          <span className="sonar-ring sonar-ring-three" />
        </div>
        <div className="sonar-core" aria-hidden="true">
          <Octo mood="happy" className="sonar-octo" />
        </div>

        <button
          className="sonar-orb sonar-orb-levels"
          type="button"
          aria-label={`${t.home.levelLabel}, ${levelDetail}`}
          onClick={onLevels}
        >
          <span className="sonar-orb-icon" aria-hidden="true">▲</span>
          <strong className="sonar-orb-title">{t.home.levelLabel}</strong>
          <small>{levelDetail}</small>
        </button>
        <button
          className="sonar-orb sonar-orb-chrono"
          type="button"
          aria-label={`${t.home.timeAttackLabel}, ${timeAttackDetail}`}
          onClick={onZen}
        >
          <span className="sonar-orb-icon"><ClockIcon /></span>
          <strong className="sonar-orb-title">{t.home.timeAttackLabel}</strong>
          <small>{timeAttackDetail}</small>
        </button>
        <button
          className="sonar-orb sonar-orb-daily"
          type="button"
          aria-label={`${t.home.dailyLabel}, ${dailyStatus}`}
          disabled={dailyPlayed}
          onClick={onDaily}
        >
          {!dailyPlayed && <span className="sonar-new-badge" aria-hidden="true">{t.home.newBadge}</span>}
          <span className="sonar-orb-icon" aria-hidden="true">✦</span>
          <strong className="sonar-orb-title">{t.home.dailyLabel}</strong>
          <small>{dailyStatus}</small>
        </button>
        <button
          className="sonar-orb sonar-orb-records"
          type="button"
          aria-label={recordsDetail ? `${t.home.recordsLabel}, ${recordsDetail}` : t.home.recordsLabel}
          onClick={onRecords}
        >
          <span className="sonar-orb-icon" aria-hidden="true">★</span>
          <strong className="sonar-orb-title">{t.home.recordsLabel}</strong>
          {recordsDetail && <small>{recordsDetail}</small>}
        </button>
      </nav>

      <p className="sonar-instruction">{t.home.sonarInstruction}</p>
      <div className="home-quick-actions">
        <button
          className="home-chip"
          type="button"
          aria-label={`${t.home.achievementsLabel}, ${achievementCount}`}
          onClick={onAchievements}
        >
          <span aria-hidden="true">✦</span>
          {t.home.achievementsLabel}
        </button>
      </div>
      <p className="home-footer">{t.home.offline}</p>
    </main>
  )
}
