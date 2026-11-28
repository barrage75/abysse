import '@fontsource/baloo-2/500.css'
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { readMotionEnabled } from './game/motion'
import { readTheme } from './game/theme'
import { LangProvider } from './i18n/LangProvider'

document.documentElement.dataset.motion = readMotionEnabled() ? 'on' : 'off'
document.documentElement.dataset.theme = readTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
)
