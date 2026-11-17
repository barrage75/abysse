import { ACHIEVEMENTS } from '../game/achievements'
import type { StoredGameData } from '../game/storage'
import { useLang } from '../i18n/useLang'
import { formatDateKey } from '../i18n/helpers'

interface SuccesProps {
  data: StoredGameData
  onBack: () => void
}

export function Succes({ data, onBack }: SuccesProps) {
  const { lang, t } = useLang()
  const unlocked = new Map(data.achievements.map((achievement) => [achievement.id, achievement.date]))
  return (
    <main className="page-shell list-page">
      <button className="back-button" onClick={onBack}>{t.setup.backHome}</button>
      <p className="eyebrow">{t.achievements.progress(unlocked.size, ACHIEVEMENTS.length)}</p>
      <h1>{t.achievements.title}</h1>
      <section className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const date = unlocked.get(achievement.id)
          const translation = t.achievements.byId[achievement.id as keyof typeof t.achievements.byId]
          return (
            <article className={`achievement-card${date ? ' is-unlocked' : ''}`} key={achievement.id}>
              <span className="achievement-icon" aria-hidden="true">{date ? '✦' : '·'}</span>
              <div>
                <h2>{translation?.name ?? achievement.name}</h2>
                <p>{translation?.description ?? achievement.description}</p>
                {date && <time dateTime={date}>{formatDateKey(date, lang)}</time>}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
