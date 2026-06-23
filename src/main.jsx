import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider, store } from './store/index'
import ThemeProvider from './components/ThemeProvider'
import './assets/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StoreProvider>
  </StrictMode>,
)
