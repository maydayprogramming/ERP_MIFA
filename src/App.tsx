import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Production from './pages/Production'
import Sales from './pages/Sales'
import Purchasing from './pages/Purchasing'
import Inventory from './pages/Inventory'
import Fleet from './pages/Fleet'
import HSE from './pages/HSE'
import HR from './pages/HR'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/production" element={<Production />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/purchasing" element={<Purchasing />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/hse" element={<HSE />} />
        <Route path="/hr" element={<HR />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
