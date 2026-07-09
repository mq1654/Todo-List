import { useLayoutEffect } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'
import { useStore } from '../store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.settings.theme)
  const isDark = theme === 'dark'

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorBgContainer: isDark ? '#334155' : '#ffffff',
          colorBgElevated: isDark ? '#334155' : '#ffffff',
          colorBorder: isDark ? '#475569' : '#e2e8f0',
        }
      }}
    >
      {children}
    </ConfigProvider>
  )
}
