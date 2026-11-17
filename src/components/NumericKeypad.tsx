import { useEffect, useState } from 'react'

interface NumericKeypadProps {
  onDigit: (value: string) => void
  onBackspace: () => void
  onClear: () => void
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

export function NumericKeypad({ onDigit, onBackspace, onClear }: NumericKeypadProps) {
  const isTouch = useIsTouch()
  if (!isTouch) return null

  return (
    <div className="keypad" aria-label="Pavé numérique">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
        <button key={digit} type="button" onClick={() => onDigit(digit)}>{digit}</button>
      ))}
      <button type="button" className="keypad-secondary" onClick={onClear}>Effacer</button>
      <button type="button" onClick={() => onDigit('0')}>0</button>
      <button type="button" className="keypad-secondary" onClick={onBackspace}>⌫</button>
    </div>
  )
}
