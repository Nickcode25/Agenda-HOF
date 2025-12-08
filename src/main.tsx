import React, { lazy, Suspense, ComponentType } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { ProfessionalProvider } from './contexts/ProfessionalContext'

// Lazy load com retry automático em caso de erro de cache após deploy
function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      // Se falhar (geralmente por cache antigo após deploy), recarrega a página
      console.warn('Erro ao carregar módulo, recarregando página...', error)
      window.location.reload()
      // Retorna um componente vazio enquanto recarrega
      return { default: (() => null) as unknown as T }
    }
  })
}

// Loading component - minimal fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
)

// Core components (loaded immediately)
import App from './App'
import RoleGuard from './components/RoleGuard'
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute'

// Lazy loaded pages (com retry automático para evitar erro de cache após deploy)
const LandingPage = lazyWithRetry(() => import('./pages/landing/NewLandingPage'))
const SignupPage = lazyWithRetry(() => import('./pages/SignupPage'))
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'))
const PlansPage = lazyWithRetry(() => import('./pages/PlansPage'))
const Checkout = lazyWithRetry(() => import('./pages/Checkout'))

// Schedule
const ScheduleCalendar = lazyWithRetry(() => import('./pages/schedule/ScheduleCalendar'))
const AppointmentForm = lazyWithRetry(() => import('./pages/schedule/AppointmentForm'))
const RecurringBlocks = lazyWithRetry(() => import('./pages/schedule/RecurringBlocks'))

// Patients
const PatientsList = lazyWithRetry(() => import('./pages/patients/PatientsList'))
const PatientForm = lazyWithRetry(() => import('./pages/patients/PatientForm'))
const PatientDetail = lazyWithRetry(() => import('./pages/patients/PatientDetail'))
const PatientEdit = lazyWithRetry(() => import('./pages/patients/PatientEdit'))
const PatientEvolution = lazyWithRetry(() => import('./pages/patients/PatientEvolution'))

// Students
const StudentsList = lazyWithRetry(() => import('./pages/students/StudentsList'))
const StudentForm = lazyWithRetry(() => import('./pages/students/StudentForm'))
const StudentDetail = lazyWithRetry(() => import('./pages/students/StudentDetail'))
const StudentEdit = lazyWithRetry(() => import('./pages/students/StudentEdit'))

// Courses
const CoursesList = lazyWithRetry(() => import('./pages/courses/CoursesList'))
const CourseDetail = lazyWithRetry(() => import('./pages/courses/CourseDetail'))
const CourseForm = lazyWithRetry(() => import('./pages/courses/CourseForm'))

// Professionals
const ProfessionalsList = lazyWithRetry(() => import('./pages/professionals/ProfessionalsList'))
const ProfessionalForm = lazyWithRetry(() => import('./pages/professionals/ProfessionalForm'))
const ProfessionalDetail = lazyWithRetry(() => import('./pages/professionals/ProfessionalDetail'))
const ProfessionalEdit = lazyWithRetry(() => import('./pages/professionals/ProfessionalEdit'))

// Procedures
const ProceduresList = lazyWithRetry(() => import('./pages/procedures/ProceduresList'))
const ProcedureForm = lazyWithRetry(() => import('./pages/procedures/ProcedureForm'))
const ProcedureDetail = lazyWithRetry(() => import('./pages/procedures/ProcedureDetail'))
const ProcedureEdit = lazyWithRetry(() => import('./pages/procedures/ProcedureEdit'))

// Stock
const StockList = lazyWithRetry(() => import('./pages/stock/StockList'))
const StockForm = lazyWithRetry(() => import('./pages/stock/StockForm'))

// Sales
const SalesList = lazyWithRetry(() => import('./pages/sales/SalesList'))
const SaleForm = lazyWithRetry(() => import('./pages/sales/SaleForm'))
const SalesProfessionalForm = lazyWithRetry(() => import('./pages/sales/ProfessionalForm'))
const SalesProfessionalEdit = lazyWithRetry(() => import('./pages/sales/ProfessionalEdit'))
const SalesHistory = lazyWithRetry(() => import('./pages/sales/SalesHistory'))
const SalesProfessionalsList = lazyWithRetry(() => import('./pages/sales/SalesProfessionalsList'))

