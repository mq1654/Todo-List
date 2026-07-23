import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp } from 'antd'
import ThemeProvider from './components/ThemeProvider'
import { AuthProvider } from './hooks/useAuth'
import './assets/index.css'
import App from './App'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <AntdApp>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AntdApp>
      </ThemeProvider>
    </StrictMode>,
  )
}
