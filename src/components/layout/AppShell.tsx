import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppShell() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <Header
        onMenuToggle={() => setIsMobileNavOpen(v => !v)}
        isMobileNavOpen={isMobileNavOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-20 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        <main
          className="flex-1 overflow-auto"
          style={{ background: 'var(--bg)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
