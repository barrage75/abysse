import { useLang } from '../i18n/useLang'

function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {enabled ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18 5a9 9 0 0 1 0 14" />
        </>
      ) : (
        <>
          <path d="m16 9 5 6" />
          <path d="m21 9-5 6" />
        </>
      )}
    </svg>
  )
}

function MotionIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h3l3-6 4 12 3-6h5" />
      {!enabled && <path d="m4 4 16 16" />}
    </svg>
  )
}

interface TopControlsProps {
  soundOn: boolean
  onToggleSound: () => void
  motionOn: boolean
  onToggleMotion: () => void
}

export function TopControls({ soundOn, onToggleSound, motionOn, onToggleMotion }: TopControlsProps) {
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
        title={soundOn ? t.controls.disableSound : t.controls.enableSound}
        aria-pressed={soundOn}
        onClick={onToggleSound}
      >
        <SoundIcon enabled={soundOn} />
      </button>
      <button
        type="button"
        className="icon-toggle"
        aria-label={motionOn ? t.controls.disableMotion : t.controls.enableMotion}
        title={motionOn ? t.controls.disableMotion : t.controls.enableMotion}
        aria-pressed={motionOn}
        onClick={onToggleMotion}
      >
        <MotionIcon enabled={motionOn} />
      </button>
    </div>
  )
}
