import { useEffect, useRef } from 'react'
import { NumericKeypad, useIsTouch } from '../components/NumericKeypad'
import octo from '../assets/octo.webp'
import octoSad from '../assets/octo-sad.webp'
import { useLang } from '../i18n/useLang'
import { levelName, localeFor, modeLabel } from '../i18n/helpers'
import type { Fx, GameSession } from './types'

interface NiveauxGameProps {
  session: GameSession
  remainingSeconds: number
  answer: string
  feedback: string
  bestAdjustedScore: number
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
  bestAdjustedScore,
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
  const { lang, t } = useLang()
  const inputRef = useRef<HTMLInputElement>(null)
  const isTouch = useIsTouch()
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
        <button className="back-button" onClick={onRequestQuit}>{t.game.quit}</button>
        <span className="game-mode-label">{modeLabel(session.mode, t)}</span>
        <div className="lives" aria-label={t.game.lives(session.lives)}>
          {Array.from({ length: 3 }, (_, index) => <span key={index} className={index < session.lives ? 'life is-live' : 'life'}>●</span>)}
        </div>
      </header>

      {levelUp && !isDaily && <div className="level-up-banner" role="status">{t.game.levelUp(levelName(session.level, t))}</div>}
      <section className="game-meta">
        <div><span>{t.game.levelNumber(session.level)}</span><strong>{levelName(session.level, t)}</strong></div>
        <div>
          <span>{t.game.score}</span><strong>{session.score.toLocaleString(localeFor(lang))}</strong>
          {!isDaily && bestAdjustedScore > 0 && (
            <small className="best-adjusted-score">{t.game.adjustedBest(bestAdjustedScore.toLocaleString(localeFor(lang)))}</small>
          )}
        </div>
        <div><span>{t.game.streak}</span><strong>{session.streak}</strong></div>
      </section>
      <div className="question-timer" aria-label={t.game.secondsRemaining(Math.ceil(remainingSeconds))}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <img className="game-octo" data-mood={mood} src={mood === 'sad' ? octoSad : octo} alt="" />
      <section className="question-area" data-fx={fx?.kind}>
        <p className="question-count">{isDaily
          ? t.game.dailyQuestion(session.questionNumber, 20)
          : t.game.question(session.questionNumber)}</p>
        {session.streak >= 3 && (
          <span className="combo-badge" key={session.streak}>{t.game.combo} ×{session.streak}</span>
        )}
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
          <label className="visually-hidden" htmlFor="answer">{t.game.answerLabel}</label>
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
          <button className="button button-primary" type="submit">{t.game.submit}</button>
        </form>
        <p id="answer-feedback" className="answer-feedback" aria-live="polite">{feedback || t.game.enterHint}</p>
        <NumericKeypad
          onDigit={(digit) => onAnswerChange(`${answer}${digit}`)}
          onBackspace={onBackspace}
          onClear={onClear}
        />
      </section>
      {!isDaily && <p className="game-hint">{t.game.pointsSpeed}</p>}
      {quitConfirm && (
        <div className="quit-confirm" role="alertdialog" aria-modal="true">
          <p>{t.game.quitQuestion}{isDaily ? t.game.dailyQuitNote : ''}</p>
          <div>
            <button className="button button-primary" onClick={onQuit}>{t.game.confirmQuit}</button>
            <button className="button button-secondary" onClick={onContinue}>{t.game.continue}</button>
          </div>
        </div>
      )}
    </main>
  )
}
