import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Fazer login direto com Supabase Auth (não usar signIn do store)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou senha inválidos')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro ao autenticar usuário')
        setLoading(false)
        return
      }

      // 2. Verificar se é super admin
      const { data: isSuperAdmin, error: checkError } = await supabase
        .rpc('is_super_admin')

      if (checkError) {
        console.error('Erro ao verificar super admin:', checkError)
        setError('Erro ao verificar permissões')
        setLoading(false)
        return
      }

      if (!isSuperAdmin) {
        // Não é super admin, fazer logout
        await supabase.auth.signOut()
        setError('Acesso negado. Esta área é restrita a administradores da plataforma.')
        setLoading(false)
        return
      }

      // 3. É super admin! Redirecionar para dashboard admin
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Erro no login admin:', err)
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Login
            </h1>
            <p className="text-gray-300">
              Área restrita - Administradores da plataforma
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? 'Verificando...' : 'Entrar como Admin'}
            </button>
          </form>

          {/* Voltar */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
            >
              ← Voltar para o site
            </button>
          </div>
        </div>

        {/* Aviso de segurança */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            🔒 Esta área é protegida e monitorada. Apenas administradores autorizados podem acessar.
          </p>
        </div>
      </div>
    </div>
  )
}
