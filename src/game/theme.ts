export const THEMES = ['lagon', 'corail', 'nuit', 'algue', 'bonbon', 'soleil'] as const

export type ThemeId = (typeof THEMES)[number]

const THEME_KEY = 'abysse-theme'

export function readTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return THEMES.find((theme) => theme === stored) ?? 'lagon'
  } catch {
    return 'lagon'
  }
}

export function setTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // The theme still applies for this session.
  }
}
