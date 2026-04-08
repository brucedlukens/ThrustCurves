import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import SimulatorPage from './pages/SimulatorPage'
import ComparePage from './pages/ComparePage'
import SavedPage from './pages/SavedPage'
import CustomCarPage from './pages/CustomCarPage'
import DynoReaderPage from './pages/DynoReaderPage'
import ErrorBoundary from './components/layout/ErrorBoundary'
import { useCarStore } from './store/carStore'

function AppInit({ children }: { children: React.ReactNode }) {
  const loadCustomCars = useCarStore(state => state.loadCustomCars)
  useEffect(() => {
    loadCustomCars()
  }, [loadCustomCars])
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="simulator" element={<ErrorBoundary><SimulatorPage /></ErrorBoundary>} />
            <Route path="compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
            <Route path="saved" element={<ErrorBoundary><SavedPage /></ErrorBoundary>} />
            <Route path="custom-car" element={<ErrorBoundary><CustomCarPage /></ErrorBoundary>} />
            <Route path="custom-car/:id" element={<ErrorBoundary><CustomCarPage /></ErrorBoundary>} />
            <Route path="dyno-reader" element={<ErrorBoundary><DynoReaderPage /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppInit>
    </BrowserRouter>
  )
}
