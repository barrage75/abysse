import { afterEach, describe, expect, it, vi } from 'vitest'
import { readTheme, setTheme, THEMES } from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('theme preference', () => {
  it('defaults to lagon when no preference is stored', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    expect(readTheme()).toBe('lagon')
  })

  it('defaults to lagon for an unknown stored value', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'marshmallow' })
    expect(readTheme()).toBe('lagon')
  })

  it('returns a stored theme when it is valid', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'nuit' })
    expect(readTheme()).toBe('nuit')
    expect(THEMES).toEqual(['lagon', 'corail', 'nuit', 'algue', 'bonbon', 'soleil'])
  })

  it('persists a theme and updates the document dataset', () => {
    const setItem = vi.fn()
    const documentElement = { dataset: {} as Record<string, string> }
    vi.stubGlobal('localStorage', { setItem })
    vi.stubGlobal('document', { documentElement })

    setTheme('corail')

    expect(documentElement.dataset.theme).toBe('corail')
    expect(setItem).toHaveBeenCalledWith('abysse-theme', 'corail')
  })

  it('defaults to lagon when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Storage unavailable') },
    })
    expect(readTheme()).toBe('lagon')
  })
})
