import { useEffect, useRef, useState } from 'react'
import { Octo } from '../components/Octo'
import { formatDailyShareText } from '../game/sharing'
import { useLang } from '../i18n/useLang'
import { localeFor, modeLabel } from '../i18n/helpers'
import type { GameResult } from './types'

interface FinDePartieProps {
  result: GameResult
  onReplay: () => void
  onHome: () => void
}

export function FinDePartie({ result, onReplay, onHome }: FinDePartieProps) {
  const { lang, t } = useLang()
  const [copied, setCopied] = useState(false)
  const copiedTimeout = useRef<number | null>(null)
  const averageTime = new Intl.NumberFormat(localeFor(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(result.averageResponseTime)
  const shareText = result.mode === 'Défi Quotidien'
    ? formatDailyShareText(lang, result.date, result.score, result.correct, result.bestStreak)
    : ''

  useEffect(() => () => {
    if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current)
  }, [])

  async function shareDailyResult() {
    try {
      if (navigator.maxTouchPoints > 0 && typeof navigator.share === 'function') {
        await navigator.share({ text: shareText })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      const textarea = document.createElement('textarea')
      textarea.value = shareText
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current)
    copiedTimeout.current = window.setTimeout(() => {
      setCopied(false)
      copiedTimeout.current = null
    }, 2000)
  }

  return (
    <main className="page-shell result-page">
      <button className="back-button" onClick={onHome}>{t.results.backHome}</button>
      <Octo className="result-octo" mood="happy" />
      <p className="eyebrow">{t.results.headline(modeLabel(result.mode, t))}</p>
      <h1>{result.score.toLocaleString(localeFor(lang))}<span className="result-unit"> {t.results.points}</span></h1>
      {result.mode === 'Niveaux' && (
        <p className="adjusted-score">{t.results.adjustedScore} <strong>{result.adjustedScore.toLocaleString(localeFor(lang))}</strong></p>
      )}
      {result.isNewRecord && result.score > 0 && <div className="record-badge">{t.results.newRecord}</div>}
      <section className="result-stats">
        <div><span>{t.results.accuracy}</span><strong>{result.accuracy}%</strong></div>
        <div><span>{t.results.averageTime}</span><strong>{averageTime} {t.records.secondsUnit}</strong></div>
        <div><span>{t.results.bestStreak}</span><strong>{result.bestStreak}</strong></div>
        <div><span>{t.results.correctAnswers}</span><strong>{result.correct}</strong></div>
        {result.mode === 'Chrono libre' && <div><span>{t.results.skipped}</span><strong>{result.skipped}</strong></div>}
      </section>
      {result.missed.length > 0 && (
        <section className="result-review">
          <h2>{t.results.toReview}</h2>
          <ul className="review-list">
            {result.missed.slice(0, 8).map((missed, index) => (
              <li key={`${missed.text}-${index}`}>
                <span className="review-equation">{missed.text} = <strong>{missed.answer}</strong></span>
                <small className="review-note">
                  {missed.reason === 'wrong'
                    ? t.results.reviewWrong(missed.given ?? '')
                    : missed.reason === 'timeout'
                      ? t.results.reviewTimeout
                      : t.results.reviewSkipped}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="result-actions">
        {result.mode !== 'Défi Quotidien' && <button className="button button-primary" onClick={onReplay}>{t.results.replay}</button>}
        {result.mode === 'Défi Quotidien' && (
          <button className="button button-primary" onClick={shareDailyResult}>
            {copied ? t.results.copied : t.results.share}
          </button>
        )}
        <button className="button button-secondary" onClick={onHome}>{t.results.home}</button>
      </div>
      {result.mode === 'Défi Quotidien' && <p className="daily-note">{t.results.dailyNote}</p>}
      {result.mode !== 'Défi Quotidien' && <p className="keyboard-hint">{t.results.keyboardReplay}</p>}
    </main>
  )
}