// Financial
const FinancialReport = lazyWithRetry(() => import('./pages/financial/FinancialReport'))

// Expenses
const ExpensesList = lazyWithRetry(() => import('./pages/expenses/ExpensesList'))
const ExpenseForm = lazyWithRetry(() => import('./pages/expenses/ExpenseForm'))
const ExpenseCategories = lazyWithRetry(() => import('./pages/expenses/ExpenseCategories'))

// Subscriptions
const PlansList = lazyWithRetry(() => import('./pages/subscriptions/PlansList'))
const PlanForm = lazyWithRetry(() => import('./pages/subscriptions/PlanForm'))
const PlanDetail = lazyWithRetry(() => import('./pages/subscriptions/PlanDetail'))
const SubscribersList = lazyWithRetry(() => import('./pages/subscriptions/SubscribersList'))
const SubscriptionForm = lazyWithRetry(() => import('./pages/subscriptions/SubscriptionForm'))
const SubscriptionReports = lazyWithRetry(() => import('./pages/subscriptions/SubscriptionReports'))
// SubscriptionsMain removed - route now redirects to /app/mensalidades/planos

// Staff
const StaffManagement = lazyWithRetry(() => import('./pages/staff/StaffManagement'))

// Notifications
const NotificationsPage = lazyWithRetry(() => import('./pages/notifications/NotificationsPage'))

// Clinical Evolution and Photos - moved to patients directory
const ClinicalEvolutionForm = lazyWithRetry(() => import('./pages/patients/ClinicalEvolutionForm'))
const PhotoUploadPage = lazyWithRetry(() => import('./pages/patients/PhotoUploadPage'))
const PhotoEditPage = lazyWithRetry(() => import('./pages/patients/PhotoEditPage'))

// Settings
const EvolutionSettings = lazyWithRetry(() => import('./pages/settings/EvolutionSettings'))

// Account
const SubscriptionManagement = lazyWithRetry(() => import('./pages/account/SubscriptionManagement'))

// Admin
const AdminLoginPage = lazyWithRetry(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'))
const UsersPage = lazyWithRetry(() => import('./pages/admin/UsersPage'))
const PlansAdminPage = lazyWithRetry(() => import('./pages/admin/PlansAdminPage'))
const SubscriptionsAdminPage = lazyWithRetry(() => import('./pages/admin/SubscriptionsAdminPage'))
const PaymentsAdminPage = lazyWithRetry(() => import('./pages/admin/PaymentsAdminPage'))
const CouponsAdminPage = lazyWithRetry(() => import('./pages/admin/CouponsAdminPage'))
const CourtesyAdminPage = lazyWithRetry(() => import('./pages/admin/CourtesyAdminPage'))

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
    path: '/forgot-password',
    element: withSuspense(ForgotPasswordPage),
  },
  {
    path: '/reset-password',
    element: withSuspense(ResetPasswordPage),
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
      {
        path: 'agenda',
        element: withSuspense(ScheduleCalendar)
      },
      { path: 'agenda/nova', element: withSuspense(AppointmentForm) },
      { path: 'agenda/editar/:id', element: withSuspense(AppointmentForm) },
      { path: 'agenda/recorrentes', element: withSuspense(RecurringBlocks) },

      { path: 'procedimentos', element: withSuspense(ProceduresList) },
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
      { path: 'alunos/:id/editar', element: withSuspense(StudentEdit) },

      { path: 'cursos', element: withSuspense(CoursesList) },
      { path: 'cursos/novo', element: withSuspense(CourseForm) },
      { path: 'cursos/:id', element: withSuspense(CourseDetail) },
      { path: 'cursos/:id/editar', element: withSuspense(CourseForm) },

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
        path: 'mensalidades',
        element: <Navigate to="/app/mensalidades/planos" replace />
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
