import { createContext } from 'react'
import fr, { type TranslationShape } from './fr'

export type Language = 'fr' | 'en'
export type Dictionary = TranslationShape<typeof fr>

export interface LangContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: Dictionary
}

export const LangContext = createContext<LangContextValue | null>(null)
