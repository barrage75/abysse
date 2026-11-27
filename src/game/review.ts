export interface ReviewEntry {
  text: string
}

export function recordMissed<T extends ReviewEntry>(missed: T[], entry: T): T[] {
  const existingIndex = missed.findIndex(({ text }) => text === entry.text)
  if (existingIndex === -1) return [...missed, entry]
  return missed.map((item, index) => index === existingIndex ? entry : item)
}
