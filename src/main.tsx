import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <ScheduleCalendar /> },
      { path: 'agenda/nova', element: <AppointmentForm /> },
      { path: 'agenda/fila', element: <Waitlist /> },

      { path: 'procedimentos', element: <ProceduresList /> },
      { path: 'procedimentos/novo', element: <ProcedureForm /> },
      { path: 'procedimentos/:id', element: <ProcedureDetail /> },

      { path: 'profissionais', element: <ProfessionalsList /> },
      { path: 'profissionais/novo', element: <ProfessionalForm /> },
      { path: 'profissionais/:id', element: <ProfessionalDetail /> },

      { path: 'pacientes', element: <PatientsList /> },
      { path: 'pacientes/novo', element: <PatientForm /> },
      { path: 'pacientes/:id', element: <PatientDetail /> },
      { path: 'pacientes/:id/editar', element: <PatientEdit /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
