import { useEffect, useRef, useState } from 'react'
import { readTheme, setTheme, THEMES, type ThemeId } from '../game/theme'
import { useLang } from '../i18n/useLang'

interface ThemePickerProps {
  onClose: () => void
}

export function ThemePicker({ onClose }: ThemePickerProps) {
  const { t } = useLang()
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(readTheme)
  const dialogRef = useRef<HTMLElement>(null)
  const firstThemeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstThemeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      if (!buttons?.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function chooseTheme(theme: ThemeId) {
    setTheme(theme)
    setSelectedTheme(theme)
  }

  return (
    <div
      className="theme-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="theme-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-picker-title"
        aria-describedby="theme-picker-hint"
      >
        <button className="theme-close" type="button" aria-label={t.theme.close} onClick={onClose}>×</button>
        <h2 id="theme-picker-title">{t.theme.title}</h2>
        <p id="theme-picker-hint">{t.theme.hint}</p>
        <div className="theme-options">
          {THEMES.map((theme, index) => (
            <button
              key={theme}
              ref={index === 0 ? firstThemeRef : undefined}
              type="button"
              className="theme-option"
              data-theme={theme}
              aria-pressed={selectedTheme === theme}
              onClick={() => chooseTheme(theme)}
            >
              <span className="theme-stripes" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>{t.theme.names[theme]}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
