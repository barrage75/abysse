import { useLang } from '../i18n/useLang'

interface CountdownProps {
  value: number | 'dive'
  onQuit: () => void
}

export function Countdown({ value, onQuit }: CountdownProps) {
  const { t } = useLang()
  return (
    <div className="countdown-overlay" aria-live="assertive">
      <span key={value}>{value === 'dive' ? t.countdown.dive : value}</span>
      <button type="button" className="button button-secondary countdown-quit" onClick={onQuit}>
        {t.countdown.quit}
      </button>
    </div>
  )
}
