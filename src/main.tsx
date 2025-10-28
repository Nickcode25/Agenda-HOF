import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import { ProfessionalProvider } from './contexts/ProfessionalContext'
import PatientsList from './pages/patients/PatientsList'
import PatientForm from './pages/patients/PatientForm'
import PatientDetail from './pages/patients/PatientDetail'
import PatientEdit from './pages/patients/PatientEdit'
import ScheduleCalendar from './pages/schedule/ScheduleCalendar'
import AppointmentForm from './pages/schedule/AppointmentForm'
import ProfessionalsList from './pages/professionals/ProfessionalsList'
import ProfessionalForm from './pages/professionals/ProfessionalForm'
import ProfessionalDetail from './pages/professionals/ProfessionalDetail'
import ProfessionalEdit from './pages/professionals/ProfessionalEdit'
import ProceduresList from './pages/procedures/ProceduresList'
import ProcedureForm from './pages/procedures/ProcedureForm'
import ProcedureDetail from './pages/procedures/ProcedureDetail'
import ProcedureEdit from './pages/procedures/ProcedureEdit'
import ProcedureCategories from './pages/procedures/ProcedureCategories'
import StockList from './pages/stock/StockList'
import StockForm from './pages/stock/StockForm'
import SalesList from './pages/sales/SalesList'
import SaleForm from './pages/sales/SaleForm'
import SalesProfessionalForm from './pages/sales/ProfessionalForm'
import SalesProfessionalEdit from './pages/sales/ProfessionalEdit'
import SalesHistory from './pages/sales/SalesHistory'
import SalesProfessionalsList from './pages/sales/SalesProfessionalsList'
import FinancialReport from './pages/financial/FinancialReport'
import LandingPage from './pages/landing/NewLandingPage'
import Checkout from './pages/Checkout'
import PlansList from './pages/subscriptions/PlansList'
import PlanForm from './pages/subscriptions/PlanForm'
import PlanDetail from './pages/subscriptions/PlanDetail'
import SubscribersList from './pages/subscriptions/SubscribersList'
import SubscriptionForm from './pages/subscriptions/SubscriptionForm'
import SubscriptionReports from './pages/subscriptions/SubscriptionReports'
import SubscriptionsMain from './pages/subscriptions/SubscriptionsMain'
import StaffManagement from './pages/staff/StaffManagement'
import NotificationsPage from './pages/notifications/NotificationsPage'
import MedicalRecordPage from './pages/medical/MedicalRecordPage'
import AnamnesisForm from './pages/medical/AnamnesisForm'
import ClinicalEvolutionForm from './pages/medical/ClinicalEvolutionForm'
import PhotoUploadPage from './pages/medical/PhotoUploadPage'
import PhotoEditPage from './pages/medical/PhotoEditPage'
import ConsentForm from './pages/medical/ConsentForm'
import EvolutionSettings from './pages/settings/EvolutionSettings'
import RoleGuard from './components/RoleGuard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import MetricsPage from './pages/admin/MetricsPage'
import ActivitiesPage from './pages/admin/ActivitiesPage'
import AlertsPage from './pages/admin/AlertsPage'
import CourtesyUsersPage from './pages/admin/CourtesyUsersPage'
import CustomersManager from './pages/admin/CustomersManager'
import PurchasesManager from './pages/admin/PurchasesManager'
import CouponsManagement from './pages/admin/CouponsManagement'
import ProtectedRoute from './components/admin/ProtectedRoute'
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute'
import ExpensesList from './pages/expenses/ExpensesList'
import ExpenseForm from './pages/expenses/ExpenseForm'
import ExpenseCategories from './pages/expenses/ExpenseCategories'
import CashRegistersList from './pages/cash/CashRegistersList'
import CashSessionPage from './pages/cash/CashSessionPage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/checkout',
    element: <Checkout />,
  },
  {
    path: '/app',
    element: (
      <SubscriptionProtectedRoute>
        <App />
      </SubscriptionProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ScheduleCalendar />
      },
      { path: 'agenda', element: <ScheduleCalendar /> },
      { path: 'agenda/nova', element: <AppointmentForm /> },

      { path: 'procedimentos', element: <ProceduresList /> },
      { path: 'procedimentos/categorias', element: <ProcedureCategories /> },
      { path: 'procedimentos/novo', element: <ProcedureForm /> },
      { path: 'procedimentos/:id', element: <ProcedureDetail /> },
      { path: 'procedimentos/:id/editar', element: <ProcedureEdit /> },

      { path: 'profissionais', element: <ProfessionalsList /> },
      { path: 'profissionais/novo', element: <ProfessionalForm /> },
      { path: 'profissionais/:id', element: <ProfessionalDetail /> },
      { path: 'profissionais/:id/editar', element: <ProfessionalEdit /> },

      { path: 'pacientes', element: <PatientsList /> },
      { path: 'pacientes/novo', element: <PatientForm /> },
      { path: 'pacientes/:id', element: <PatientDetail /> },
      { path: 'pacientes/:id/editar', element: <PatientEdit /> },
      { path: 'pacientes/:id/prontuario', element: <MedicalRecordPage /> },
      { path: 'pacientes/:id/prontuario/anamnese', element: <AnamnesisForm /> },
      { path: 'pacientes/:id/prontuario/evolucao/nova', element: <ClinicalEvolutionForm /> },
      { path: 'pacientes/:id/prontuario/fotos/upload', element: <PhotoUploadPage /> },
      { path: 'pacientes/:id/prontuario/fotos/:photoId/editar', element: <PhotoEditPage /> },
      { path: 'pacientes/:id/prontuario/consentimento/novo', element: <ConsentForm /> },

      {
        path: 'estoque',
        element: (
          <RoleGuard requireOwner>
            <StockList />
          </RoleGuard>
        )
      },
      {
        path: 'estoque/novo',
        element: (
          <RoleGuard requireOwner>
            <StockForm />
          </RoleGuard>
        )
      },
      {
        path: 'estoque/:id/editar',
        element: (
          <RoleGuard requireOwner>
            <StockForm />
          </RoleGuard>
        )
      },

      {
        path: 'vendas',
        element: (
          <RoleGuard requireOwner>
            <SalesList />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/nova',
        element: (
          <RoleGuard requireOwner>
            <SaleForm />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/editar/:id',
        element: (
          <RoleGuard requireOwner>
            <SaleForm />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/historico',
        element: (
          <RoleGuard requireOwner>
            <SalesHistory />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais',
        element: (
          <RoleGuard requireOwner>
            <SalesProfessionalsList />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais-lista',
        element: (
          <RoleGuard requireOwner>
            <SalesProfessionalsList />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais/novo',
        element: (
          <RoleGuard requireOwner>
            <SalesProfessionalForm />
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais/editar/:id',
        element: (
          <RoleGuard requireOwner>
            <SalesProfessionalEdit />
          </RoleGuard>
        )
      },

      {
        path: 'financeiro',
        element: (
          <RoleGuard requireOwner>
            <FinancialReport />
          </RoleGuard>
        )
      },

      {
        path: 'despesas',
        element: (
          <RoleGuard requireOwner>
            <ExpensesList />
          </RoleGuard>
        )
      },
      {
        path: 'despesas/nova',
        element: (
          <RoleGuard requireOwner>
            <ExpenseForm />
          </RoleGuard>
        )
      },
      {
        path: 'despesas/editar/:id',
        element: (
          <RoleGuard requireOwner>
            <ExpenseForm />
          </RoleGuard>
        )
      },
      {
        path: 'despesas/categorias',
        element: (
          <RoleGuard requireOwner>
            <ExpenseCategories />
          </RoleGuard>
        )
      },

      {
        path: 'caixa',
        element: (
          <RoleGuard requireOwner>
            <CashRegistersList />
          </RoleGuard>
        )
      },
      {
        path: 'caixa/sessao',
        element: (
          <RoleGuard requireOwner>
            <Navigate to="/app/caixa" replace />
          </RoleGuard>
        )
      },
      {
        path: 'caixa/sessao/:registerId',
        element: (
          <RoleGuard requireOwner>
            <CashSessionPage />
          </RoleGuard>
        )
      },

      {
        path: 'mensalidades',
        element: (
          <RoleGuard requireOwner>
            <SubscriptionsMain />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos',
        element: (
          <RoleGuard requireOwner>
            <PlansList />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/novo',
        element: (
          <RoleGuard requireOwner>
            <PlanForm />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/:id',
        element: (
          <RoleGuard requireOwner>
            <PlanDetail />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/:id/editar',
        element: (
          <RoleGuard requireOwner>
            <PlanForm />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/assinantes',
        element: (
          <RoleGuard requireOwner>
            <SubscribersList />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/assinantes/novo',
        element: (
          <RoleGuard requireOwner>
            <SubscriptionForm />
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/relatorios',
        element: (
          <RoleGuard requireOwner>
            <SubscriptionReports />
          </RoleGuard>
        )
      },

      {
        path: 'funcionarios',
        element: (
          <RoleGuard requireOwner>
            <StaffManagement />
          </RoleGuard>
        )
      },

      { path: 'notificacoes', element: <NotificationsPage /> },

      {
        path: 'configuracoes/evolution',
        element: (
          <RoleGuard requireOwner>
            <EvolutionSettings />
          </RoleGuard>
        )
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'metrics', element: <MetricsPage /> },
      { path: 'customers', element: <CustomersManager /> },
      { path: 'purchases', element: <PurchasesManager /> },
      { path: 'coupons', element: <CouponsManagement /> },
      { path: 'activities', element: <ActivitiesPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'courtesy-users', element: <CourtesyUsersPage /> },
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
