import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { ProfessionalProvider } from './contexts/ProfessionalContext'

// Loading component - minimal fallback
const LoadingFallback = () => null

// Core components (loaded immediately)
import App from './App'
import RoleGuard from './components/RoleGuard'
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute'

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/landing/NewLandingPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const PlansPage = lazy(() => import('./pages/PlansPage'))
const Checkout = lazy(() => import('./pages/Checkout'))

// Schedule
const ScheduleCalendar = lazy(() => import('./pages/schedule/ScheduleCalendar'))
const AppointmentForm = lazy(() => import('./pages/schedule/AppointmentForm'))

// Patients
const PatientsList = lazy(() => import('./pages/patients/PatientsList'))
const PatientForm = lazy(() => import('./pages/patients/PatientForm'))
const PatientDetail = lazy(() => import('./pages/patients/PatientDetail'))
const PatientEdit = lazy(() => import('./pages/patients/PatientEdit'))
const PatientEvolution = lazy(() => import('./pages/patients/PatientEvolution'))

// Students
const StudentsList = lazy(() => import('./pages/students/StudentsList'))
const StudentForm = lazy(() => import('./pages/students/StudentForm'))
const StudentDetail = lazy(() => import('./pages/students/StudentDetail'))

// Professionals
const ProfessionalsList = lazy(() => import('./pages/professionals/ProfessionalsList'))
const ProfessionalForm = lazy(() => import('./pages/professionals/ProfessionalForm'))
const ProfessionalDetail = lazy(() => import('./pages/professionals/ProfessionalDetail'))
const ProfessionalEdit = lazy(() => import('./pages/professionals/ProfessionalEdit'))

// Procedures
const ProceduresList = lazy(() => import('./pages/procedures/ProceduresList'))
const ProcedureForm = lazy(() => import('./pages/procedures/ProcedureForm'))
const ProcedureDetail = lazy(() => import('./pages/procedures/ProcedureDetail'))
const ProcedureEdit = lazy(() => import('./pages/procedures/ProcedureEdit'))
const ProcedureCategories = lazy(() => import('./pages/procedures/ProcedureCategories'))

// Stock
const StockList = lazy(() => import('./pages/stock/StockList'))
const StockForm = lazy(() => import('./pages/stock/StockForm'))

// Sales
const SalesList = lazy(() => import('./pages/sales/SalesList'))
const SaleForm = lazy(() => import('./pages/sales/SaleForm'))
const SalesProfessionalForm = lazy(() => import('./pages/sales/ProfessionalForm'))
const SalesProfessionalEdit = lazy(() => import('./pages/sales/ProfessionalEdit'))
const SalesHistory = lazy(() => import('./pages/sales/SalesHistory'))
const SalesProfessionalsList = lazy(() => import('./pages/sales/SalesProfessionalsList'))

// Financial
const FinancialReport = lazy(() => import('./pages/financial/FinancialReport'))
const TransactionDetails = lazy(() => import('./pages/financial/TransactionDetails'))

// Expenses
const ExpensesList = lazy(() => import('./pages/expenses/ExpensesList'))
const ExpenseForm = lazy(() => import('./pages/expenses/ExpenseForm'))
const ExpenseCategories = lazy(() => import('./pages/expenses/ExpenseCategories'))

// Cash
const CashRegistersList = lazy(() => import('./pages/cash/CashRegistersList'))
const CashSessionPage = lazy(() => import('./pages/cash/CashSessionPage'))

// Subscriptions
const PlansList = lazy(() => import('./pages/subscriptions/PlansList'))
const PlanForm = lazy(() => import('./pages/subscriptions/PlanForm'))
const PlanDetail = lazy(() => import('./pages/subscriptions/PlanDetail'))
const SubscribersList = lazy(() => import('./pages/subscriptions/SubscribersList'))
const SubscriptionForm = lazy(() => import('./pages/subscriptions/SubscriptionForm'))
const SubscriptionReports = lazy(() => import('./pages/subscriptions/SubscriptionReports'))
const SubscriptionsMain = lazy(() => import('./pages/subscriptions/SubscriptionsMain'))

// Staff
const StaffManagement = lazy(() => import('./pages/staff/StaffManagement'))

// Notifications
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))

// Clinical Evolution and Photos - moved to patients directory
const ClinicalEvolutionForm = lazy(() => import('./pages/patients/ClinicalEvolutionForm'))
const PhotoUploadPage = lazy(() => import('./pages/patients/PhotoUploadPage'))
const PhotoEditPage = lazy(() => import('./pages/patients/PhotoEditPage'))

// Settings
const EvolutionSettings = lazy(() => import('./pages/settings/EvolutionSettings'))

// Account
const SubscriptionManagement = lazy(() => import('./pages/account/SubscriptionManagement'))

// Admin
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const PlansAdminPage = lazy(() => import('./pages/admin/PlansAdminPage'))
const SubscriptionsAdminPage = lazy(() => import('./pages/admin/SubscriptionsAdminPage'))
const PaymentsAdminPage = lazy(() => import('./pages/admin/PaymentsAdminPage'))
const CouponsAdminPage = lazy(() => import('./pages/admin/CouponsAdminPage'))
const CourtesyAdminPage = lazy(() => import('./pages/admin/CourtesyAdminPage'))

