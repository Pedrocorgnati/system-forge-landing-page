'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  mounted: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const THEME_STORAGE_KEY = 'theme'

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
  document.documentElement.style.colorScheme = theme
}

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initialTheme = getPreferredTheme()
    setThemeState(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)
  }, [])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const value = useMemo(
    () => ({
      theme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setTheme/toggleTheme are stable inline functions
    [theme, mounted],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
