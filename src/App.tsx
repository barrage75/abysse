import { useCallback, useEffect, useRef, useState } from 'react'
import { AchievementToast } from './components/AchievementToast'
import { evaluate } from './game/achievements'
import { DAILY_QUESTION_COUNT, dailyQuestion } from './game/daily'
import { getLevel } from './game/levels'
import { configFromLevel, generateQuestion } from './game/questions'
import { dateKey, mulberry32, type RandomSource } from './game/rng'
import { adjustedScore, progressAfterCorrectAnswer, scoreCorrectAnswer } from './game/scoring'
import {
  isDailyPlayed,
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
import { Records } from './screens/Records'
import { Succes } from './screens/Succes'
import { ZenGame } from './screens/ZenGame'
import { DailySetup, NiveauxSetup, ZenSetup } from './screens/Setup'
import type { Fx, FxKind, GameResult, GameSession } from './screens/types'
import './styles/theme.css'

type Screen = 'home' | 'levels-setup' | 'daily-setup' | 'zen-setup' | 'game' | 'results' | 'records' | 'achievements'
type LastSetup =
  | { mode: 'Niveaux'; startingLevel: number }
  | { mode: 'Chrono libre'; config: ZenConfig }
  | { mode: 'Défi Quotidien' }

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [storedData, setStoredData] = useState<StoredGameData>(() => readGameData())
  const [session, setSession] = useState<GameSession | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [levelUp, setLevelUp] = useState(false)
  const [toast, setToast] = useState<ReturnType<typeof evaluate>>([])
  const [fx, setFx] = useState<Fx | null>(null)
  const [quitConfirm, setQuitConfirm] = useState(false)
  const [replayHotkeyReady, setReplayHotkeyReady] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const [dailySetupDate, setDailySetupDate] = useState<Date | null>(null)
  const dismissToast = useCallback(() => setToast([]), [])
  const rngRef = useRef<RandomSource>(Math.random)
  const finalizedRef = useRef(false)
  const timedOutQuestionRef = useRef(-1)
  const wrongCurrentRef = useRef('')
  const wrongClearTimeoutRef = useRef<number | null>(null)
  const fxIdRef = useRef(0)
  const lastSetupRef = useRef<LastSetup | null>(null)

  const currentDate = dateKey(new Date())
  const dailyPlayed = isDailyPlayed(currentDate)
  const todayDailyScore = storedData.dailyResults.find((daily) => daily.date === currentDate)?.score
  const remainingSeconds = session?.mode === 'Chrono libre' && session.deadline
    ? Math.max(0, (session.deadline - clock) / 1000)
    : session
      ? Math.max(0, session.timeLimitSeconds - (clock - session.questionStartedAt) / 1000)
      : 0

  useEffect(() => {
    if (screen !== 'game') return
    const interval = window.setInterval(() => setClock(Date.now()), 100)
    return () => window.clearInterval(interval)
  }, [screen])

  useEffect(() => {
    if (!fx) return
    const timeout = window.setTimeout(() => {
      setFx((current) => current?.id === fx.id ? null : current)
    }, 900)
    return () => window.clearTimeout(timeout)
  }, [fx])

  const triggerFx = useCallback((kind: FxKind) => {
    fxIdRef.current += 1
    setFx({ kind, id: fxIdRef.current })
  }, [])

  const clearWrongClearTimeout = useCallback(() => {
    if (wrongClearTimeoutRef.current !== null) {
      window.clearTimeout(wrongClearTimeoutRef.current)
      wrongClearTimeoutRef.current = null
    }
  }, [])

  const finishGame = useCallback((current: GameSession) => {
    if (finalizedRef.current) return
    finalizedRef.current = true
    const date = current.dailyDate ?? dateKey(new Date())
    const adjusted = current.mode === 'Niveaux'
      ? adjustedScore(current.score, current.startingLevel)
      : current.score
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
      dailyDates: existing.dailyResults
        .filter(({ score }) => score !== undefined)
        .map(({ date: playedDate }) => playedDate),
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
      skipped: current.skipped,
    })
    setScreen('results')
  }, [])

  const startLevels = useCallback((startingLevel: number, daily = false) => {
    const startedAt = Date.now()
    const dailyDate = daily ? dateKey(new Date(startedAt)) : undefined
    const firstDailyQuestion = daily ? dailyQuestion(new Date(startedAt), 0) : undefined
    const chosenLevel = firstDailyQuestion?.levelId ?? startingLevel
    const mode: GameMode = daily ? 'Défi Quotidien' : 'Niveaux'
    rngRef.current = mulberry32(Math.floor(Math.random() * 0xffffffff))
    const level = getLevel(chosenLevel)
    const nextSession: GameSession = {
      mode,
      startingLevel: chosenLevel,
      level: chosenLevel,
      question: firstDailyQuestion?.question ?? generateQuestion(rngRef.current, configFromLevel(level)),
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
      dailyDate,
      skipped: 0,
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
    setFx(null)
    setQuitConfirm(false)
    setReplayHotkeyReady(false)
    clearWrongClearTimeout()
    lastSetupRef.current = daily ? { mode: 'Défi Quotidien' } : { mode: 'Niveaux', startingLevel }
    setScreen('game')
  }, [clearWrongClearTimeout])

  const startZen = useCallback((config: ZenConfig) => {
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
      zenWrongAttempts: 0,
      skipped: 0,
    }
    finalizedRef.current = false
    timedOutQuestionRef.current = -1
    wrongCurrentRef.current = ''
    setSession(nextSession)
    setResult(null)
    setAnswer('')
    setFeedback('')
    setToast([])
    setFx(null)
    setQuitConfirm(false)
    setReplayHotkeyReady(false)
    clearWrongClearTimeout()
    lastSetupRef.current = { mode: 'Chrono libre', config }
    setScreen('game')
  }, [clearWrongClearTimeout])

  const handleNiveauxMistake = useCallback((timedOut = false) => {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current) return
    clearWrongClearTimeout()
    const now = Date.now()
    const elapsed = timedOut
      ? session.timeLimitSeconds * 1000
      : Math.max(0, now - session.questionStartedAt)
    const question = session.question
    const updated: GameSession = {
      ...session,
      lives: session.lives - 1,
      mistakes: session.mistakes + 1,
      streak: 0,
      lightningStreak: 0,
      questionNumber: session.mode === 'Défi Quotidien' && session.questionNumber >= DAILY_QUESTION_COUNT
        ? session.questionNumber
        : session.questionNumber + 1,
      questionStartedAt: now,
      totalResponseMs: session.totalResponseMs + elapsed,
      responseCount: session.responseCount + 1,
    }
    const dailyFinished = session.mode === 'Défi Quotidien'
      && session.questionNumber >= DAILY_QUESTION_COUNT
    if (updated.lives <= 0 || dailyFinished) {
      triggerFx(timedOut ? 'timeout' : 'wrong')
      finishGame(updated)
      return
    }
    if (session.mode === 'Défi Quotidien') {
      const next = dailyQuestion(dateFromKey(session.dailyDate ?? dateKey(new Date())), session.questionNumber)
      updated.question = next.question
      updated.level = next.levelId
      updated.highestLevel = Math.max(updated.highestLevel, next.levelId)
      updated.timeLimitSeconds = getLevel(next.levelId).secondsPerQuestion
    } else {
      updated.question = generateQuestion(rngRef.current, configFromLevel(getLevel(updated.level)))
    }
    setSession(updated)
    setAnswer('')
    setFeedback(`${timedOut ? 'Temps écoulé' : 'Raté'} ! ${question.text} = ${question.answer}`)
    triggerFx(timedOut ? 'timeout' : 'wrong')
  }, [session, clearWrongClearTimeout, triggerFx, finishGame])

  function submitNiveauxAnswer() {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current) return
    if (answer === '') return
    const elapsed = (Date.now() - session.questionStartedAt) / 1000
    if (elapsed >= session.timeLimitSeconds) {
      handleNiveauxMistake(true)
      return
    }
    if (Number(answer) !== session.question.answer) {
      handleNiveauxMistake(false)
      return
    }

    const scored = scoreCorrectAnswer(elapsed)
    const progress = progressAfterCorrectAnswer({
      correctAnswers: session.correct,
      level: session.level,
      leveledUp: false,
    })
    const isDaily = session.mode === 'Défi Quotidien'
    const dailyFinished = isDaily && session.questionNumber >= DAILY_QUESTION_COUNT
    const scheduled = isDaily && !dailyFinished
      ? dailyQuestion(dateFromKey(session.dailyDate ?? dateKey(new Date())), session.questionNumber)
      : undefined
    const nextLevel = scheduled?.levelId ?? progress.level
    const lightningStreak = scored.label === 'Éclair' ? session.lightningStreak + 1 : 0
    const nextSession: GameSession = {
      ...session,
      question: scheduled?.question ?? (dailyFinished
        ? session.question
        : generateQuestion(rngRef.current, configFromLevel(getLevel(nextLevel)))),
      questionNumber: dailyFinished ? session.questionNumber : session.questionNumber + 1,
      level: nextLevel,
      score: session.score + scored.points,
      correct: progress.correctAnswers,
      streak: session.streak + 1,
      bestStreak: Math.max(session.bestStreak, session.streak + 1),
      lightningStreak,
      bestLightningStreak: Math.max(session.bestLightningStreak, lightningStreak),
      highestLevel: Math.max(session.highestLevel, nextLevel),
      questionStartedAt: Date.now(),
      timeLimitSeconds: getLevel(nextLevel).secondsPerQuestion,
      totalResponseMs: session.totalResponseMs + elapsed * 1000,
      responseCount: session.responseCount + 1,
    }
    triggerFx('correct')
    if (dailyFinished) {
      finishGame(nextSession)
      return
    }
    setSession(nextSession)
    setAnswer('')
    setFeedback(scored.label)
    if (progress.leveledUp && !isDaily) {
      setLevelUp(true)
      triggerFx('levelup')
      window.setTimeout(() => setLevelUp(false), 1800)
    }
  }

  function handleZenAnswer(value: string) {
    setAnswer(value)
    if (!session || session.mode !== 'Chrono libre' || finalizedRef.current) return
    const answerLength = String(session.question.answer).length
    if (!value) wrongCurrentRef.current = ''
    if (Number(value) === session.question.answer && value !== '') {
      clearWrongClearTimeout()
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
      triggerFx('correct')
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
        triggerFx('wrong')
        clearWrongClearTimeout()
        wrongClearTimeoutRef.current = window.setTimeout(() => {
          wrongClearTimeoutRef.current = null
          setAnswer('')
          wrongCurrentRef.current = ''
        }, 350)
      }
    }
  }

  const handleZenSkip = useCallback(() => {
    if (!session || session.mode !== 'Chrono libre' || finalizedRef.current) return
    if (session.deadline && Date.now() >= session.deadline) {
      finishGame(session)
      return
    }
    clearWrongClearTimeout()
    wrongCurrentRef.current = ''
    setAnswer('')
    setSession({
      ...session,
      question: generateZenQuestion(rngRef.current, session.operations ?? ['+']),
      questionNumber: session.questionNumber + 1,
      skipped: session.skipped + 1,
      streak: 0,
      questionStartedAt: Date.now(),
    })
    triggerFx('skip')
  }, [session, finishGame, clearWrongClearTimeout, triggerFx])

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
  }, [clock, screen, session, finishGame, handleNiveauxMistake])

  useEffect(() => {
    if (screen !== 'results' || !result) return
    const readyTimeout = window.setTimeout(() => setReplayHotkeyReady(true), 1000)
    return () => window.clearTimeout(readyTimeout)
  }, [screen, result])

  useEffect(() => {
    if (screen !== 'game') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setQuitConfirm((current) => !current)
        return
      }
      if (session?.mode === 'Chrono libre' && !quitConfirm && event.code === 'Space') {
        event.preventDefault()
        if (!event.repeat) handleZenSkip()
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, session, quitConfirm, handleZenSkip])

  useEffect(() => {
    const timeoutId = wrongClearTimeoutRef.current
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        if (wrongClearTimeoutRef.current === timeoutId) wrongClearTimeoutRef.current = null
      }
    }
  }, [screen, session?.questionNumber])

  useEffect(() => {
    if (screen !== 'results' || !result) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key.toLowerCase() !== 'r') return
      if (result.mode === 'Défi Quotidien') return
      event.preventDefault()
      if (!replayHotkeyReady) return
      const last = lastSetupRef.current
      if (last?.mode === 'Niveaux') startLevels(last.startingLevel)
      if (last?.mode === 'Chrono libre') startZen(last.config)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, result, replayHotkeyReady, startLevels, startZen])

  function returnHome() {
    setScreen('home')
    setSession(null)
    setAnswer('')
    setFeedback('')
    setQuitConfirm(false)
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
          dailyScore={todayDailyScore}
          onLevels={() => setScreen('levels-setup')}
          onZen={() => setScreen('zen-setup')}
          onDaily={() => {
            if (dailyPlayed) return
            setDailySetupDate(new Date())
            setScreen('daily-setup')
          }}
          onRecords={() => setScreen('records')}
          onAchievements={() => setScreen('achievements')}
        />
      )}
      {screen === 'levels-setup' && <NiveauxSetup onStart={(level) => startLevels(level)} onBack={returnHome} />}
      {screen === 'daily-setup' && (
        <DailySetup
          date={dailySetupDate!}
          onStart={() => startLevels(2, true)}
          onBack={returnHome}
        />
      )}
      {screen === 'zen-setup' && <ZenSetup onStart={startZen} onBack={returnHome} />}
      {screen === 'game' && session?.mode === 'Chrono libre' && (
        <ZenGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          fx={fx}
          quitConfirm={quitConfirm}
          onAnswerChange={handleZenAnswer}
          onBackspace={() => onBackspace(true)}
          onClear={() => onClear(true)}
          onQuit={returnHome}
          onSkip={handleZenSkip}
          onRequestQuit={() => setQuitConfirm(true)}
          onContinue={() => setQuitConfirm(false)}
        />
      )}
      {screen === 'game' && session && session.mode !== 'Chrono libre' && (
        <NiveauxGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          feedback={feedback}
          levelUp={levelUp}
          fx={fx}
          quitConfirm={quitConfirm}
          onAnswerChange={setAnswer}
          onSubmit={submitNiveauxAnswer}
          onBackspace={() => onBackspace()}
          onClear={() => onClear()}
          onQuit={returnHome}
          onRequestQuit={() => setQuitConfirm(true)}
          onContinue={() => setQuitConfirm(false)}
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
      <AchievementToast achievements={toast} onDismiss={dismissToast} />
    </>
  )
}

export default App