// Helper to wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/signup',
    element: withSuspense(SignupPage),
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/planos',
    element: withSuspense(PlansPage),
  },
  {
    path: '/checkout',
    element: withSuspense(Checkout),
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
        element: withSuspense(ScheduleCalendar)
      },
      { path: 'agenda', element: withSuspense(ScheduleCalendar) },
      { path: 'agenda/nova', element: withSuspense(AppointmentForm) },

      { path: 'procedimentos', element: withSuspense(ProceduresList) },
      { path: 'procedimentos/categorias', element: withSuspense(ProcedureCategories) },
      { path: 'procedimentos/novo', element: withSuspense(ProcedureForm) },
      { path: 'procedimentos/:id', element: withSuspense(ProcedureDetail) },
      { path: 'procedimentos/:id/editar', element: withSuspense(ProcedureEdit) },

      { path: 'profissionais', element: withSuspense(ProfessionalsList) },
      { path: 'profissionais/novo', element: withSuspense(ProfessionalForm) },
      { path: 'profissionais/:id', element: withSuspense(ProfessionalDetail) },
      { path: 'profissionais/:id/editar', element: withSuspense(ProfessionalEdit) },

      { path: 'pacientes', element: withSuspense(PatientsList) },
      { path: 'pacientes/novo', element: withSuspense(PatientForm) },
      { path: 'pacientes/:id', element: withSuspense(PatientDetail) },
      { path: 'pacientes/:id/editar', element: withSuspense(PatientEdit) },
      { path: 'pacientes/:id/evolucao', element: withSuspense(PatientEvolution) },
      { path: 'pacientes/:id/evolucao/nova', element: withSuspense(ClinicalEvolutionForm) },
      { path: 'pacientes/:id/fotos/upload', element: withSuspense(PhotoUploadPage) },
      { path: 'pacientes/:id/fotos/:photoId/editar', element: withSuspense(PhotoEditPage) },

      { path: 'alunos', element: withSuspense(StudentsList) },
      { path: 'alunos/novo', element: withSuspense(StudentForm) },
      { path: 'alunos/:id', element: withSuspense(StudentDetail) },

      {
        path: 'estoque',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(StockList)}
          </RoleGuard>
        )
      },
      {
        path: 'estoque/novo',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(StockForm)}
          </RoleGuard>
        )
      },
      {
        path: 'estoque/:id/editar',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(StockForm)}
          </RoleGuard>
        )
      },

      {
        path: 'vendas',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesList)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/nova',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SaleForm)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/editar/:id',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SaleForm)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/historico',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesHistory)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesProfessionalsList)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais-lista',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesProfessionalsList)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais/novo',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesProfessionalForm)}
          </RoleGuard>
        )
      },
      {
        path: 'vendas/profissionais/editar/:id',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SalesProfessionalEdit)}
          </RoleGuard>
        )
      },

      {
        path: 'financeiro',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(FinancialReport)}
          </RoleGuard>
        )
      },
      {
        path: 'financeiro/detalhes/:category/:startDate/:endDate',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(TransactionDetails)}
          </RoleGuard>
        )
      },

      {
        path: 'despesas',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(ExpensesList)}
          </RoleGuard>
        )
      },
      {
        path: 'despesas/nova',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(ExpenseForm)}
          </RoleGuard>
        )
      },
      {
        path: 'despesas/editar/:id',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(ExpenseForm)}
          </RoleGuard>
        )
      },
      {
        path: 'despesas/categorias',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(ExpenseCategories)}
          </RoleGuard>
        )
      },

      {
        path: 'caixa',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(CashRegistersList)}
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
            {withSuspense(CashSessionPage)}
          </RoleGuard>
        )
      },

      {
        path: 'mensalidades',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SubscriptionsMain)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(PlansList)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/novo',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(PlanForm)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/:id',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(PlanDetail)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/planos/:id/editar',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(PlanForm)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/assinantes',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SubscribersList)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/assinantes/novo',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SubscriptionForm)}
          </RoleGuard>
        )
      },
      {
        path: 'mensalidades/relatorios',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(SubscriptionReports)}
          </RoleGuard>
        )
      },

      {
        path: 'funcionarios',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(StaffManagement)}
          </RoleGuard>
        )
      },

      { path: 'notificacoes', element: withSuspense(NotificationsPage) },

      { path: 'assinatura', element: withSuspense(SubscriptionManagement) },

      {
        path: 'configuracoes/evolution',
        element: (
          <RoleGuard requireOwner>
            {withSuspense(EvolutionSettings)}
          </RoleGuard>
        )
      },
    ],
  },
  {
    path: '/admin/login',
    element: withSuspense(AdminLoginPage),
  },
  {
    path: '/admin/dashboard',
    element: withSuspense(AdminDashboard),
  },
  {
    path: '/admin/users',
    element: withSuspense(UsersPage),
  },
  {
    path: '/admin/plans',
    element: withSuspense(PlansAdminPage),
  },
  {
    path: '/admin/subscriptions',
    element: withSuspense(SubscriptionsAdminPage),
  },
  {
    path: '/admin/payments',
    element: withSuspense(PaymentsAdminPage),
  },
  {
    path: '/admin/coupons',
    element: withSuspense(CouponsAdminPage),
  },
  {
    path: '/admin/courtesy',
    element: withSuspense(CourtesyAdminPage),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProfessionalProvider>
      <RouterProvider router={router} />
    </ProfessionalProvider>
  </React.StrictMode>
)
