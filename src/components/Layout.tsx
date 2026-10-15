import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastStack, useToastHost } from './ToastHost'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { toasts, dismiss } = useToastHost()

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-[0.35]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-sky-500/[0.05] blur-[120px]" />

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="relative lg:pl-[264px]">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px] animate-fade-in">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-line px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-[11px] text-ink-faintest sm:flex-row">
            <p>
              &copy; 2026 <span className="text-ink-muted">PT MIFA Bara Nusantara</span> &middot; MIFA ERP v1.0.0 &middot; Enterprise Coal Mining Suite
            </p>
            <p className="flex items-center gap-3">
              <span>Data per {new Date('2026-10-15').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="h-1 w-1 rounded-full bg-surface-3" />
              <span>Kurs USD/IDR 15.850</span>
            </p>
          </div>
        </footer>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
