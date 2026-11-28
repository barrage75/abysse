import { useCallback, useEffect, useRef, useState } from 'react'
import { AchievementToast } from './components/AchievementToast'
import { TopControls } from './components/TopControls'
import { evaluate } from './game/achievements'
import { DAILY_QUESTION_COUNT, dailyQuestion, refreshDateKey } from './game/daily'
import { isInteractiveTarget } from './game/keyboard'
import { appendLog, roundLogSeconds, timeAttackCorrectEntry, timeAttackExpiryEntry, timeAttackSkipEntry } from './game/log'
import { getLevel } from './game/levels'
import { configFromLevel, nextLevelQuestion } from './game/questions'
import { recordMissed, resolveSkipped } from './game/review'
import { dateKey, mulberry32, type RandomSource } from './game/rng'
import { adjustedScore, progressAfterCorrectAnswer, scoreCorrectAnswer } from './game/scoring'
import { readMotionEnabled, setMotionEnabled } from './game/motion'
import { playSound, primeSound, readSoundEnabled, setSoundEnabled } from './game/sound'
import {
  isDailyPlayed,
  bestNiveauxScore,
  readGameData,
  saveGameRecord,
  unlockAchievements,
  type GameMode,
  type GameRecord,
  type StoredGameData,
} from './game/storage'
import {
  applyZenSkip,
  nextZenQuestion,
  updateZenWrongAttemptCycle,
  validateZenConfig,
  zenComboKey,
  zenAttemptStatus,
  type ZenConfig,
} from './game/zen'
import { useLang } from './i18n/useLang'
import { Accueil } from './screens/Accueil'
import { FinDePartie } from './screens/FinDePartie'
import { NiveauxGame } from './screens/NiveauxGame'
import { Records } from './screens/Records'
import { Succes } from './screens/Succes'
import { ZenGame } from './screens/ZenGame'
import { DailySetup, NiveauxSetup, ZenSetup } from './screens/Setup'
import { Countdown } from './screens/Countdown'
import type { Fx, FxKind, GameResult, GameSession } from './screens/types'
import './styles/theme.css'

