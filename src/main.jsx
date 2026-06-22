import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider, store } from './store/index'
import './assets/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
