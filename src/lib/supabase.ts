import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação detalhada das variáveis de ambiente
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL não está definida. Verifique seu arquivo .env')
  throw new Error('Configuração incompleta: VITE_SUPABASE_URL não definida. Verifique o arquivo .env')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não está definida. Verifique seu arquivo .env')
  throw new Error('Configuração incompleta: VITE_SUPABASE_ANON_KEY não definida. Verifique o arquivo .env')
}

// Validar formato da URL
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.warn('⚠️ VITE_SUPABASE_URL pode estar em formato incorreto:', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})
