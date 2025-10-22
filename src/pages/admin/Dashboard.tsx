import { useEffect } from 'react'
import { useAdmin } from '@/store/admin'
import { TrendingUp, Users, DollarSign, Clock, Sparkles, Shield, Activity } from 'lucide-react'

export default function Dashboard() {
  const { stats, fetchStats, loading } = useAdmin()

  useEffect(() => {
    fetchStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-lg font-medium">Carregando dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 p-8">
      {/* Header Premium */}
      <div className="mb-8 backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/50">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard Admin
            </h1>
            <p className="text-gray-400 mt-1">Visão geral e métricas do sistema</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Clientes */}
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-3xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-1">
              {stats?.totalCustomers || 0}
            </p>
            <p className="text-sm text-gray-400 font-medium">Total de Clientes</p>
          </div>
        </div>

        {/* Receita Total */}
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-3xl p-6 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-gray-400 font-medium">Receita Total</p>
          </div>
        </div>

        {/* Pagamentos Pendentes */}
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-600/5 rounded-3xl p-6 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-1">
              {formatCurrency(stats?.pendingPayments || 0)}
            </p>
            <p className="text-sm text-gray-400 font-medium">Pagamentos Pendentes</p>
          </div>
        </div>

        {/* Vendas Este Mês */}
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-600/5 rounded-3xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">
              {formatCurrency(stats?.salesThisMonth || 0)}
            </p>
            <p className="text-sm text-gray-400 font-medium">Vendas Este Mês</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Novos Clientes */}
        <div className="group backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-600/5 rounded-3xl p-8 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Novos Clientes</h3>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {stats?.newCustomersThisMonth || 0}
            </span>
            <span className="text-xl text-gray-400 font-medium">este mês</span>
          </div>
        </div>

        {/* Status Geral */}
        <div className="group backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Status Geral</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-gray-300 font-medium">Sistema</span>
              <span className="flex items-center gap-2 text-green-400 font-bold">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Operacional
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-gray-300 font-medium">Banco de Dados</span>
              <span className="flex items-center gap-2 text-green-400 font-bold">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-gray-300 font-medium">API</span>
              <span className="flex items-center gap-2 text-green-400 font-bold">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Ativa
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
