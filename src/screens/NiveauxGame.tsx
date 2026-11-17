import { useEffect, useRef } from 'react'
import { NumericKeypad, useIsTouch } from '../components/NumericKeypad'
import octo from '../assets/octo.webp'
import octoSad from '../assets/octo-sad.webp'
import { getLevel } from '../game/levels'
import type { Fx, GameSession } from './types'

interface NiveauxGameProps {
  session: GameSession
  remainingSeconds: number
  answer: string
  feedback: string
  levelUp: boolean
  fx: Fx | null
  quitConfirm: boolean
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  onBackspace: () => void
  onClear: () => void
  onQuit: () => void
  onRequestQuit: () => void
  onContinue: () => void
}

export function NiveauxGame({
  session,
  remainingSeconds,
  answer,
  feedback,
  levelUp,
  fx,
  quitConfirm,
  onAnswerChange,
  onSubmit,
  onBackspace,
  onClear,
  onQuit,
  onRequestQuit,
  onContinue,
}: NiveauxGameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isTouch = useIsTouch()
  const level = getLevel(session.level)
  const progress = Math.max(0, Math.min(100, (remainingSeconds / session.timeLimitSeconds) * 100))
  const isDaily = session.mode === 'Défi Quotidien'
  const mood = fx?.kind === 'wrong' || fx?.kind === 'timeout'
    ? 'sad'
    : fx?.kind === 'correct' || fx?.kind === 'levelup'
      ? 'happy'
      : 'idle'

  useEffect(() => {
    inputRef.current?.focus()
  }, [session.questionNumber])

  return (
    <main className="game-page page-shell">
      {fx && <div className="fx-layer" key={fx.id} data-kind={fx.kind} aria-hidden="true" />}
      <header className="game-header">
        <button className="back-button" onClick={onRequestQuit}>Quitter</button>
        <span className="game-mode-label">{session.mode}</span>
        <div className="lives" aria-label={`${session.lives} vies restantes`}>
          {Array.from({ length: 3 }, (_, index) => <span key={index} className={index < session.lives ? 'life is-live' : 'life'}>●</span>)}
        </div>
      </header>

      {levelUp && !isDaily && <div className="level-up-banner" role="status">Niveau supérieur : {level.name} !</div>}
      <section className="game-meta">
        <div><span>Niveau {session.level}</span><strong>{level.name}</strong></div>
        <div><span>Score</span><strong>{session.score}</strong></div>
        <div><span>Série</span><strong>{session.streak}</strong></div>
      </section>
      <div className="question-timer" aria-label={`${Math.ceil(remainingSeconds)} secondes restantes`}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <img className="game-octo" data-mood={mood} src={mood === 'sad' ? octoSad : octo} alt="" />
      <section className="question-area" data-fx={fx?.kind}>
        <p className="question-count">
          {isDaily ? `Question ${session.questionNumber} sur 20` : `Question ${session.questionNumber}`}
        </p>
        <h1 className="question-text" key={session.questionNumber} data-fx={fx?.kind}>
          {session.question.text} <span>=</span>
        </h1>
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
            inputMode={isTouch ? 'none' : 'numeric'}
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
      {!isDaily && <p className="game-hint">Une bonne réponse en moins de 3 secondes vaut 150 points.</p>}
      {quitConfirm && (
        <div className="quit-confirm" role="alertdialog" aria-modal="true">
          <p>Quitter la partie ?{isDaily && ' Ta tentative du jour ne sera pas comptée.'}</p>
          <div>
            <button className="button button-primary" onClick={onQuit}>Oui, quitter</button>
            <button className="button button-secondary" onClick={onContinue}>Continuer</button>
          </div>
        </div>
      )}
    </main>
  )
}
