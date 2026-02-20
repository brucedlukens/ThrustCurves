import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import SimulatorPage from './pages/SimulatorPage'
import ComparePage from './pages/ComparePage'
import SavedPage from './pages/SavedPage'
import ErrorBoundary from './components/layout/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="simulator" element={<ErrorBoundary><SimulatorPage /></ErrorBoundary>} />
          <Route path="compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
          <Route path="saved" element={<ErrorBoundary><SavedPage /></ErrorBoundary>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
