import { createClient } from '@supabase/supabase-js'

// Cliente Supabase EXCLUSIVO para operações anônimas (sem autenticação)
// Usado para validar cupons antes do usuário criar conta
export const supabaseAnon = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined, // Não usar localStorage
    },
    global: {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        // Garantir que não envia Authorization header
      }
    }
  }
)

console.log('✅ Cliente Supabase Anônimo criado')
