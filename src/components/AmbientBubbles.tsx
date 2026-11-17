type BubbleGroup = 'back' | 'front'

const BUBBLE_LAYERS: Record<BubbleGroup, string[]> = {
  back: ['ambient-bubble--back-3', 'ambient-bubble--back-2', 'ambient-bubble--back-1'],
  front: ['ambient-bubble--front-3', 'ambient-bubble--front-2', 'ambient-bubble--front-1'],
}

export function AmbientBubbles({ group }: { group: BubbleGroup }) {
  return (
    <div className={`ambient-bubbles ambient-bubbles--${group}`} aria-hidden="true">
      {BUBBLE_LAYERS[group].map((layer) => (
        <span className={`ambient-bubble ${layer}`} key={layer} />
      ))}
    </div>
  )
}
