import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import { ProfessionalProvider } from './contexts/ProfessionalContext'
import PatientsList from './pages/patients/PatientsList'
import PatientForm from './pages/patients/PatientForm'
import PatientDetail from './pages/patients/PatientDetail'
import PatientEdit from './pages/patients/PatientEdit'
import ScheduleCalendar from './pages/schedule/ScheduleCalendar'
import AppointmentForm from './pages/schedule/AppointmentForm'
import Waitlist from './pages/schedule/Waitlist'
import ProfessionalsList from './pages/professionals/ProfessionalsList'
import ProfessionalForm from './pages/professionals/ProfessionalForm'
import ProfessionalDetail from './pages/professionals/ProfessionalDetail'
import ProceduresList from './pages/procedures/ProceduresList'
import ProcedureForm from './pages/procedures/ProcedureForm'
import ProcedureDetail from './pages/procedures/ProcedureDetail'
import ProcedureEdit from './pages/procedures/ProcedureEdit'
import StockList from './pages/stock/StockList'
import StockForm from './pages/stock/StockForm'
import SalesList from './pages/sales/SalesList'
import SaleForm from './pages/sales/SaleForm'
import SalesProfessionalForm from './pages/sales/ProfessionalForm'
import Dashboard from './pages/dashboard/Dashboard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <ScheduleCalendar /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'agenda/nova', element: <AppointmentForm /> },
      { path: 'agenda/fila', element: <Waitlist /> },

      { path: 'procedimentos', element: <ProceduresList /> },
      { path: 'procedimentos/novo', element: <ProcedureForm /> },
      { path: 'procedimentos/:id', element: <ProcedureDetail /> },
      { path: 'procedimentos/:id/editar', element: <ProcedureEdit /> },

      { path: 'profissionais', element: <ProfessionalsList /> },
      { path: 'profissionais/novo', element: <ProfessionalForm /> },
      { path: 'profissionais/:id', element: <ProfessionalDetail /> },

      { path: 'pacientes', element: <PatientsList /> },
      { path: 'pacientes/novo', element: <PatientForm /> },
      { path: 'pacientes/:id', element: <PatientDetail /> },
      { path: 'pacientes/:id/editar', element: <PatientEdit /> },

      { path: 'estoque', element: <StockList /> },
      { path: 'estoque/novo', element: <StockForm /> },

      { path: 'vendas', element: <SalesList /> },
      { path: 'vendas/nova', element: <SaleForm /> },
      { path: 'vendas/profissionais/novo', element: <SalesProfessionalForm /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProfessionalProvider>
      <RouterProvider router={router} />
    </ProfessionalProvider>
  </React.StrictMode>
)
