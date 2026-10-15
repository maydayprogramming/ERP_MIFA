import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth } from './auth/RequireAuth'
import Dashboard from './pages/Dashboard'
import MyTasks from './pages/MyTasks'
import ProjectContracts from './pages/ProjectContracts'
import ProductionPlanning from './pages/ProductionPlanning'
import ProductionMonitoring from './pages/ProductionMonitoring'
import Dispatch from './pages/Dispatch'
import EquipmentMaster from './pages/EquipmentMaster'
import Downtime from './pages/Downtime'
import Maintenance from './pages/Maintenance'
import Fuel from './pages/Fuel'
import Warehouse from './pages/Warehouse'
import Procurement from './pages/Procurement'
import Personnel from './pages/Personnel'
import HSE from './pages/HSE'
import CostControl from './pages/CostControl'
import Billing from './pages/Billing'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

/** Semua route aplikasi beserta modul tempat kewenangan diperiksa. */
export const APP_ROUTES: Array<{ path: string; element: React.ReactNode }> = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/tugas-saya', element: <MyTasks /> },
  { path: '/proyek-kontrak', element: <ProjectContracts /> },
  { path: '/perencanaan', element: <ProductionPlanning /> },
  { path: '/monitoring-produksi', element: <ProductionMonitoring /> },
  { path: '/dispatch', element: <Dispatch /> },
  { path: '/master-unit', element: <EquipmentMaster /> },
  { path: '/downtime', element: <Downtime /> },
  { path: '/maintenance', element: <Maintenance /> },
  { path: '/bbm', element: <Fuel /> },
  { path: '/gudang', element: <Warehouse /> },
  { path: '/pengadaan', element: <Procurement /> },
  { path: '/personel', element: <Personnel /> },
  { path: '/hse', element: <HSE /> },
  { path: '/biaya', element: <CostControl /> },
  { path: '/rekonsiliasi', element: <Billing /> },
  { path: '/laporan', element: <Reports /> },
  { path: '/pengaturan', element: <Settings /> },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {APP_ROUTES.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <RequireAuth path={r.path}>
                {r.element}
              </RequireAuth>
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
