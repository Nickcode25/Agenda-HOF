// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY não está configurada no .env')
}

// Plano mensal - R$ 99,90
export const PLAN_PRICE = 99.90
export const PLAN_NAME = 'Agenda HOF - Plano Profissional'
export const PLAN_DESCRIPTION = 'Sistema completo de gestão para clínicas de Harmonização Orofacial'
