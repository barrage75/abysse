import { useEffect, useRef, useState, type PointerEvent } from 'react'
import bgLab from '../assets/bg-lab.webp'
import octoLab from '../assets/octo-lab.webp'
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

type IntroPhase = 'waiting' | 'intro' | 'static'

let introPlayed = false

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src
  })
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
  const { lang, t } = useLang()
  const formatScore = (score: number) => score.toLocaleString(localeFor(lang))
  const levelsBest = data.bestScores.Niveaux?.score ?? 0
  const dailyBest = data.bestScores['Défi Quotidien']?.score ?? 0
  const zenBest = Object.entries(data.bestScores)
    .filter(([key]) => key.startsWith('Chrono libre:'))
    .reduce((best, [, score]) => Math.max(best, score.score), 0)
  const best = Math.max(levelsBest, dailyBest)
  const homeRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<IntroPhase>(() => (introPlayed ? 'static' : 'waiting'))

  useEffect(() => {
    if (phase !== 'waiting') return
    let cancelled = false
    const start = () => {
      if (cancelled) return
      introPlayed = true
      setPhase('intro')
    }
    const fallback = window.setTimeout(start, 3500)
    void Promise.all([loadImage(bgLab), loadImage(octoLab)]).then(start)
    return () => {
      cancelled = true
      window.clearTimeout(fallback)
    }
  }, [phase])

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const home = homeRef.current
    if (!home || event.pointerType !== 'mouse') return
    const rect = home.getBoundingClientRect()
    home.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3))
    home.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3))
  }

  return (
    <main className={`home is-${phase}`} ref={homeRef} onPointerMove={handlePointerMove}>
      <div className="home-scene" aria-hidden="true">
        <div className="home-bg" />
        <div className="home-octo-wrap">
          <div className="home-octo-lean">
            <img className="home-octo" src={octoLab} alt="" />
            {['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map((flask) => (
              <span className={`flask-fizz ${flask}`} key={flask}><i /><i /><i /></span>
            ))}
          </div>
        </div>
      </div>
      <section className="home-panel">
        <h1 className="logo" aria-label="ABYSSE">
          {'ABYSSE'.split('').map((letter, index) => (
            <span className="logo-letter" aria-hidden="true" style={{ '--i': index } as React.CSSProperties} key={index}>{letter}</span>
          ))}
        </h1>
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
