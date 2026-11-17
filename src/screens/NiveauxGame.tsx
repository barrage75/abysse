import { useEffect, useRef } from 'react'
import { NumericKeypad } from '../components/NumericKeypad'
import { getLevel } from '../game/levels'
import type { GameSession } from './types'

interface NiveauxGameProps {
  session: GameSession
  remainingSeconds: number
  answer: string
  feedback: string
  levelUp: boolean
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  onBackspace: () => void
  onClear: () => void
  onQuit: () => void
}

export function NiveauxGame({
  session,
  remainingSeconds,
  answer,
  feedback,
  levelUp,
  onAnswerChange,
  onSubmit,
  onBackspace,
  onClear,
  onQuit,
}: NiveauxGameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const level = getLevel(session.level)
  const progress = Math.max(0, Math.min(100, (remainingSeconds / session.timeLimitSeconds) * 100))

  useEffect(() => {
    inputRef.current?.focus()
  }, [session.questionNumber])

  return (
    <main className="game-page page-shell">
      <header className="game-header">
        <button className="back-button" onClick={onQuit}>Quitter</button>
        <span className="game-mode-label">{session.mode}</span>
        <div className="lives" aria-label={`${session.lives} vies restantes`}>
          {Array.from({ length: 3 }, (_, index) => <span key={index} className={index < session.lives ? 'life is-live' : 'life'}>●</span>)}
        </div>
      </header>

      {levelUp && <div className="level-up-banner" role="status">NIVEAU SUPÉRIEUR · {level.name}</div>}
      <section className="game-meta">
        <div><span>Niveau {session.level}</span><strong>{level.name}</strong></div>
        <div><span>Score</span><strong>{session.score}</strong></div>
        <div><span>Série</span><strong>{session.streak}</strong></div>
      </section>
      <div className="question-timer" aria-label={`${Math.ceil(remainingSeconds)} secondes restantes`}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <section className="question-area">
        <p className="question-count">Question {session.questionNumber}</p>
        <h1 className="question-text">{session.question.text} <span>=</span></h1>
        <form
          className="answer-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label className="visually-hidden" htmlFor="answer">Votre réponse</label>
          <input
            id="answer"
            ref={inputRef}
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby="answer-feedback"
            placeholder="?"
          />
          <button className="button button-primary" type="submit">Valider</button>
        </form>
        <p id="answer-feedback" className="answer-feedback" aria-live="polite">{feedback || 'Entrée pour valider'}</p>
        <NumericKeypad
          onDigit={(digit) => onAnswerChange(`${answer}${digit}`)}
          onBackspace={onBackspace}
          onClear={onClear}
        />
      </section>
      <p className="game-hint">Une bonne réponse en moins de 3 secondes vaut 150 points.</p>
    </main>
  )
}
