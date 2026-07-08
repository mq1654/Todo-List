import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ThemeProvider from './components/ThemeProvider'
import './assets/index.css'
import App from './App'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}
