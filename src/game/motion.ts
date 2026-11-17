const MOTION_KEY = 'abysse-motion'

export function readMotionEnabled(): boolean {
  try {
    return localStorage.getItem(MOTION_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setMotionEnabled(enabled: boolean): void {
  document.documentElement.dataset.motion = enabled ? 'on' : 'off'
  try {
    localStorage.setItem(MOTION_KEY, enabled ? 'on' : 'off')
  } catch {
    // The document attribute still applies for this session.
  }
}
