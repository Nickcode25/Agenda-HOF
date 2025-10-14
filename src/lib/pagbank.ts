// PagBank (PagSeguro) Configuration
export const PAGBANK_TOKEN = import.meta.env.VITE_PAGBANK_TOKEN
export const PAGBANK_EMAIL = import.meta.env.VITE_PAGBANK_EMAIL

if (!PAGBANK_TOKEN) {
  console.warn('⚠️ VITE_PAGBANK_TOKEN não está configurada no .env')
}

// Plano mensal - R$ 109,90
export const PLAN_PRICE = 109.90
export const PLAN_NAME = 'Agenda+ HOF - Plano Profissional'
export const PLAN_DESCRIPTION = 'Sistema completo de gestão para clínicas de Harmonização Orofacial'

// URLs do PagBank
export const PAGBANK_SANDBOX_URL = 'https://sandbox.api.pagseguro.com'
export const PAGBANK_PRODUCTION_URL = 'https://api.pagseguro.com'

// Usar sandbox em desenvolvimento
export const PAGBANK_API_URL = import.meta.env.DEV
  ? PAGBANK_SANDBOX_URL
  : PAGBANK_PRODUCTION_URL

// Tipos
export interface PagBankOrder {
  reference_id: string
  customer: {
    name: string
    email: string
    tax_id?: string
    phones?: Array<{
      country: string
      area: string
      number: string
      type: string
    }>
  }
  items: Array<{
    reference_id: string
    name: string
    quantity: number
    unit_amount: number
  }>
  qr_codes?: Array<{
    amount: {
      value: number
    }
  }>
  notification_urls?: string[]
  charges?: Array<{
    reference_id: string
    description: string
    amount: {
      value: number
      currency: string
    }
    payment_method: {
      type: string
      installments: number
      capture: boolean
      card?: {
        number: string
        exp_month: string
        exp_year: string
        security_code: string
        holder: {
          name: string
        }
      }
    }
  }>
}

export interface PagBankResponse {
  id: string
  reference_id: string
  status: string
  created_at: string
  qr_codes?: Array<{
    id: string
    text: string
    links: Array<{
      rel: string
      href: string
      media: string
      type: string
    }>
  }>
  charges?: Array<{
    id: string
    reference_id: string
    status: string
    created_at: string
    amount: {
      value: number
      currency: string
    }
    payment_method: {
      type: string
    }
    links: Array<{
      rel: string
      href: string
      media: string
      type: string
    }>
  }>
  links?: Array<{
    rel: string
    href: string
    media: string
    type: string
  }>
}

export interface CreateOrderData {
  customerEmail: string
  customerName: string
  planPrice: number
  planName: string
}
