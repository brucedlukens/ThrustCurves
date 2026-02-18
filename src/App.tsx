import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import SimulatorPage from './pages/SimulatorPage'
import ComparePage from './pages/ComparePage'
import SavedPage from './pages/SavedPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
