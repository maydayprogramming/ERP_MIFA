import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './store'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'

// Terapkan tema tersimpan sebelum render untuk menghindari "flash" tema salah.
;(function applyInitialTheme() {
  try {
    const saved = localStorage.getItem('mifa-erp-theme')
    const mode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark'
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
    const theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.style.colorScheme = theme
  } catch {
    /* storage tidak tersedia — pakai default */
  }
})()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
