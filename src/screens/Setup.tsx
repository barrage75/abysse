import { useState } from 'react'
import { LEVELS } from '../game/levels'
import type { Operation } from '../game/questions'
import { ZEN_DURATIONS, type ZenConfig, type ZenDuration } from '../game/zen'

interface NiveauxSetupProps {
  onStart: (level: number) => void
  onBack: () => void
}

export function NiveauxSetup({ onStart, onBack }: NiveauxSetupProps) {
  const [selectedLevel, setSelectedLevel] = useState(1)
  return (
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>← Accueil</button>
      <p className="eyebrow">Solo Niveaux</p>
      <h1>Où commencez-vous ?</h1>
      <p className="page-intro">Vous avez 3 vies. Le niveau augmente toutes les 10 bonnes réponses.</p>
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
            <span className="level-name">{level.name}</span>
            <span className="level-detail">{level.secondsPerQuestion} s · ×{level.multiplier.toFixed(1)}</span>
          </button>
        ))}
      </div>
      <button className="button button-primary setup-start" onClick={() => onStart(selectedLevel)}>Commencer</button>
    </main>
  )
}

interface ZenSetupProps {
  onStart: (config: ZenConfig) => void
  onBack: () => void
}

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: '+', label: 'Addition' },
  { value: '-', label: 'Soustraction' },
  { value: '×', label: 'Multiplication' },
  { value: '÷', label: 'Division' },
]

export function ZenSetup({ onStart, onBack }: ZenSetupProps) {
  const [operations, setOperations] = useState<Operation[]>(['+', '-'])
  const [duration, setDuration] = useState<ZenDuration>(60)
  const [showTimer, setShowTimer] = useState(true)
  const [showScore, setShowScore] = useState(true)
  const [error, setError] = useState('')

  function toggleOperation(operation: Operation) {
    setOperations((current) => current.includes(operation)
      ? current.filter((item) => item !== operation)
      : [...current, operation])
    setError('')
  }

  return (
    <main className="page-shell setup-page">
      <button className="back-button" onClick={onBack}>← Accueil</button>
      <p className="eyebrow">Chrono libre</p>
      <h1>À votre façon.</h1>
      <p className="page-intro">Choisissez les opérations et le temps. Les réponses se valident seules.</p>

      <fieldset className="setup-field">
        <legend>Opérations</legend>
        <div className="operation-options">
          {OPERATIONS.map((operation) => (
            <label key={operation.value} className="check-option">
              <input
                type="checkbox"
                checked={operations.includes(operation.value)}
                onChange={() => toggleOperation(operation.value)}
              />
              <span className="operation-sign">{operation.value}</span>
              <span>{operation.label}</span>
            </label>
          ))}
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
      </fieldset>

      <fieldset className="setup-field">
        <legend>Durée</legend>
        <div className="duration-options">
          {ZEN_DURATIONS.map((seconds) => (
            <button
              type="button"
              key={seconds}
              className={`duration-option${duration === seconds ? ' is-selected' : ''}`}
              aria-pressed={duration === seconds}
              onClick={() => setDuration(seconds)}
            >
              {seconds} s
            </button>
          ))}
        </div>
      </fieldset>

      <div className="toggle-options">
        <label><input type="checkbox" checked={showTimer} onChange={(event) => setShowTimer(event.target.checked)} /> Afficher le chrono</label>
        <label><input type="checkbox" checked={showScore} onChange={(event) => setShowScore(event.target.checked)} /> Afficher le score</label>
      </div>
      <button
        className="button button-primary setup-start"
        onClick={() => {
          if (operations.length === 0) {
            setError('Choisissez au moins une opération.')
            return
          }
          onStart({ operations, duration, showTimer, showScore })
        }}
      >
        Commencer
      </button>
    </main>
  )
}
