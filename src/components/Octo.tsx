interface OctoProps {
  mood: 'happy' | 'sad'
  className?: string
}

export function Octo({ mood, className = '' }: OctoProps) {
  return (
    <svg
      className={`octo ${className}`.trim()}
      viewBox="0 0 70 70"
      aria-hidden="true"
      focusable="false"
    >
      <g className="octo-tentacles" fill="none" strokeLinecap="round">
        <path d="M15 40q-4 14-10 16M25 40q-2 16-6 22M35 40v24M45 40q2 16 6 22M55 40q4 14 10 16" stroke="var(--ink)" strokeWidth="7" />
        <path d="M15 40q-4 14-10 16M25 40q-2 16-6 22M35 40v24M45 40q2 16 6 22M55 40q4 14 10 16" stroke="var(--o)" strokeWidth="3.5" />
      </g>
      <path
        className="octo-body"
        d="M15 34a20 20 0 1 1 40 0v7H15z"
        fill="var(--o)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <g className="octo-eyes">
        <ellipse cx="28" cy="28" rx="6" ry="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
        <ellipse cx="42" cy="28" rx="6" ry="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="29" cy="29" r="2.6" fill="var(--ink)" />
        <circle cx="43" cy="29" r="2.6" fill="var(--ink)" />
        {mood === 'sad' && (
          <path d="m22 26 11 4m4 0 11-4" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        )}
      </g>
      <path
        d={mood === 'happy' ? 'M28 37q7 6 14 0' : 'M28 42q7-6 14 0'}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
