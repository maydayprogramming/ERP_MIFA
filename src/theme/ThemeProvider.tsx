import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'mifa-erp-theme'

interface ThemeContextValue {
  /** Preferensi pengguna (bisa 'system' untuk mengikuti OS) */
  mode: ThemeMode
  /** Tema yang benar-benar aktif setelah resolusi 'system' */
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? systemTheme() : mode
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch {
      /* storage tidak tersedia */
    }
    return 'dark'
  })
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(mode))

  // Terapkan kelas tema ke <html>
  useEffect(() => {
    const next = resolve(mode)
    setTheme(next)
    applyTheme(next)
  }, [mode])

  // Ikuti perubahan preferensi OS saat mode = 'system'
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = systemTheme()
      setTheme(next)
      applyTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage tidak tersedia */
    }
  }, [])

  const toggle = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setMode])

  const value = useMemo<ThemeContextValue>(() => ({ mode, theme, setMode, toggle }), [mode, theme, setMode, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme harus digunakan di dalam <ThemeProvider>')
  return ctx
}

/** Palet warna grafik yang menyesuaikan tema aktif. */
export function useChartTheme() {
  const { theme } = useTheme()
  return useMemo(
    () =>
      theme === 'dark'
        ? { grid: '#27272a', axis: '#71717a', tooltipBg: 'rgba(24,24,27,0.96)', tooltipBorder: '#3f3f46', label: '#a1a1aa', item: '#e4e4e7', cursor: 'rgba(63,63,70,0.16)' }
        : { grid: '#e4e4e7', axis: '#71717a', tooltipBg: 'rgba(255,255,255,0.98)', tooltipBorder: '#d4d4d8', label: '#52525b', item: '#27272a', cursor: 'rgba(63,63,70,0.10)' },
    [theme],
  )
}
