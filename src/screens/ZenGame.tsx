import { useEffect, useRef } from 'react'
import { NumericKeypad, useIsTouch } from '../components/NumericKeypad'
import octo from '../assets/octo.webp'
import octoSad from '../assets/octo-sad.webp'
import type { Fx, GameSession } from './types'

interface ZenGameProps {
  session: GameSession
  remainingSeconds: number
  answer: string
  fx: Fx | null
  quitConfirm: boolean
  onAnswerChange: (value: string) => void
  onBackspace: () => void
  onClear: () => void
  onQuit: () => void
  onSkip: () => void
  onRequestQuit: () => void
  onContinue: () => void
}

export function ZenGame({
  session,
  remainingSeconds,
  answer,
  fx,
  quitConfirm,
  onAnswerChange,
  onBackspace,
  onClear,
  onQuit,
  onSkip,
  onRequestQuit,
  onContinue,
}: ZenGameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isTouch = useIsTouch()
  const progress = Math.max(0, Math.min(100, (remainingSeconds / (session.duration ?? 60)) * 100))
  const mood = fx?.kind === 'wrong' || fx?.kind === 'timeout'
    ? 'sad'
    : fx?.kind === 'correct' || fx?.kind === 'levelup'
      ? 'happy'
      : 'idle'

  useEffect(() => {
    inputRef.current?.focus()
  }, [session.questionNumber])

  return (
    <main className="game-page page-shell zen-page">
      {fx && <div className="fx-layer" key={fx.id} data-kind={fx.kind} aria-hidden="true" />}
      <header className="game-header">
        <button className="back-button" onClick={onRequestQuit}>Quitter</button>
        <span className="game-mode-label">Chrono libre</span>
        <strong className="global-timer">{Math.ceil(remainingSeconds)} s</strong>
      </header>
      <div className="question-timer"><div style={{ width: `${progress}%` }} /></div>
      <section className="zen-score-line">
        <span>Score <strong>{session.score}</strong></span>
        <span>{session.operations?.join('  ')}</span>
        <button className="button button-secondary skip-button" onClick={onSkip}>Passer</button>
      </section>
      <img className="game-octo" data-mood={mood} src={mood === 'sad' ? octoSad : octo} alt="" />
      <section className="question-area zen-question-area" data-fx={fx?.kind}>
        <p className="question-count">Question {session.questionNumber}</p>
        <h1 className="question-text" key={session.questionNumber} data-fx={fx?.kind}>
          {session.question.text} <span>=</span>
        </h1>
        <label className="visually-hidden" htmlFor="zen-answer">Votre réponse</label>
        <input
          id="zen-answer"
          ref={inputRef}
          className="zen-answer-input"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value.replace(/\D/g, ''))}
          inputMode={isTouch ? 'none' : 'numeric'}
          autoComplete="off"
          placeholder="?"
        />
        <p className="answer-feedback">La réponse juste ouvre la question suivante.</p>
        <NumericKeypad
          onDigit={(digit) => onAnswerChange(`${answer}${digit}`)}
          onBackspace={onBackspace}
          onClear={onClear}
        />
      </section>
      {quitConfirm && (
        <div className="quit-confirm" role="alertdialog" aria-modal="true">
          <p>Quitter la partie ?</p>
          <div>
            <button className="button button-primary" onClick={onQuit}>Oui, quitter</button>
            <button className="button button-secondary" onClick={onContinue}>Continuer</button>
          </div>
        </div>
      )}
    </main>
  )
}
