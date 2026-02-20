import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-1)' }}>
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
