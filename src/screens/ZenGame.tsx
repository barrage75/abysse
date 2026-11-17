import { useEffect, useRef } from 'react'
import { NumericKeypad } from '../components/NumericKeypad'
import type { GameSession } from './types'

interface ZenGameProps {
  session: GameSession
  remainingSeconds: number
  answer: string
  onAnswerChange: (value: string) => void
  onBackspace: () => void
  onClear: () => void
  onQuit: () => void
}

export function ZenGame({ session, remainingSeconds, answer, onAnswerChange, onBackspace, onClear, onQuit }: ZenGameProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const progress = Math.max(0, Math.min(100, (remainingSeconds / (session.duration ?? 60)) * 100))

  useEffect(() => {
    inputRef.current?.focus()
  }, [session.questionNumber])

  return (
    <main className="game-page page-shell zen-page">
      <header className="game-header">
        <button className="back-button" onClick={onQuit}>Quitter</button>
        <span className="game-mode-label">Chrono libre</span>
        {session.showTimer
          ? <strong className="global-timer">{Math.ceil(remainingSeconds)} s</strong>
          : <span className="global-timer" aria-label="Chronomètre masqué" />}
      </header>
      {session.showTimer && <div className="question-timer"><div style={{ width: `${progress}%` }} /></div>}
      <section className="zen-score-line">
        {session.showScore && <span>Score <strong>{session.score}</strong></span>}
        <span>{session.operations?.join('  ')}</span>
      </section>
      <section className="question-area zen-question-area">
        <p className="question-count">Question {session.questionNumber}</p>
        <h1 className="question-text">{session.question.text} <span>=</span></h1>
        <label className="visually-hidden" htmlFor="zen-answer">Votre réponse</label>
        <input
          id="zen-answer"
          ref={inputRef}
          className="zen-answer-input"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
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
    </main>
  )
}
