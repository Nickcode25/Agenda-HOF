// Mercado Pago Configuration
export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY

if (!MERCADOPAGO_PUBLIC_KEY) {
  console.warn('⚠️ VITE_MERCADOPAGO_PUBLIC_KEY não está configurada no .env')
}

// Plano mensal - R$ 99,90
export const PLAN_PRICE = 99.90
export const PLAN_NAME = 'Agenda HOF - Plano Profissional'
export const PLAN_DESCRIPTION = 'Sistema completo de gestão para clínicas de Harmonização Orofacial'
