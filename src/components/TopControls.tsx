import { useLang } from '../i18n/useLang'

interface TopControlsProps {
  soundOn: boolean
  onToggleSound: () => void
}

export function TopControls({ soundOn, onToggleSound }: TopControlsProps) {
  const { lang, setLang, t } = useLang()
  return (
    <div className="top-controls">
      <button
        type="button"
        className="icon-toggle"
        aria-label={lang === 'fr' ? t.controls.switchToEnglish : t.controls.switchToFrench}
        onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
      >
        {lang === 'fr' ? 'EN' : 'FR'}
      </button>
      <button
        type="button"
        className="icon-toggle"
        aria-label={soundOn ? t.controls.disableSound : t.controls.enableSound}
        aria-pressed={soundOn}
        onClick={onToggleSound}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>
    </div>
  )
}
