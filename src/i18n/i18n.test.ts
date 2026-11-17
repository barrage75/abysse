import { describe, expect, it } from 'vitest'
import en from './en'
import fr from './fr'
import { formatDailyShareText } from '../game/sharing'

function keyShape(value: unknown): unknown {
  if (typeof value === 'function') return 'function'
  if (typeof value !== 'object' || value === null) return typeof value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, child]) => [key, keyShape(child)]),
  )
}

describe('translations and daily sharing', () => {
  it('keeps the same nested keys in French and English', () => {
    expect(keyShape(en)).toEqual(keyShape(fr))
  })

  it('formats the French daily challenge share text', () => {
    expect(formatDailyShareText('fr', '2026-11-17', 1234, 18, 7))
      .toBe('ABYSSE · Défi du 17/11/2026 · 1\u202f234 pts · 18/20 ✓ · Série 7')
  })

  it('formats the English daily challenge share text', () => {
    expect(formatDailyShareText('en', '2026-11-17', 1234, 18, 7))
      .toBe('ABYSSE · Daily 17/11/2026 · 1,234 pts · 18/20 ✓ · Streak 7')
  })
})
