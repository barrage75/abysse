import { useEffect, useState } from 'react'
import { useLang } from '../i18n/useLang'

interface NumericKeypadProps {
  onDigit: (value: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit?: () => void
  submitLabel?: string
  disabled?: boolean
}

// oxlint-disable-next-line react/only-export-components
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const update = () => setIsTouch(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isTouch
}

export function NumericKeypad({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  submitLabel,
  disabled = false,
}: NumericKeypadProps) {
  const isTouch = useIsTouch()
  const { t } = useLang()
  if (!isTouch) return null

  return (
    <div className="keypad" aria-label={t.game.keypad}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
        <button key={digit} type="button" disabled={disabled} onClick={() => onDigit(digit)}>{digit}</button>
      ))}
      <button type="button" className="keypad-secondary" disabled={disabled} onClick={onClear}>{t.game.clear}</button>
      <button type="button" disabled={disabled} onClick={() => onDigit('0')}>0</button>
      <button type="button" className="keypad-secondary" disabled={disabled} onClick={onBackspace}>⌫</button>
      {onSubmit && (
        <button
          type="button"
          className="button button-primary keypad-submit"
          disabled={disabled}
          onClick={onSubmit}
        >
          {submitLabel ?? t.game.submit}
        </button>
      )}
    </div>
  )
}
