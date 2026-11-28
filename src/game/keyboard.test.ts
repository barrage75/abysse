import { describe, expect, it } from 'vitest'
import { isInteractiveTarget } from './keyboard'

describe('keyboard shortcut targets', () => {
  it('recognizes controls and their descendants', () => {
    expect(isInteractiveTarget({ closest: () => ({ tagName: 'BUTTON' }) })).toBe(true)
  })

  it('allows page-level shortcuts outside interactive controls', () => {
    expect(isInteractiveTarget({ closest: () => null })).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
