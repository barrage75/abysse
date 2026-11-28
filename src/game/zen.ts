import type { Operation, Question } from './questions'
import type { RandomSource } from './rng'
import { generateQuestion } from './questions'

export const ZEN_DURATIONS = [30, 60, 120, 180] as const
export const ZEN_SKIP_PENALTY_MS = 3000
const ZEN_RECENT_LIMIT = 10
const MAX_QUESTION_ATTEMPTS = 100
export type ZenDuration = (typeof ZEN_DURATIONS)[number]

export interface ZenConfig {
  operations: Operation[]
  duration: ZenDuration
}

export interface ZenRequeueItem {
  question: Question
  dueAt: number
}

export interface ZenQuestionState {
  questionNumber: number
  recent: string[]
  requeue: ZenRequeueItem[]
}

export interface ZenQuestionAdvance extends ZenQuestionState {
  question: Question
}

export interface ZenErrors {
  operations?: string
  duration?: string
}

export function validateZenConfig(config: ZenConfig): ZenErrors {
  const errors: ZenErrors = {}
  if (config.operations.length === 0) errors.operations = 'Choisissez au moins une opération.'
  if (!ZEN_DURATIONS.includes(config.duration)) errors.duration = 'Choisissez une durée proposée.'
  return errors
}

export type ZenAttemptStatus = 'correct' | 'wrong' | 'pending'

export function zenAttemptStatus(value: string, answer: number): ZenAttemptStatus {
  if (value === '') return 'pending'
  if (Number(value) === answer) return 'correct'
  return value.length >= String(answer).length ? 'wrong' : 'pending'
}

function generateZenCandidate(rng: RandomSource, selected: Operation): Question {
  if (selected === '-') {
    const first = Math.floor(rng() * 99) + 2
    const second = Math.floor(rng() * 99) + 2
    return {
      text: `${first + second} − ${first}`,
      answer: second,
      op: '-',
    }
  }

  return generateQuestion(rng, {
    operations: [selected],
    addition: { min: 2, max: 100 },
    subtraction: { min: 2, max: 100 },
    multiplicationLeft: { min: 2, max: 12 },
    multiplicationRight: { min: 2, max: 100 },
    divisionDivisor: { min: 2, max: 12 },
    divisionQuotient: { min: 2, max: 100 },
  })
}

function isTrivialZenQuestion(question: Question): boolean {
  const [left, right] = question.text.split(/[+−×÷]/).map((part) => Number(part.trim()))

  if (question.op === '+') return left % 10 === 0 && right % 10 === 0
  if (question.op === '-') return right % 10 === 0 && question.answer % 10 === 0
  if (question.op === '×') return left === 10 || right % 10 === 0
  return right === 10 || question.answer % 10 === 0
}

export function generateZenQuestion(
  rng: RandomSource,
  operations: Operation[],
  recent: string[] = [],
): Question {
  if (operations.length === 0) throw new Error('Choisissez au moins une opération.')
  const recentQuestions = new Set(recent.slice(-ZEN_RECENT_LIMIT))

  for (let attempt = 0; attempt < MAX_QUESTION_ATTEMPTS; attempt += 1) {
    const selected = operations[Math.floor(rng() * operations.length)]
    const question = generateZenCandidate(rng, selected)
    if (!isTrivialZenQuestion(question) && !recentQuestions.has(question.text)) return question
  }

  throw new Error('Unable to generate a non-trivial, non-repeating question.')
}

export function nextZenQuestion(
  rng: RandomSource,
  operations: Operation[],
  state: ZenQuestionState,
  skippedQuestion?: Question,
): ZenQuestionAdvance {
  const questionNumber = state.questionNumber + 1
  const requeue = skippedQuestion
    ? [...state.requeue, { question: skippedQuestion, dueAt: state.questionNumber + 4 }]
    : [...state.requeue]
  const dueIndex = requeue.findIndex((item) => item.dueAt <= questionNumber)
  let question: Question

  if (dueIndex >= 0) {
    question = requeue.splice(dueIndex, 1)[0].question
  } else {
    question = generateZenQuestion(rng, operations, state.recent)
  }

  return {
    question,
    questionNumber,
    recent: [...state.recent, question.text].slice(-ZEN_RECENT_LIMIT),
    requeue,
  }
}

export function applyZenSkip(deadline: number, now: number): number {
  return Math.max(now, deadline - ZEN_SKIP_PENALTY_MS)
}

export function zenAccuracy(correct: number, wrongAttempts: number): number {
  const total = correct + wrongAttempts
  return total === 0 ? 100 : Math.round((correct / total) * 100)
}

export function zenComboKey(config: Pick<ZenConfig, 'duration' | 'operations'>): string {
  return `${config.duration}-${[...config.operations].sort().join('')}`
}
