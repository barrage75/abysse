import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from './en'
import fr from './fr'
import { LangContext, type Dictionary, type Language } from './context'
const LANGUAGE_KEY = 'abysse-lang'

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // Storage can be unavailable in private browsing.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr')
    ? 'fr'
    : 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage)
  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      localStorage.setItem(LANGUAGE_KEY, next)
    } catch {
      // Language selection still works for this session.
    }
  }, [])
  const t: Dictionary = lang === 'fr' ? fr : en
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  useEffect(() => {
    document.documentElement.lang = lang
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', t.metaDescription)
  }, [lang, t])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
