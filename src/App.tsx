import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Production from './pages/Production'
import MinePlanning from './pages/MinePlanning'
import Shipping from './pages/Shipping'
import Legal from './pages/Legal'
import Sales from './pages/Sales'
import Purchasing from './pages/Purchasing'
import Inventory from './pages/Inventory'
import Fleet from './pages/Fleet'
import HSE from './pages/HSE'
import HR from './pages/HR'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { RedirectIfAuthed, RequireAuth } from './auth/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth path="/dashboard"><Dashboard /></RequireAuth>} />
        <Route path="/production" element={<RequireAuth path="/production"><Production /></RequireAuth>} />
        <Route path="/mine-planning" element={<RequireAuth path="/mine-planning"><MinePlanning /></RequireAuth>} />
        <Route path="/shipping" element={<RequireAuth path="/shipping"><Shipping /></RequireAuth>} />
        <Route path="/legal" element={<RequireAuth path="/legal"><Legal /></RequireAuth>} />
        <Route path="/sales" element={<RequireAuth path="/sales"><Sales /></RequireAuth>} />
        <Route path="/purchasing" element={<RequireAuth path="/purchasing"><Purchasing /></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth path="/inventory"><Inventory /></RequireAuth>} />
        <Route path="/fleet" element={<RequireAuth path="/fleet"><Fleet /></RequireAuth>} />
        <Route path="/hse" element={<RequireAuth path="/hse"><HSE /></RequireAuth>} />
        <Route path="/hr" element={<RequireAuth path="/hr"><HR /></RequireAuth>} />
        <Route path="/finance" element={<RequireAuth path="/finance"><Finance /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth path="/reports"><Reports /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth path="/settings"><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
