import { useCallback, useEffect, useRef, useState } from 'react'
import { NumericKeypad, useIsTouch } from '../components/NumericKeypad'
import { Octo } from '../components/Octo'
import { ACHIEVEMENTS } from '../game/achievements'
import { isInteractiveTarget } from '../game/keyboard'
import { nextWarmup, checkWarmup } from '../game/warmup'
import { playSound } from '../game/sound'
import type { RandomSource } from '../game/rng'
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
  const isTouch = useIsTouch()
  const rngRef = useRef<RandomSource>(Math.random)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const submissionLockedRef = useRef(false)
  const wrongTimeoutRef = useRef<number | null>(null)
  const pointsTimeoutRef = useRef<number | null>(null)
  const unlockTimeoutRef = useRef<number | null>(null)
  const pointsIdRef = useRef(0)
  const [warmupQuestion, setWarmupQuestion] = useState(() => nextWarmup(Math.random))
  const [warmupAnswer, setWarmupAnswer] = useState('')
  const [warmupStreak, setWarmupStreak] = useState(0)
  const [warmupWrong, setWarmupWrong] = useState(false)
  const [pointsId, setPointsId] = useState<number | null>(null)
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

  const submitWarmup = useCallback(() => {
    if (submissionLockedRef.current) return
    if (checkWarmup(warmupAnswer, warmupQuestion)) {
      submissionLockedRef.current = true
      setWarmupStreak((current) => current + 1)
      setWarmupQuestion(nextWarmup(rngRef.current, warmupQuestion.text))
      setWarmupAnswer('')
      setWarmupWrong(false)
      playSound('correct')
      pointsIdRef.current += 1
      setPointsId(pointsIdRef.current)
      if (pointsTimeoutRef.current !== null) window.clearTimeout(pointsTimeoutRef.current)
      pointsTimeoutRef.current = window.setTimeout(() => {
        setPointsId(null)
        pointsTimeoutRef.current = null
      }, 900)
      unlockTimeoutRef.current = window.setTimeout(() => {
        submissionLockedRef.current = false
        unlockTimeoutRef.current = null
      }, 180)
      return
    }
    if (warmupAnswer === '') return

    submissionLockedRef.current = true
    setWarmupWrong(true)
    setWarmupStreak(0)
    playSound('wrong')
    wrongTimeoutRef.current = window.setTimeout(() => {
      setWarmupQuestion(nextWarmup(rngRef.current, warmupQuestion.text))
      setWarmupAnswer('')
      setWarmupWrong(false)
      submissionLockedRef.current = false
      wrongTimeoutRef.current = null
    }, 900)
  }, [warmupAnswer, warmupQuestion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const target = event.target instanceof HTMLElement ? event.target : null
      const input = target?.closest('input, textarea, select, [contenteditable="true"]')
      if (input && input !== answerInputRef.current) return

      if (event.key === 'Enter') {
        if (input === answerInputRef.current) {
          if (!event.repeat) {
            event.preventDefault()
            submitWarmup()
          }
          return
        }
        if (event.repeat || isInteractiveTarget(target)) return
        event.preventDefault()
        submitWarmup()
        return
      }
      if (input === answerInputRef.current || submissionLockedRef.current) return
      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        setWarmupAnswer((current) => `${current}${event.key}`)
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        setWarmupAnswer((current) => current.slice(0, -1))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [submitWarmup])

  useEffect(() => () => {
    if (wrongTimeoutRef.current !== null) window.clearTimeout(wrongTimeoutRef.current)
    if (pointsTimeoutRef.current !== null) window.clearTimeout(pointsTimeoutRef.current)
    if (unlockTimeoutRef.current !== null) window.clearTimeout(unlockTimeoutRef.current)
  }, [])

  return (
    <main className="home page-shell">
      <header className="home-heading">
        <h1 className="logo-badge">ABYSSE</h1>
        <Octo mood="happy" className="home-octo" />
      </header>
      <div className="home-layout">
        <section className={`warmup-card card${warmupWrong ? ' is-wrong' : ''}`} aria-labelledby="warmup-title">
          <p className="warmup-label">{t.home.warmupLabel}</p>
          <p className="warmup-streak" aria-live="polite">{t.home.warmupStreak(warmupStreak)}</p>
          <h2 id="warmup-title" className="warmup-question">
            {warmupQuestion.text} <span>=</span>
          </h2>
          <label className="visually-hidden" htmlFor="warmup-answer">{t.game.answerLabel}</label>
          <div className="answer-form warmup-answer-form">
            <input
              id="warmup-answer"
              ref={answerInputRef}
              className="zen-answer-input warmup-answer"
              value={warmupAnswer}
              onChange={(event) => setWarmupAnswer(event.target.value.replace(/\D/g, ''))}
              inputMode={isTouch ? 'none' : 'numeric'}
              autoComplete="off"
              aria-describedby="warmup-feedback"
              placeholder="?"
              disabled={warmupWrong}
            />
            {!isTouch && (
              <button
                className="button button-primary"
                type="button"
                onClick={submitWarmup}
                disabled={warmupWrong}
              >
                {t.game.submit}
              </button>
            )}
          </div>
          <p id="warmup-feedback" className="warmup-feedback" role="status" aria-live="polite">
            {warmupWrong ? `= ${warmupQuestion.answer}` : ''}
          </p>
          {pointsId !== null && (
            <span className="points-pop" key={`warmup-points-${pointsId}`} aria-hidden="true">+1</span>
          )}
          <NumericKeypad
            onDigit={(digit) => {
              if (!submissionLockedRef.current) setWarmupAnswer((current) => `${current}${digit}`)
            }}
            onBackspace={() => {
              if (!submissionLockedRef.current) setWarmupAnswer((current) => current.slice(0, -1))
            }}
            onClear={() => {
              if (!submissionLockedRef.current) setWarmupAnswer('')
            }}
            onSubmit={submitWarmup}
            submitLabel={t.game.submit}
            disabled={warmupWrong}
          />
        </section>

        <div className="home-side">
          <nav className="home-mode-tiles" aria-label={t.home.modesAria}>
            <button className="home-mode-tile tile-levels" type="button" onClick={onLevels}>
              <span className="home-mode-icon" aria-hidden="true">★</span>
              <strong>{t.home.levelLabel}</strong>
              <small>{levelDetail}</small>
            </button>
            <button className="home-mode-tile tile-chrono" type="button" onClick={onZen}>
              <span className="home-mode-icon" aria-hidden="true"><ClockIcon /></span>
              <strong>{t.home.timeAttackLabel}</strong>
              <small>{timeAttackDetail}</small>
            </button>
            <button
              className="home-mode-tile tile-daily"
              type="button"
              disabled={dailyPlayed}
              onClick={onDaily}
            >
              <span className="home-mode-icon" aria-hidden="true">✦</span>
              <strong>{t.home.dailyLabel}</strong>
              <small>{dailyStatus}</small>
            </button>
          </nav>

          <div className="home-chips">
            <button className="home-chip card" type="button" onClick={onRecords}>
              <span className="shortcut-symbol" aria-hidden="true">▤</span>
              <span>{t.home.recordsLabel}</span>
            </button>
            <button className="home-chip card" type="button" onClick={onAchievements}>
              <span className="shortcut-symbol" aria-hidden="true">✦</span>
              <span>{t.home.achievementsLabel} <small>{t.home.achievementCount(achievements, ACHIEVEMENTS.length)}</small></span>
            </button>
          </div>
        </div>
      </div>

      <p className="home-footer">{t.home.offline}</p>
    </main>
  )
}