type Screen = 'home' | 'levels-setup' | 'daily-setup' | 'zen-setup' | 'countdown' | 'game' | 'results' | 'records' | 'achievements'
type LastSetup =
  | { mode: 'Niveaux'; startingLevel: number }
  | { mode: 'Chrono libre'; config: ZenConfig }
  | { mode: 'Défi Quotidien' }

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function App() {
  const { t } = useLang()
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
  const [soundOn, setSoundOn] = useState(readSoundEnabled)
  const [motionOn, setMotionOn] = useState(readMotionEnabled)
  const [countdownValue, setCountdownValue] = useState<number | 'dive' | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const [currentDate, setCurrentDate] = useState(() => dateKey(new Date()))
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [countdownReturnScreen, setCountdownReturnScreen] = useState<Screen>('home')
  const dismissToast = useCallback(() => setToast([]), [])
  const rngRef = useRef<RandomSource>(Math.random)
  const finalizedRef = useRef(false)
  const timedOutQuestionRef = useRef(-1)
  const wrongCurrentRef = useRef('')
  const wrongClearTimeoutRef = useRef<number | null>(null)
  const fxIdRef = useRef(0)
  const hiddenAtRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  const levelUpTimeoutRef = useRef<number | null>(null)
  const lastSetupRef = useRef<LastSetup | null>(null)
  const pendingGameRef = useRef<LastSetup | null>(null)

  const dailyPlayed = isDailyPlayed(currentDate)
  const todayDailyScore = storedData.dailyResults.find((daily) => daily.date === currentDate)?.score
  const bestAdjustedNiveauxScore = bestNiveauxScore(storedData)
  const bestZenScore = session?.mode === 'Chrono libre' && session.duration
    ? storedData.bestScores[`Chrono libre:${zenComboKey({
      duration: session.duration,
      operations: session.operations ?? [],
    })}`]?.score ?? 0
    : 0
  const displayedClock = pausedAt ?? clock
  const remainingSeconds = session?.mode === 'Chrono libre' && session.deadline
    ? Math.max(0, (session.deadline - displayedClock) / 1000)
    : session
      ? Math.max(0, session.timeLimitSeconds - (displayedClock - session.questionStartedAt) / 1000)
      : 0

  const clearLevelUpTimeout = useCallback(() => {
    if (levelUpTimeoutRef.current !== null) {
      window.clearTimeout(levelUpTimeoutRef.current)
      levelUpTimeoutRef.current = null
    }
  }, [])

  const openQuitConfirm = useCallback(() => {
    if (pausedAtRef.current !== null) return
    const now = Date.now()
    pausedAtRef.current = now
    setPausedAt(now)
    setQuitConfirm(true)
  }, [])

  const closeQuitConfirm = useCallback(() => {
    const pausedAt = pausedAtRef.current
    if (pausedAt === null) {
      setQuitConfirm(false)
      return
    }
    const resumedAt = Date.now()
    const pausedDuration = resumedAt - pausedAt
    pausedAtRef.current = null
    setPausedAt(null)
    setSession((current) => current ? {
      ...current,
      questionStartedAt: current.questionStartedAt + pausedDuration,
      deadline: current.mode === 'Chrono libre' && current.deadline
        ? current.deadline + pausedDuration
        : current.deadline,
    } : current)
    setQuitConfirm(false)
    setClock(resumedAt)
  }, [])

  useEffect(() => () => clearLevelUpTimeout(), [clearLevelUpTimeout])

  useEffect(() => {
    let timeout: number | undefined
    const refreshDate = () => {
      const now = new Date()
      setCurrentDate((current) => refreshDateKey(current, now))
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
      timeout = window.setTimeout(refreshDate, Math.max(1, nextMidnight - now.getTime() + 50))
    }
    const onVisibilityChange = () => {
      if (!document.hidden) {
        setCurrentDate((current) => refreshDateKey(current, new Date()))
      }
    }
    refreshDate()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (screen !== 'game') return
    const interval = window.setInterval(() => {
      if (!document.hidden && pausedAtRef.current === null) setClock(Date.now())
    }, 100)
    return () => window.clearInterval(interval)
  }, [screen, quitConfirm])

  useEffect(() => {
    if (screen !== 'game' || session?.mode === 'Chrono libre') {
      hiddenAtRef.current = null
      return
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (pausedAtRef.current !== null) return
        if (hiddenAtRef.current === null) hiddenAtRef.current = Date.now()
        return
      }
      if (hiddenAtRef.current === null) return
      const hiddenDuration = Date.now() - hiddenAtRef.current
      hiddenAtRef.current = null
      if (pausedAtRef.current !== null) return
      setSession((current) => {
        if (!current || current.mode === 'Chrono libre') return current
        return { ...current, questionStartedAt: current.questionStartedAt + hiddenDuration }
      })
      setClock(Date.now())
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      hiddenAtRef.current = null
    }
  }, [screen, session?.mode])

  useEffect(() => {
    if (!fx) return
    const timeout = window.setTimeout(() => {
      setFx((current) => current?.id === fx.id ? null : current)
    }, 900)
    return () => window.clearTimeout(timeout)
  }, [fx])

  const triggerFx = useCallback((kind: FxKind, points?: number) => {
    fxIdRef.current += 1
    setFx({ kind, id: fxIdRef.current, points })
    playSound(kind)
  }, [])

  const clearWrongClearTimeout = useCallback(() => {
    if (wrongClearTimeoutRef.current !== null) {
      window.clearTimeout(wrongClearTimeoutRef.current)
      wrongClearTimeoutRef.current = null
    }
  }, [])

  const finishGame = useCallback((game: GameSession, logCurrentQuestion = true) => {
    if (finalizedRef.current) return
    finalizedRef.current = true
    const current = game.mode === 'Chrono libre' && logCurrentQuestion
      ? { ...game, log: appendLog(game.log, timeAttackExpiryEntry(game.question, game.zenLastWrongAttempt)) }
      : game
    playSound('end')
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
      log: current.log,
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
      date,
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
      log: current.log,
      missed: current.missed,
    })
    setScreen('results')
  }, [])

  const launchLevels = useCallback((startingLevel: number, daily = false) => {
    const startedAt = Date.now()
    setClock(startedAt)
    const dailyDate = daily ? dateKey(new Date(startedAt)) : undefined
    const firstDailyQuestion = daily ? dailyQuestion(new Date(startedAt), 0) : undefined
    const chosenLevel = firstDailyQuestion?.levelId ?? startingLevel
    const mode: GameMode = daily ? 'Défi Quotidien' : 'Niveaux'
    rngRef.current = mulberry32(Math.floor(Math.random() * 0xffffffff))
    const level = getLevel(chosenLevel)
    const firstQuestion = firstDailyQuestion?.question
      ?? nextLevelQuestion(rngRef.current, configFromLevel(level), [])
    const nextSession: GameSession = {
      mode,
      startingLevel: chosenLevel,
      level: chosenLevel,
      question: firstQuestion,
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
      zenWrongAttemptsOnQuestion: 0,
      zenRecent: [],
      zenRequeue: [],
      recentQuestions: mode === 'Niveaux' ? [firstQuestion.text] : [],
      log: [],
      missed: [],
      dailyDate,
      skipped: 0,
    }
    finalizedRef.current = false
    timedOutQuestionRef.current = -1
    wrongCurrentRef.current = ''
    pausedAtRef.current = null
    setPausedAt(null)
    clearLevelUpTimeout()
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
  }, [clearWrongClearTimeout, clearLevelUpTimeout])

  const launchZen = useCallback((config: ZenConfig) => {
    if (Object.keys(validateZenConfig(config)).length > 0) return
    const startedAt = Date.now()
    setClock(startedAt)
    rngRef.current = mulberry32(Math.floor(Math.random() * 0xffffffff))
    const firstQuestion = nextZenQuestion(rngRef.current, config.operations, {
      questionNumber: 0,
      recent: [],
      requeue: [],
    })
    const nextSession: GameSession = {
      mode: 'Chrono libre',
      startingLevel: 1,
      level: 1,
      question: firstQuestion.question,
      questionNumber: firstQuestion.questionNumber,
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
      zenWrongAttemptsOnQuestion: 0,
      zenRecent: firstQuestion.recent,
      zenRequeue: firstQuestion.requeue,
      recentQuestions: [],
      log: [],
      missed: [],
      skipped: 0,
    }
    finalizedRef.current = false
    timedOutQuestionRef.current = -1
    wrongCurrentRef.current = ''
    pausedAtRef.current = null
    setPausedAt(null)
    clearLevelUpTimeout()
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
    lastSetupRef.current = { mode: 'Chrono libre', config }
    setScreen('game')
  }, [clearWrongClearTimeout, clearLevelUpTimeout])

  const beginCountdown = useCallback((pending: LastSetup, returnScreen: Screen) => {
    pendingGameRef.current = pending
    setCountdownReturnScreen(returnScreen)
    primeSound()
    playSound('tick')
    setCountdownValue(3)
    setScreen('countdown')
  }, [])

  const startLevels = useCallback((startingLevel: number, daily = false) => {
    beginCountdown(
      daily ? { mode: 'Défi Quotidien' } : { mode: 'Niveaux', startingLevel },
      daily ? 'daily-setup' : 'levels-setup',
    )
  }, [beginCountdown])

  const startZen = useCallback((config: ZenConfig) => {
    if (Object.keys(validateZenConfig(config)).length > 0) return
    beginCountdown({ mode: 'Chrono libre', config }, 'zen-setup')
  }, [beginCountdown])

  const cancelCountdown = useCallback(() => {
    pendingGameRef.current = null
    setCountdownValue(null)
    setScreen(countdownReturnScreen)
  }, [countdownReturnScreen])

  useEffect(() => {
    if (countdownValue === null) return
    const timeout = window.setTimeout(() => {
      if (typeof countdownValue === 'number') {
        if (countdownValue > 1) {
          setCountdownValue(countdownValue - 1)
          playSound('tick')
        } else {
          setCountdownValue('dive')
          playSound('go')
        }
        return
      }

      const pending = pendingGameRef.current
      pendingGameRef.current = null
      setCountdownValue(null)
      if (pending?.mode === 'Niveaux') launchLevels(pending.startingLevel)
      else if (pending?.mode === 'Défi Quotidien') launchLevels(2, true)
      else if (pending?.mode === 'Chrono libre') launchZen(pending.config)
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [countdownValue, launchLevels, launchZen])

  const handleNiveauxMistake = useCallback((timedOut = false) => {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current || pausedAtRef.current !== null) return
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
      log: appendLog(session.log, {
        text: question.text,
        answer: question.answer,
        result: timedOut ? 'timeout' : 'wrong',
        ...(!timedOut ? { given: answer } : {}),
      }),
      missed: [...session.missed, {
        text: question.text,
        answer: question.answer,
        ...(!timedOut ? { given: answer } : {}),
        reason: timedOut ? 'timeout' : 'wrong',
      }],
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
      updated.question = nextLevelQuestion(
        rngRef.current,
        configFromLevel(getLevel(updated.level)),
        session.recentQuestions,
      )
      updated.recentQuestions = [...session.recentQuestions, updated.question.text].slice(-5)
    }
    setSession(updated)
    setAnswer('')
    setFeedback(timedOut
      ? t.game.timeout(question.text, question.answer)
      : t.game.wrong(question.text, question.answer))
    triggerFx(timedOut ? 'timeout' : 'wrong')
  }, [session, answer, clearWrongClearTimeout, triggerFx, finishGame, t])

  function submitNiveauxAnswer() {
    if (!session || session.mode === 'Chrono libre' || finalizedRef.current
      || quitConfirm || pausedAtRef.current !== null) return
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
    const nextQuestion = scheduled?.question ?? (dailyFinished
      ? session.question
      : nextLevelQuestion(rngRef.current, configFromLevel(getLevel(nextLevel)), session.recentQuestions))
    const nextSession: GameSession = {
      ...session,
      question: nextQuestion,
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
      log: appendLog(session.log, {
        text: session.question.text,
        answer: session.question.answer,
        result: 'correct',
        given: answer,
        seconds: roundLogSeconds(elapsed),
      }),
      recentQuestions: !isDaily && !dailyFinished
        ? [...session.recentQuestions, nextQuestion.text].slice(-5)
        : session.recentQuestions,
    }
    if (dailyFinished) {
      triggerFx('correct', scored.points)
      finishGame(nextSession)
      return
    }
    setSession(nextSession)
    setAnswer('')
    setFeedback(scored.label === 'Éclair'
      ? t.game.lightning
      : scored.label === 'Rapide'
        ? t.game.fast
        : t.game.normal)
    triggerFx('correct', scored.points)
    if (progress.leveledUp && !isDaily) {
      clearLevelUpTimeout()
      setLevelUp(true)
      triggerFx('levelup', scored.points)
      levelUpTimeoutRef.current = window.setTimeout(() => {
        levelUpTimeoutRef.current = null
        setLevelUp(false)
      }, 1800)
    }
  }

  function handleZenAnswer(value: string) {
    if (quitConfirm || pausedAtRef.current !== null) return
    setAnswer(value)
    if (!session || session.mode !== 'Chrono libre' || finalizedRef.current) return
    const status = zenAttemptStatus(value, session.question.answer)
    const wrongAttemptCycle = updateZenWrongAttemptCycle(
      wrongCurrentRef.current,
      status,
      session.questionNumber,
    )
    wrongCurrentRef.current = wrongAttemptCycle.key
    if (status === 'correct') {
      clearWrongClearTimeout()
      const now = Date.now()
      const elapsed = Math.max(0, now - session.questionStartedAt)
      const next = nextZenQuestion(rngRef.current, session.operations ?? ['+'], {
        questionNumber: session.questionNumber,
        recent: session.zenRecent,
        requeue: session.zenRequeue,
      })
      setSession({
        ...session,
        question: next.question,
        questionNumber: next.questionNumber,
        zenRecent: next.recent,
        zenRequeue: next.requeue,
        missed: resolveSkipped(session.missed, session.question.text),
        log: appendLog(session.log, timeAttackCorrectEntry(
          session.question,
          value,
          elapsed / 1000,
          session.zenWrongAttemptsOnQuestion,
        )),
        zenWrongAttemptsOnQuestion: 0,
        zenLastWrongAttempt: undefined,
        score: session.score + 1,
        correct: session.correct + 1,
        streak: session.streak + 1,
        bestStreak: Math.max(session.bestStreak, session.streak + 1),
        questionStartedAt: now,
        totalResponseMs: session.totalResponseMs + elapsed,
        responseCount: session.responseCount + 1,
      })
      triggerFx('correct', 1)
      setAnswer('')
      wrongCurrentRef.current = ''
      return
    }
    if (status === 'wrong' && wrongAttemptCycle.countWrong) {
      setSession({
        ...session,
        zenWrongAttempts: session.zenWrongAttempts + 1,
        zenWrongAttemptsOnQuestion: session.zenWrongAttemptsOnQuestion + 1,
        zenLastWrongAttempt: value,
        streak: 0,
        missed: recordMissed(session.missed, {
          text: session.question.text,
          answer: session.question.answer,
          given: value,
          reason: 'wrong',
        }),
      })
      triggerFx('wrong')
      clearWrongClearTimeout()
      wrongClearTimeoutRef.current = window.setTimeout(() => {
        wrongClearTimeoutRef.current = null
        setAnswer('')
        wrongCurrentRef.current = ''
      }, 350)
    }
  }

  const handleZenSkip = useCallback(() => {
    if (!session || session.mode !== 'Chrono libre' || finalizedRef.current
      || quitConfirm || pausedAtRef.current !== null) return
    const now = Date.now()
    if (session.deadline && now >= session.deadline) {
      finishGame(session)
      return
    }
    clearWrongClearTimeout()
    wrongCurrentRef.current = ''
    setAnswer('')
    const next = nextZenQuestion(rngRef.current, session.operations ?? ['+'], {
      questionNumber: session.questionNumber,
      recent: session.zenRecent,
      requeue: session.zenRequeue,
    }, session.question)
    const deadline = applyZenSkip(session.deadline ?? now, now)
    const nextSession = {
      ...session,
      question: next.question,
      questionNumber: next.questionNumber,
      zenRecent: next.recent,
      zenRequeue: next.requeue,
      deadline,
      skipped: session.skipped + 1,
      streak: 0,
      questionStartedAt: now,
      log: appendLog(session.log, timeAttackSkipEntry(session.question, session.zenLastWrongAttempt)),
      zenWrongAttemptsOnQuestion: 0,
      zenLastWrongAttempt: undefined,
      missed: session.missed.some(({ text }) => text === session.question.text)
        ? session.missed
        : [...session.missed, {
          text: session.question.text,
          answer: session.question.answer,
          reason: 'skipped' as const,
        }],
    }
    setSession(nextSession)
    triggerFx('skip')
    if (deadline <= now) finishGame(nextSession, false)
  }, [session, finishGame, clearWrongClearTimeout, triggerFx, quitConfirm])

  useEffect(() => {
    if (screen !== 'game' || !session || quitConfirm || pausedAtRef.current !== null) return
    if (session.mode === 'Chrono libre') {
      if (session.deadline && clock >= session.deadline) finishGame(session)
      return
    }
    if (clock >= session.questionStartedAt + session.timeLimitSeconds * 1000
      && timedOutQuestionRef.current !== session.questionNumber) {
      timedOutQuestionRef.current = session.questionNumber
      handleNiveauxMistake(true)
    }
  }, [clock, screen, session, finishGame, handleNiveauxMistake, quitConfirm])

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
        if (pausedAtRef.current === null) openQuitConfirm()
        else closeQuitConfirm()
        return
      }
      if (session?.mode === 'Chrono libre' && event.code === 'Space') {
        if (quitConfirm || pausedAtRef.current !== null) return
        event.preventDefault()
        if (!event.repeat) handleZenSkip()
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, session, quitConfirm, handleZenSkip, openQuitConfirm, closeQuitConfirm])

  useEffect(() => {
    if (screen !== 'countdown') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      cancelCountdown()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, cancelCountdown])

  useEffect(() => {
    return () => clearWrongClearTimeout()
  }, [screen, session?.questionNumber, clearWrongClearTimeout])

  useEffect(() => {
    if (screen !== 'results' || !result) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key.toLowerCase() !== 'r') return
      if (result.mode === 'Défi Quotidien') return
      if (isInteractiveTarget(event.target)) return
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
    pausedAtRef.current = null
    setPausedAt(null)
    clearLevelUpTimeout()
    setScreen('home')
    setSession(null)
    setAnswer('')
    setFeedback('')
    setLevelUp(false)
    setQuitConfirm(false)
    setCurrentDate(dateKey(new Date()))
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

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) primeSound()
  }

  function toggleMotion() {
    const next = !motionOn
    setMotionOn(next)
    setMotionEnabled(next)
  }

  const showLevelsSetup = screen === 'levels-setup'
    || (screen === 'countdown' && countdownReturnScreen === 'levels-setup')
  const showDailySetup = screen === 'daily-setup'
    || (screen === 'countdown' && countdownReturnScreen === 'daily-setup')
  const showZenSetup = screen === 'zen-setup'
    || (screen === 'countdown' && countdownReturnScreen === 'zen-setup')

  return (
    <>
      <div className="waves" aria-hidden="true" />
      {screen !== 'game' && (
        <TopControls
          soundOn={soundOn}
          onToggleSound={toggleSound}
          motionOn={motionOn}
          onToggleMotion={toggleMotion}
        />
      )}
      <div className="app-view">
      {screen === 'countdown' && countdownValue !== null && (
        <Countdown value={countdownValue} onQuit={cancelCountdown} />
      )}
      {screen === 'home' && (
        <Accueil
          data={storedData}
          dailyPlayed={dailyPlayed}
          dailyScore={todayDailyScore}
          onLevels={() => setScreen('levels-setup')}
          onZen={() => setScreen('zen-setup')}
          onDaily={() => {
            if (dailyPlayed) return
            setScreen('daily-setup')
          }}
          onRecords={() => setScreen('records')}
          onAchievements={() => setScreen('achievements')}
        />
      )}
      {showLevelsSetup && <NiveauxSetup onStart={(level) => startLevels(level)} onBack={returnHome} />}
      {showDailySetup && (
        <DailySetup
          date={dateFromKey(currentDate)}
          onStart={() => startLevels(2, true)}
          onBack={returnHome}
        />
      )}
      {showZenSetup && <ZenSetup onStart={startZen} onBack={returnHome} bestScores={storedData.bestScores} />}
      {screen === 'game' && session?.mode === 'Chrono libre' && (
        <ZenGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          bestScore={bestZenScore}
          fx={fx}
          quitConfirm={quitConfirm}
          onAnswerChange={handleZenAnswer}
          onBackspace={() => onBackspace(true)}
          onClear={() => onClear(true)}
          onQuit={returnHome}
          onSkip={handleZenSkip}
          onRequestQuit={openQuitConfirm}
          onContinue={closeQuitConfirm}
        />
      )}
      {screen === 'game' && session && session.mode !== 'Chrono libre' && (
        <NiveauxGame
          session={session}
          remainingSeconds={remainingSeconds}
          answer={answer}
          feedback={feedback}
          bestAdjustedScore={bestAdjustedNiveauxScore}
          levelUp={levelUp}
          fx={fx}
          quitConfirm={quitConfirm}
          onAnswerChange={setAnswer}
          onSubmit={submitNiveauxAnswer}
          onBackspace={() => onBackspace()}
          onClear={() => onClear()}
          onQuit={returnHome}
          onRequestQuit={openQuitConfirm}
          onContinue={closeQuitConfirm}
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
      </div>
      <AchievementToast achievements={toast} onDismiss={dismissToast} />
    </>
  )
}

export default App
