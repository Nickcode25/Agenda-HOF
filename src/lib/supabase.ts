import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cache do usuário para evitar múltiplas chamadas à API
let cachedUser: User | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 60000 // 1 minuto

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
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Importante: detecta tokens na URL automaticamente
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})

/**
 * Obtém o usuário atual de forma otimizada usando cache
 * Usa getSession() que é mais rápido que getUser()
 */
export async function getCachedUser(): Promise<User | null> {
  const now = Date.now()

  // Retornar cache se ainda válido
  if (cachedUser && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUser
  }

  // Usar getSession que é mais rápido (não faz chamada de rede se já tem sessão local)
  const { data: { session } } = await supabase.auth.getSession()

  cachedUser = session?.user || null
  cacheTimestamp = now

  return cachedUser
}

/**
 * Invalida o cache do usuário (chamar no logout)
 */
export function invalidateUserCache() {
  cachedUser = null
  cacheTimestamp = 0
}

// Listener para atualizar cache quando auth mudar
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    invalidateUserCache()
  } else if (session?.user) {
    cachedUser = session.user
    cacheTimestamp = Date.now()
  }
})
