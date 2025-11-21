/**
 * Utilitário para validação e acesso seguro a variáveis de ambiente
 */

// Variáveis obrigatórias
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const

// Variáveis opcionais com valores padrão
const OPTIONAL_ENV_VARS = {
  VITE_SITE_URL: () => typeof window !== 'undefined' ? window.location.origin : '',
  VITE_BACKEND_URL: 'http://localhost:3001',
  VITE_ASAAS_ENV: 'sandbox',
  VITE_MERCADOPAGO_PUBLIC_KEY: '',
  VITE_PAGBANK_TOKEN: '',
  VITE_PAGBANK_EMAIL: '',
  VITE_ASAAS_API_KEY: '',
} as const

type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number]
type OptionalEnvVar = keyof typeof OPTIONAL_ENV_VARS

/**
 * Obtém uma variável de ambiente obrigatória
 * @throws Error se a variável não estiver definida
 */
export function getRequiredEnv(key: RequiredEnvVar): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`)
  }
  return value
}

/**
 * Obtém uma variável de ambiente opcional com valor padrão
 */
export function getOptionalEnv(key: OptionalEnvVar): string {
  const value = import.meta.env[key]
  if (value) return value

  const defaultValue = OPTIONAL_ENV_VARS[key]
  if (typeof defaultValue === 'function') {
    return defaultValue()
  }
  return defaultValue
}

/**
 * Valida todas as variáveis de ambiente obrigatórias
 * Deve ser chamado no início da aplicação
 */
export function validateEnv(): void {
  const missing: string[] = []

  for (const key of REQUIRED_ENV_VARS) {
    if (!import.meta.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não definidas:', missing)
  }
}

/**
 * Verifica se está em modo de desenvolvimento
 */
export function isDev(): boolean {
  return import.meta.env.DEV
}

/**
 * Verifica se está em modo de produção
 */
export function isProd(): boolean {
  return import.meta.env.PROD
}

// URLs externas centralizadas
export const EXTERNAL_URLS = {
  VIACEP_API: 'https://viacep.com.br/ws',
  WHATSAPP_API: 'https://wa.me',
  WHATSAPP_SHARE: 'https://api.whatsapp.com/send',
  ASAAS_SANDBOX: 'https://sandbox.asaas.com/api/v3',
  ASAAS_PRODUCTION: 'https://api.asaas.com/v3',
  PAGBANK_SANDBOX: 'https://sandbox.api.pagseguro.com',
  PAGBANK_PRODUCTION: 'https://api.pagseguro.com',
} as const

/**
 * Gera URL do WhatsApp para um número
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  if (message) {
    return `${EXTERNAL_URLS.WHATSAPP_SHARE}?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`
  }
  return `${EXTERNAL_URLS.WHATSAPP_API}/55${cleanPhone}`
}

/**
 * Gera URL da API ViaCEP
 */
export function getViaCepUrl(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '')
  return `${EXTERNAL_URLS.VIACEP_API}/${cleanCep}/json/`
}
