import bgGame from './bg-game.webp'
import board from './board.webp'
import chalkNoise from './chalk-noise.png'
import octo from './octo.webp'
import octoChalk from './octo-chalk.webp'
import octoSad from './octo-sad.webp'
import plank from './plank.webp'

const screenAssets = [board, bgGame, plank, chalkNoise, octoChalk, octoSad, octo]
const kept: HTMLImageElement[] = []

export function preloadScreenAssets() {
  if (kept.length > 0) return
  for (const src of screenAssets) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
    kept.push(image)
    image.decode().catch(() => {})
  }
}
