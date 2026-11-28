import { useEffect, useRef, useState } from 'react'
import { LEVELS } from '../game/levels'
import type { Operation } from '../game/questions'
import type { StoredGameData } from '../game/storage'
import { zenComboKey, ZEN_DURATIONS, type ZenConfig, type ZenDuration } from '../game/zen'
import { useLang } from '../i18n/useLang'
import { levelName, localeFor } from '../i18n/helpers'

interface NiveauxSetupProps {
  onStart: (level: number) => void
  onBack: () => void
}

export function NiveauxSetup({ onStart, onBack }: NiveauxSetupProps) {
  const [selectedLevel, setSelectedLevel] = useState(1)
  const selectedLevelRef = useRef(1)
  const floorRefs = useRef(new Map<number, HTMLButtonElement>())
  const { lang, t } = useLang()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
        || document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? 1 : -1
      const next = Math.max(1, Math.min(LEVELS.length, selectedLevelRef.current + direction))
      selectedLevelRef.current = next
      setSelectedLevel(next)
      window.requestAnimationFrame(() => floorRefs.current.get(next)?.focus())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function chooseLevel(level: number) {
    selectedLevelRef.current = level
    setSelectedLevel(level)
  }

  return (
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.setup.levelsEyebrow}</p>
      <h1>{t.setup.levelsTitle}</h1>
      <p className="page-intro">{t.setup.levelsIntro}</p>
      <div className="level-floor-list" role="group" aria-label={t.setup.levelsTitle}>
        {[...LEVELS].reverse().map((level) => (
          <button
            key={level.id}
            type="button"
            ref={(button) => {
              if (button) floorRefs.current.set(level.id, button)
              else floorRefs.current.delete(level.id)
            }}
            className={`level-floor${selectedLevel === level.id ? ' is-selected' : ''}`}
            aria-pressed={selectedLevel === level.id}
            onClick={() => chooseLevel(level.id)}
          >
            <span className={`level-floor-number${selectedLevel === level.id ? ' is-selected' : ''}`}>{level.id}</span>
            <span className="level-floor-copy">
              <strong>{levelName(level.id, t)}</strong>
              <small>{t.setup.levelDetail(
                level.secondsPerQuestion,
                new Intl.NumberFormat(localeFor(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(level.multiplier),
              )}</small>
            </span>
          </button>
        ))}
      </div>
      <button className="button button-primary setup-start" onClick={() => onStart(selectedLevel)}>{t.setup.levelsStart(selectedLevel)}</button>
    </main>
  )
}

interface DailySetupProps {
  onStart: () => void
  onBack: () => void
  date: Date
}

export function DailySetup({ onStart, onBack, date }: DailySetupProps) {
  const { lang, t } = useLang()
  const locale = localeFor(lang)
  const longDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  const formattedDate = longDate.charAt(0).toLocaleUpperCase(locale) + longDate.slice(1)

  return (
    <main className="page-shell setup-page daily-setup">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <section className="daily-ticket">
        <p className="eyebrow">{t.setup.dailyEyebrow}</p>
        <h1>{t.setup.dailyTitle}</h1>
        <p className="page-intro">{t.setup.dailyIntro(formattedDate)}</p>
        <ul className="rules-list">
          <li>{t.setup.dailyRule1}</li>
          <li>{t.setup.dailyRule2}</li>
          <li>{t.setup.dailyRule3}</li>
          <li>{t.setup.dailyRule4}</li>
        </ul>
      </section>
      <button className="button button-primary setup-start" onClick={onStart}>{t.setup.start}</button>
    </main>
  )
}

interface ZenSetupProps {
  onStart: (config: ZenConfig) => void
  onBack: () => void
  bestScores: StoredGameData['bestScores']
}

const OPERATIONS: Operation[] = ['+', '-', '×', '÷']
const OPERATION_NAMES = {
  '+': 'addition',
  '-': 'subtraction',
  '×': 'multiplication',
  '÷': 'division',
} as const
const OPERATION_CLASSES = {
  '+': 'addition',
  '-': 'subtraction',
  '×': 'multiplication',
  '÷': 'division',
} as const

export function ZenSetup({ onStart, onBack, bestScores }: ZenSetupProps) {
  const { lang, t } = useLang()
  const [operations, setOperations] = useState<Operation[]>(['+', '-'])
  const [duration, setDuration] = useState<ZenDuration>(60)
  const [error, setError] = useState('')
  const bestScore = bestScores[`Chrono libre:${zenComboKey({ duration, operations })}`]?.score
  const bestScoreLabel = bestScore === undefined ? '—' : bestScore.toLocaleString(localeFor(lang))

  function toggleOperation(operation: Operation) {
    setOperations((current) => current.includes(operation)
      ? current.filter((item) => item !== operation)
      : [...current, operation])
    setError('')
  }

  return (
    <main className="page-shell setup-page zen-setup">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.setup.timeAttackEyebrow}</p>
      <h1>{t.setup.timeAttackTitle}</h1>

      <fieldset className="setup-field">
        <legend>{t.setup.operationsLegend}</legend>
        <div className="operation-toggle-grid">
          {OPERATIONS.map((operation) => (
            <button
              key={operation}
              type="button"
              className={`operation-toggle operation-toggle-${OPERATION_CLASSES[operation]}${operations.includes(operation) ? ' is-selected' : ''}`}
              aria-pressed={operations.includes(operation)}
              onClick={() => toggleOperation(operation)}
            >
              <span className="operation-toggle-sign" aria-hidden="true">{operation}</span>
              <span className="operation-toggle-label">
                {t.operations[OPERATION_NAMES[operation]]}
                {operations.includes(operation) && <span aria-hidden="true"> ✓</span>}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="field-error" role="alert">{t.setup.emptyOperations}</p>}
      </fieldset>

      <fieldset className="setup-field">
        <legend>{t.setup.durationLegend}</legend>
        <div className="duration-options">
          {ZEN_DURATIONS.map((seconds) => (
            <button
              type="button"
              key={seconds}
              className={`duration-option${duration === seconds ? ' is-selected' : ''}`}
              aria-pressed={duration === seconds}
              onClick={() => setDuration(seconds)}
            >
              {t.setup.durationLabel(seconds)}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="zen-best-line">{t.setup.timeAttackBest(bestScoreLabel)}</p>
      <button
        className="button button-primary setup-start"
        onClick={() => {
          if (operations.length === 0) {
            setError(t.setup.emptyOperations)
            return
          }
          onStart({ operations, duration })
        }}
      >
        {t.setup.timeAttackStart}
      </button>
    </main>
  )
}
