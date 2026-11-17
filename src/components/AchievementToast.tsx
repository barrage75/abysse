import { useEffect } from 'react'
import type { Achievement } from '../game/achievements'
import { useLang } from '../i18n/useLang'

interface AchievementToastProps {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const { t } = useLang()
  useEffect(() => {
    if (achievements.length === 0) return
    const timeout = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(timeout)
  }, [achievements, onDismiss])

  if (achievements.length === 0) return null

  return (
    <aside className="achievement-toast" aria-live="polite">
      <div>
        <strong>{t.toast.title}</strong>
        <p>{achievements.map((achievement) => (
          t.achievements.byId[achievement.id as keyof typeof t.achievements.byId]?.name ?? achievement.name
        )).join(' · ')}</p>
      </div>
      <button type="button" aria-label={t.toast.close} onClick={onDismiss}>×</button>
    </aside>
  )
}
