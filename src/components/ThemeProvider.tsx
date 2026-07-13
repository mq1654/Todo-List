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
          colorPrimary: '#2563eb',
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          borderRadius: 6,
          colorBgContainer: isDark ? '#334155' : '#ffffff',
          colorBgElevated: isDark ? '#334155' : '#ffffff',
          colorBorder: isDark ? '#475569' : '#e2e8f0',
        },
        components: {
          Pagination: {
            itemBg: 'transparent',
            itemActiveBg: 'transparent',
            itemLinkBg: 'transparent',
          },
          Typography: {
            titleMarginBottom: 0,
            titleMarginTop: 0,
          },
          Card: {
            paddingLG: 24,
            borderRadiusLG: 16,
            colorBorderSecondary: isDark ? '#334155' : '#e2e8f0',
            colorBgContainer: isDark ? '#1e293b' : '#ffffff',
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  )
}
