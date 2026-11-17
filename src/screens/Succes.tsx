import { ACHIEVEMENTS } from '../game/achievements'
import type { StoredGameData } from '../game/storage'

interface SuccesProps {
  data: StoredGameData
  onBack: () => void
}

export function Succes({ data, onBack }: SuccesProps) {
  const unlocked = new Map(data.achievements.map((achievement) => [achievement.id, achievement.date]))
  return (
    <main className="page-shell list-page">
      <button className="back-button" onClick={onBack}>← Accueil</button>
      <p className="eyebrow">{unlocked.size} sur {ACHIEVEMENTS.length} débloqués</p>
      <h1>Succès</h1>
      <section className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const date = unlocked.get(achievement.id)
          return (
            <article className={`achievement-card${date ? ' is-unlocked' : ''}`} key={achievement.id}>
              <span className="achievement-icon" aria-hidden="true">{date ? '✦' : '·'}</span>
              <div>
                <h2>{achievement.name}</h2>
                <p>{achievement.description}</p>
                {date && <time>{date}</time>}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
