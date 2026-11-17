import { useEffect, useRef, useState } from 'react'
import { AchievementToast } from './components/AchievementToast'
import { evaluate } from './game/achievements'
import { createDailyRun } from './game/daily'
import { getLevel } from './game/levels'
import { configFromLevel, generateQuestion } from './game/questions'
import { dateKey, mulberry32, type RandomSource } from './game/rng'
import { adjustedScore, progressAfterCorrectAnswer, scoreCorrectAnswer } from './game/scoring'
import {
  isDailyPlayed,
  lockDailyChallenge,
  readGameData,
  saveGameRecord,
  unlockAchievements,
  type GameMode,
  type GameRecord,
  type StoredGameData,
} from './game/storage'
import { generateZenQuestion, validateZenConfig, type ZenConfig } from './game/zen'
import { Accueil } from './screens/Accueil'
import { FinDePartie } from './screens/FinDePartie'
import { NiveauxGame } from './screens/NiveauxGame'
import { NiveauxSetup, ZenSetup } from './screens/Setup'
import { Records } from './screens/Records'
import { Succes } from './screens/Succes'
import { ZenGame } from './screens/ZenGame'
import type { GameResult, GameSession } from './screens/types'
import './styles/theme.css'

type Screen = 'home' | 'levels-setup' | 'zen-setup' | 'game' | 'results' | 'records' | 'achievements'
type LastSetup =
  | { mode: 'Niveaux'; startingLevel: number }
  | { mode: 'Chrono libre'; config: ZenConfig }
  | { mode: 'Défi Quotidien' }

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [storedData, setStoredData] = useState<StoredGameData>(() => readGameData())
  const [session, setSession] = useState<GameSession | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [levelUp, setLevelUp] = useState(false)
  const [toast, setToast] = useState<ReturnType<typeof evaluate>>([])
  const [clock, setClock] = useState(Date.now())
  const rngRef = useRef<RandomSource>(Math.random)
  const finalizedRef = useRef(false)
  const timedOutQuestionRef = useRef(-1)
  const wrongCurrentRef = useRef('')
  const lastSetupRef = useRef<LastSetup | null>(null)

  const currentDate = dateKey(new Date())
  const dailyPlayed = isDailyPlayed(currentDate)
  const remainingSeconds = session?.mode === 'Chrono libre' && session.deadline
    ? Math.max(0, (session.deadline - clock) / 1000)
    : session
      ? Math.max(0, session.timeLimitSeconds - (clock - session.questionStartedAt) / 1000)
      : 0

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 100)
    return () => window.clearInterval(interval)
  }, [])

  function finishGame(current: GameSession) {
    if (finalizedRef.current) return
    finalizedRef.current = true
    const date = current.dailyDate ?? dateKey(new Date())
    const adjusted = current.mode === 'Chrono libre'
      ? current.score
      : adjustedScore(current.score, current.startingLevel)
    const accuracyTotal = current.correct + (
      current.mode === 'Chrono libre' ? current.zenWrongAttempts : current.mistakes
    )
    const averageResponseTime = current.responseCount === 0
      ? 0
      : current.totalResponseMs / current.responseCount / 1000
    const accuracy = accuracyTotal === 0
      ? 100
      : Math.round((current.correct / accuracyTotal) * 100)

    const record: GameRecord = {
      mode: current.mode,
      score: current.score,
      adjustedScore: adjusted,
      date,
      accuracy,
      averageResponseTime,
      bestStreak: current.bestStreak,
      startingLevel: current.startingLevel,
      duration: current.duration,
      operations: current.operations,
    }

    const existing = readGameData()
    const previousDailyGames: GameRecord[] = existing.dailyResults
      .filter((daily) => daily.score !== undefined)
      .map((daily) => ({
        mode: 'Défi Quotidien',
        score: daily.score ?? 0,
        date: daily.date,
        accuracy: 0,
        averageResponseTime: 0,
        bestStreak: 0,
      }))
    const knownAchievements = new Set(existing.achievements.map(({ id }) => id))
    const earned = evaluate({
      mode: current.mode,
      finished: true,
      correctAnswers: current.correct,
      lightningAnswers: current.bestLightningStreak > 0 ? 1 : 0,
      bestStreak: current.bestStreak,
      lightningStreak: current.bestLightningStreak,
      highestLevel: current.highestLevel,
      startingLevel: current.startingLevel,
      adjustedScore: adjusted,
      duration: current.duration,
      score: current.score,
      dailyDate: current.mode === 'Défi Quotidien' ? date : undefined,
      dailyDates: existing.dailyResults.map(({ date: playedDate }) => playedDate),
    }, [...existing.history, ...previousDailyGames])
      .filter(({ id }) => !knownAchievements.has(id))

    const saved = saveGameRecord(record)
    const nextData = unlockAchievements(earned.map(({ id }) => id), date)
    setStoredData(nextData)
    setToast(earned)
    setResult({
      mode: current.mode,
      score: current.score,
      adjustedScore: adjusted,
      accuracy,
      averageResponseTime,
      bestStreak: current.bestStreak,
      correct: current.correct,
      mistakes: current.mistakes,
      startingLevel: current.startingLevel,
      highestLevel: current.highestLevel,
      duration: current.duration,
      isNewRecord: saved.isNewRecord,
    })
    setScreen('results')
  }

  function startLevels(startingLevel: number, daily = false) {
    const startedAt = Date.now()
    const dailyRun = daily ? createDailyRun(new Date(startedAt)) : null
    const chosenLevel = dailyRun?.startingLevel ?? startingLevel
    const mode: GameMode = daily ? 'Défi Quotidien' : 'Niveaux'
    const date = dailyRun?.date
    if (daily && date) setStoredData(lockDailyChallenge(date))
    rngRef.current = dailyRun?.rng ?? mulberry32(Math.floor(Math.random() * 0xffffffff))
    const level = getLevel(chosenLevel)
    const nextSession: GameSession = {
      mode,
      startingLevel: chosenLevel,
      level: chosenLevel,
      question: generateQuestion(rngRef.current, configFromLevel(level)),
      questionNumber: 1,
      score: 0,
      lives: 3,
      correct: 0,
      mistakes: 0,
      streak: 0,
      bestStreak: 0,
      lightningStreak: 0,
      bestLightningStreak: 0,
      highestLevel: chosenLevel,
      questionStartedAt: startedAt,
      timeLimitSeconds: level.secondsPerQuestion,
      totalResponseMs: 0,
      responseCount: 0,
      zenWrongAttempts: 0,
      dailyDate: date,
    }
    finalizedRef.current = false
    timedOutQuestionRef.current = -1
    wrongCurrentRef.current = ''
    setSession(nextSession)
    setResult(null)
    setAnswer('')
    setFeedback('')
    setLevelUp(false)
    setToast([])
    lastSetupRef.current = daily ? { mode: 'Défi Quotidien' } : { mode: 'Niveaux', startingLevel }
    setScreen('game')
  }

  function startZen(config: ZenConfig) {
    if (Object.keys(validateZenConfig(config)).length > 0) return
    const startedAt = Date.now()
    rngRef.current = mulberry32(Math.floor(Math.random() * 0xffffffff))
    const nextSession: GameSession = {
      mode: 'Chrono libre',
      startingLevel: 1,
      level: 1,
      question: generateZenQuestion(rngRef.current, config.operations),
      questionNumber: 1,
      score: 0,
      lives: 0,
      correct: 0,
      mistakes: 0,
      streak: 0,
      bestStreak: 0,
      lightningStreak: 0,
      bestLightningStreak: 0,
      highestLevel: 1,
      questionStartedAt: startedAt,
      timeLimitSeconds: config.duration,
      totalResponseMs: 0,
      responseCount: 0,
      deadline: startedAt + config.duration * 1000,
      duration: config.duration,
      operations: config.operations,
      showTimer: config.showTimer,
      showScore: config.showScore,
      zenWrongAttempts: 0,
    }
    finalizedRef.current = false
    timedOutQuestionRef.current = -1
    wrongCurrentRef.current = ''
    setSession(nextSession)
    setResult(null)
    setAnswer('')
    setFeedback('')
    setToast([])
    lastSetupRef.current = { mode: 'Chrono libre', config }
    setScreen('game')
  }

  function handleNiveauxMistake(timedOut = false) {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current) return
    const now = Date.now()
    const elapsed = timedOut
      ? session.timeLimitSeconds * 1000
      : Math.max(0, now - session.questionStartedAt)
    const updated: GameSession = {
      ...session,
      lives: session.lives - 1,
      mistakes: session.mistakes + 1,
      streak: 0,
      lightningStreak: 0,
      questionNumber: session.questionNumber + 1,
      questionStartedAt: now,
      totalResponseMs: session.totalResponseMs + elapsed,
      responseCount: session.responseCount + 1,
    }
    if (updated.lives <= 0) {
      finishGame({ ...updated, lives: 0 })
      return
    }
    updated.question = generateQuestion(rngRef.current, configFromLevel(getLevel(updated.level)))
    setSession(updated)
    setAnswer('')
    setFeedback(timedOut ? 'Temps écoulé · une vie en moins' : 'Ce n’est pas la bonne réponse · une vie en moins')
  }

  function submitNiveauxAnswer() {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current) return
    const elapsed = (Date.now() - session.questionStartedAt) / 1000
    if (elapsed >= session.timeLimitSeconds) {
      handleNiveauxMistake(true)
      return
    }
    if (Number(answer) !== session.question.answer || answer === '') {
      handleNiveauxMistake(false)
      return
    }

    const scored = scoreCorrectAnswer(elapsed)
    const progress = progressAfterCorrectAnswer({
      correctAnswers: session.correct,
      level: session.level,
      leveledUp: false,
    })
    const lightningStreak = scored.label === 'Éclair' ? session.lightningStreak + 1 : 0
    const nextSession: GameSession = {
      ...session,
      question: generateQuestion(rngRef.current, configFromLevel(getLevel(progress.level))),
      questionNumber: session.questionNumber + 1,
      level: progress.level,
      score: session.score + scored.points,
      correct: progress.correctAnswers,
      streak: session.streak + 1,
      bestStreak: Math.max(session.bestStreak, session.streak + 1),
      lightningStreak,
      bestLightningStreak: Math.max(session.bestLightningStreak, lightningStreak),
      highestLevel: Math.max(session.highestLevel, progress.level),
      questionStartedAt: Date.now(),
      totalResponseMs: session.totalResponseMs + elapsed * 1000,
      responseCount: session.responseCount + 1,
    }
    setSession(nextSession)
    setAnswer('')
    setFeedback(scored.label)
    if (progress.leveledUp) {
      setLevelUp(true)
      window.setTimeout(() => setLevelUp(false), 1800)
    }
  }

  function handleZenAnswer(value: string) {
    setAnswer(value)
    if (!session || session.mode !== 'Chrono libre' || finalizedRef.current) return
    const answerLength = String(session.question.answer).length
    if (!value) wrongCurrentRef.current = ''
    if (Number(value) === session.question.answer && value !== '') {
      const now = Date.now()
      const elapsed = Math.max(0, now - session.questionStartedAt)
      setSession({
        ...session,
        question: generateZenQuestion(rngRef.current, session.operations ?? ['+']),
        questionNumber: session.questionNumber + 1,
        score: session.score + 1,
        correct: session.correct + 1,
        streak: session.streak + 1,
        bestStreak: Math.max(session.bestStreak, session.streak + 1),
        questionStartedAt: now,
        totalResponseMs: session.totalResponseMs + elapsed,
        responseCount: session.responseCount + 1,
      })
      setAnswer('')
      wrongCurrentRef.current = ''
      return
    }
    if (value.length < answerLength) wrongCurrentRef.current = ''
    if (value.length === answerLength && value !== String(session.question.answer)) {
      const attempt = `${session.questionNumber}:${value}`
      if (wrongCurrentRef.current !== attempt) {
        wrongCurrentRef.current = attempt
        setSession({ ...session, zenWrongAttempts: session.zenWrongAttempts + 1 })
      }
    }
  }

  useEffect(() => {
    if (screen !== 'game' || !session) return
    if (session.mode === 'Chrono libre') {
      if (session.deadline && clock >= session.deadline) finishGame(session)
      return
    }
    if (clock >= session.questionStartedAt + session.timeLimitSeconds * 1000
      && timedOutQuestionRef.current !== session.questionNumber) {
      timedOutQuestionRef.current = session.questionNumber
      handleNiveauxMistake(true)
    }
  }, [clock, screen, session])

  useEffect(() => {
    if (screen !== 'results' || !result) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key.toLowerCase() !== 'r') return
      if (result.mode === 'Défi Quotidien') return
      event.preventDefault()
      const last = lastSetupRef.current
      if (last?.mode === 'Niveaux') startLevels(last.startingLevel)
      if (last?.mode === 'Chrono libre') startZen(last.config)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, result])

  function returnHome() {
    setScreen('home')
    setSession(null)
    setAnswer('')
    setFeedback('')
    setStoredData(readGameData())
  }

  function onBackspace(zen = false) {
    const next = answer.slice(0, -1)
    if (zen) handleZenAnswer(next)
    else setAnswer(next)
  }

  function onClear(zen = false) {
    if (zen) handleZenAnswer('')
    else setAnswer('')
  }

  return (
    <>
      {screen === 'home' && (
        <Accueil
          data={storedData}
          dailyPlayed={dailyPlayed}
          onLevels={() => setScreen('levels-setup')}
          onZen={() => setScreen('zen-setup')}
          onDaily={() => !dailyPlayed && startLevels(3, true)}
          onRecords={() => setScreen('records')}
          onAchievements={() => setScreen('achievements')}
        />
      )}
      {screen === 'levels-setup' && <NiveauxSetup onStart={(level) => startLevels(level)} onBack={returnHome} />}
      {screen === 'zen-setup' && <ZenSetup onStart={startZen} onBack={returnHome} />}
      {screen === 'game' && session?.mode === 'Chrono libre' && (
        <ZenGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          onAnswerChange={handleZenAnswer}
          onBackspace={() => onBackspace(true)}
          onClear={() => onClear(true)}
          onQuit={returnHome}
        />
      )}
      {screen === 'game' && session && session.mode !== 'Chrono libre' && (
        <NiveauxGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          feedback={feedback}
          levelUp={levelUp}
          onAnswerChange={setAnswer}
          onSubmit={submitNiveauxAnswer}
          onBackspace={() => onBackspace()}
          onClear={() => onClear()}
          onQuit={returnHome}
        />
      )}
      {screen === 'results' && result && (
        <FinDePartie
          result={result}
          onReplay={() => {
            const last = lastSetupRef.current
            if (last?.mode === 'Niveaux') startLevels(last.startingLevel)
            if (last?.mode === 'Chrono libre') startZen(last.config)
          }}
          onHome={returnHome}
        />
      )}
      {screen === 'records' && <Records data={storedData} onBack={returnHome} />}
      {screen === 'achievements' && <Succes data={storedData} onBack={returnHome} />}
      <AchievementToast achievements={toast} onDismiss={() => setToast([])} />
    </>
  )
}

export default App
