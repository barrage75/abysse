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
  const dailyBest = data.bestScores['Défi Quotidien']?.score ?? 0
  const zenBest = Object.entries(data.bestScores)
    .filter(([key]) => key.startsWith('Chrono libre:'))
    .reduce((best, [, score]) => Math.max(best, score.score), 0)
  const best = Math.max(levelsBest, dailyBest)
  const achievements = data.achievements.length
  const dailyStatus = dailyPlayed
    ? t.home.dailyPlayed(formatScore(dailyScore ?? 0))
    : t.home.dailyAvailable

  return (
    <main className="home page-shell">
      <header className="home-heading">
        <h1 className="logo-badge">ABYSSE</h1>
        <Octo mood="happy" className="home-octo" />
      </header>
      <p className="home-tagline">{t.home.tagline}</p>

      <nav className="home-modes" aria-label={t.home.modesAria}>
        <button className="mode-card card" type="button" onClick={onLevels}>
          <span className="mode-icon mode-icon-levels" aria-hidden="true">★</span>
          <span className="mode-copy">
            <strong>{t.home.levelLabel}</strong>
            <small>{levelsBest ? t.home.levelBest(formatScore(levelsBest)) : t.home.levelDetail}</small>
          </span>
          <span className="mode-arrow" aria-hidden="true">›</span>
        </button>
        <button className="mode-card card" type="button" onClick={onZen}>
          <span className="mode-icon mode-icon-chrono" aria-hidden="true"><ClockIcon /></span>
          <span className="mode-copy">
            <strong>{t.home.timeAttackLabel}</strong>
            <small>{zenBest ? t.home.timeAttackBest(formatScore(zenBest)) : t.home.timeAttackDetail}</small>
          </span>
          <span className="mode-arrow" aria-hidden="true">›</span>
        </button>
        <button
          className={`mode-card card${dailyPlayed ? ' is-played' : ''}`}
          type="button"
          disabled={dailyPlayed}
          onClick={onDaily}
        >
          <span className="mode-icon mode-icon-daily" aria-hidden="true">✦</span>
          <span className="mode-copy">
            <strong>{t.home.dailyLabel}</strong>
            <small>{dailyPlayed ? t.home.dailyPlayed(formatScore(dailyScore ?? 0)) : t.home.dailyAvailable}</small>
          </span>
          <span className="mode-arrow" aria-hidden="true">›</span>
        </button>
      </nav>

      <div className="home-shortcuts">
        <button className="shortcut-card card" type="button" onClick={onRecords}>
          <span className="shortcut-symbol" aria-hidden="true">▤</span>
          <span>{t.home.recordsLabel}</span>
        </button>
        <button className="shortcut-card card" type="button" onClick={onAchievements}>
          <span className="shortcut-symbol" aria-hidden="true">✦</span>
          <span>
            {t.home.achievementsLabel}
            <small>{t.home.achievementCount(achievements, ACHIEVEMENTS.length)}</small>
          </span>
        </button>
      </div>

      <section className="home-stats">
        <div className="stat-tile">
          <span>{t.home.bestLabel}</span>
          <strong>{best ? formatScore(best) : '—'}</strong>
        </div>
        <div className="stat-tile">
          <span>{t.home.achievementsLabel}</span>
          <strong>{achievements}/{ACHIEVEMENTS.length}</strong>
        </div>
        <div className="stat-tile stat-daily">
          <span>{t.home.dailyLabel}</span>
          <strong>{dailyPlayed ? '✓' : '·'}</strong>
          <small>{dailyStatus}</small>
        </div>
      </section>

      <p className="home-footer">{t.home.offline}</p>
    </main>
  )
}
