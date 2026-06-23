import { useEffect } from 'react'
import { useStoreState } from 'easy-peasy'

export default function ThemeProvider({ children }) {
  const theme = useStoreState(state => state.settings?.theme || 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return children
}
