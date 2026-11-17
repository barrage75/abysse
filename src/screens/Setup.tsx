import { useState } from 'react'
import { LEVELS } from '../game/levels'
import type { Operation } from '../game/questions'
import { ZEN_DURATIONS, type ZenConfig, type ZenDuration } from '../game/zen'
import { useLang } from '../i18n/useLang'
import { levelName, localeFor } from '../i18n/helpers'

interface NiveauxSetupProps {
  onStart: (level: number) => void
  onBack: () => void
}

export function NiveauxSetup({ onStart, onBack }: NiveauxSetupProps) {
  const [selectedLevel, setSelectedLevel] = useState(1)
  const { lang, t } = useLang()
  return (
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.setup.levelsEyebrow}</p>
      <h1>{t.setup.levelsTitle}</h1>
      <p className="page-intro">{t.setup.levelsIntro}</p>
      <div className="level-grid">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`level-option${selectedLevel === level.id ? ' is-selected' : ''}`}
            aria-pressed={selectedLevel === level.id}
            onClick={() => setSelectedLevel(level.id)}
          >
            <span className="level-number">{level.id}</span>
            <span className="level-name">{levelName(level.id, t)}</span>
            <span className="level-detail">{t.setup.levelDetail(
              level.secondsPerQuestion,
              new Intl.NumberFormat(localeFor(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(level.multiplier),
            )}</span>
          </button>
        ))}
      </div>
      <button className="button button-primary setup-start" onClick={() => onStart(selectedLevel)}>{t.setup.start}</button>
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
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.setup.dailyEyebrow}</p>
      <h1>{t.setup.dailyTitle}</h1>
      <p className="page-intro">{t.setup.dailyIntro(formattedDate)}</p>
      <ul className="rules-list">
        <li>{t.setup.dailyRule1}</li>
        <li>{t.setup.dailyRule2}</li>
        <li>{t.setup.dailyRule3}</li>
        <li>{t.setup.dailyRule4}</li>
      </ul>
      <button className="button button-primary setup-start" onClick={onStart}>{t.setup.start}</button>
    </main>
  )
}

interface ZenSetupProps {
  onStart: (config: ZenConfig) => void
  onBack: () => void
}

const OPERATIONS: Operation[] = ['+', '-', '×', '÷']

export function ZenSetup({ onStart, onBack }: ZenSetupProps) {
  const { t } = useLang()
  const [operations, setOperations] = useState<Operation[]>(['+', '-'])
  const [duration, setDuration] = useState<ZenDuration>(60)
  const [error, setError] = useState('')

  function toggleOperation(operation: Operation) {
    setOperations((current) => current.includes(operation)
      ? current.filter((item) => item !== operation)
      : [...current, operation])
    setError('')
  }

  return (
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.setup.timeAttackEyebrow}</p>
      <h1>{t.setup.timeAttackTitle}</h1>
      <p className="page-intro">{t.setup.timeAttackIntro}</p>

      <fieldset className="setup-field">
        <legend>{t.setup.operationsLegend}</legend>
        <div className="operation-options">
          {OPERATIONS.map((operation) => (
            <label key={operation} className="check-option">
              <input
                type="checkbox"
                checked={operations.includes(operation)}
                onChange={() => toggleOperation(operation)}
              />
              <span className="operation-sign">{operation}</span>
              <span>{t.operations[operation === '+' ? 'addition' : operation === '-' ? 'subtraction' : operation === '×' ? 'multiplication' : 'division']}</span>
            </label>
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
              {t.records.duration(seconds)}
            </button>
          ))}
        </div>
      </fieldset>

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
        {t.setup.start}
      </button>
    </main>
  )
}
