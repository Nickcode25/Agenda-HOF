import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ VITE_STRIPE_PUBLIC_KEY não está configurada no .env')
}

// Singleton para instância do Stripe
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// Plano mensal - R$ 99,90
export const PLAN_PRICE = 99.90
export const PLAN_NAME = 'Agenda HOF - Plano Profissional'
export const PLAN_DESCRIPTION = 'Sistema completo de gestão para clínicas de Harmonização Orofacial'
