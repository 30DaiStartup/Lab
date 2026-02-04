import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import OutcomeDetail from './pages/OutcomeDetail'
import ExperimentDetail from './pages/ExperimentDetail'
import Analytics from './pages/Analytics'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="outcomes/:id" element={<OutcomeDetail />} />
        <Route path="experiments/:id" element={<ExperimentDetail />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
