import type { Achievement } from '../game/achievements'

interface AchievementToastProps {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  if (achievements.length === 0) return null

  return (
    <aside className="achievement-toast" aria-live="polite">
      <div>
        <strong>Succès débloqué</strong>
        <p>{achievements.map((achievement) => achievement.name).join(' · ')}</p>
      </div>
      <button type="button" aria-label="Fermer" onClick={onDismiss}>×</button>
    </aside>
  )
}
