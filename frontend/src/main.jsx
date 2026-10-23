import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font hostowany lokalnie (bez zapytań do Google Fonts); latin-ext = polskie znaki
import '@fontsource/saira-semi-condensed/latin-400.css'
import '@fontsource/saira-semi-condensed/latin-ext-400.css'
import '@fontsource/saira-semi-condensed/latin-500.css'
import '@fontsource/saira-semi-condensed/latin-ext-500.css'
import '@fontsource/saira-semi-condensed/latin-600.css'
import '@fontsource/saira-semi-condensed/latin-ext-600.css'
import '@fontsource/saira-semi-condensed/latin-700.css'
import '@fontsource/saira-semi-condensed/latin-ext-700.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
