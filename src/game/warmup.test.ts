import { describe, expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { checkWarmup, nextWarmup, sanitizeWarmupInput } from './warmup'

describe('home warm-up', () => {
  it('does not repeat the previous question over 50 seeded draws', () => {
    const rng = mulberry32(510)
    let question = nextWarmup(rng)
    for (let index = 0; index < 50; index += 1) {
      const next = nextWarmup(rng, question.text)
      expect(next.text).not.toBe(question.text)
      question = next
    }
  })

  it('generates non-negative integer answers', () => {
    const rng = mulberry32(510)
    for (let index = 0; index < 50; index += 1) {
      const question = nextWarmup(rng)
      expect(Number.isInteger(question.answer)).toBe(true)
      expect(question.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it('checks correct, incorrect, and empty answers', () => {
    const question = { text: '6 × 7', answer: 42, op: '×' as const }
    expect(checkWarmup('42', question)).toBe(true)
    expect(checkWarmup('41', question)).toBe(false)
    expect(checkWarmup('', question)).toBe(false)
  })

  it.each([
    ['-5', '-5'],
    ['5-', '5'],
    ['--5', '-5'],
    ['a1b2', '12'],
  ])('sanitizes %s as %s', (value, expected) => {
    expect(sanitizeWarmupInput(value)).toBe(expected)
  })
})
