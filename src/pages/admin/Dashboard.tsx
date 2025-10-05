import { useEffect } from 'react'
import { useAdmin } from '@/store/admin'
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react'

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
      <div className="p-8">
        <div className="text-white text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clientes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {stats?.totalCustomers || 0}
          </p>
          <p className="text-sm text-gray-400">Total de Clientes</p>
        </div>

        {/* Receita Total */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-400 mb-1">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-400">Receita Total</p>
        </div>

        {/* Pagamentos Pendentes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-400 mb-1">
            {formatCurrency(stats?.pendingPayments || 0)}
          </p>
          <p className="text-sm text-gray-400">Pagamentos Pendentes</p>
        </div>

        {/* Vendas Este Mês */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-400 mb-1">
            {formatCurrency(stats?.salesThisMonth || 0)}
          </p>
          <p className="text-sm text-gray-400">Vendas Este Mês</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Novos Clientes</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {stats?.newCustomersThisMonth || 0}
            </span>
            <span className="text-gray-400">este mês</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Status Geral</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Sistema</span>
              <span className="text-green-400 font-medium">✓ Operacional</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Banco de Dados</span>
              <span className="text-green-400 font-medium">✓ Conectado</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">API</span>
              <span className="text-green-400 font-medium">✓ Ativa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
