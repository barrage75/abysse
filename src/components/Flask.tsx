import { useId, type ReactNode } from 'react'

export type FlaskShape = 'tube' | 'round' | 'cone'

interface FlaskProps {
  shape: FlaskShape
  color: string
  label: string
  detail?: string
  icon?: ReactNode
  disabled?: boolean
  onClick: () => void
}

const SHAPES: Record<FlaskShape, { viewBox: string; glass: string; neck?: string; cork: string; liquidY: number }> = {
  tube: {
    viewBox: '0 0 320 120',
    glass: 'M44 14 H264 A46 46 0 0 1 264 106 H44 Z',
    neck: 'M30 22 H46 V98 H30 Z',
    cork: 'M8 30 H34 V90 H8 Q2 90 2 84 V36 Q2 30 8 30 Z',
    liquidY: 62,
  },
  round: {
    viewBox: '0 0 240 240',
    glass: 'M100 36 V82 A84 84 0 1 0 140 82 V36 Z',
    cork: 'M94 4 H146 Q150 4 150 8 V40 H90 V8 Q90 4 94 4 Z',
    liquidY: 128,
  },
  cone: {
    viewBox: '0 0 260 240',
    glass: 'M104 36 V92 L24 206 Q14 230 42 232 H218 Q246 230 236 206 L156 92 V36 Z',
    cork: 'M98 4 H162 Q166 4 166 8 V40 H94 V8 Q94 4 98 4 Z',
    liquidY: 140,
  },
}

export function Flask({ shape, color, label, detail, icon, disabled, onClick }: FlaskProps) {
  const id = useId().replace(/:/g, '')
  const s = SHAPES[shape]
  return (
    <button
      type="button"
      className={`flask flask-${shape}`}
      style={{ '--liquid': color } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      <svg className="flask-art" viewBox={s.viewBox} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={`clip-${id}`}><path d={s.glass} /></clipPath>
          <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.95" />
            <stop offset="1" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {s.neck && <path d={s.neck} fill={`url(#glass-${id})`} stroke="rgba(255,255,255,.7)" strokeWidth="3" />}
        <g clipPath={`url(#clip-${id})`}>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(8,30,60,.55)" />
          <g className="flask-liquid">
            <path
              d={`M-40 ${s.liquidY} q30 -12 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V400 H-40 Z`}
              fill={`url(#liq-${id})`}
            />
          </g>
          <circle className="flask-bubble b1" cx="30%" cy="80%" r="5" fill="rgba(255,255,255,.55)" />
          <circle className="flask-bubble b2" cx="62%" cy="86%" r="3.5" fill="rgba(255,255,255,.5)" />
          <circle className="flask-bubble b3" cx="78%" cy="76%" r="4" fill="rgba(255,255,255,.45)" />
        </g>
        <path d={s.glass} fill={`url(#glass-${id})`} stroke="rgba(255,255,255,.75)" strokeWidth="3.5" />
        <path d={s.cork} fill="#c08a55" stroke="#7a4f2a" strokeWidth="3" />
      </svg>
      <span className="flask-text">
        <span className="flask-label">{label}</span>
        {icon && <span className="flask-icon" aria-hidden="true">{icon}</span>}
        {detail && <span className="flask-detail">{detail}</span>}
      </span>
    </button>
  )
}
