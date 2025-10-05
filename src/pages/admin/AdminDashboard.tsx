import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { useAdmin } from '@/store/admin'
import CourtesyUsersSection from '@/components/admin/CourtesyUsersSection'
import SaasMetrics from '@/components/admin/SaasMetrics'
import ActivityLogs from '@/components/admin/ActivityLogs'
import AlertsPanel from '@/components/admin/AlertsPanel'
import {
  Users,
  DollarSign,
  Clock,
  UserPlus,
  TrendingUp,
  LogOut,
  Search,
  Filter
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminUser, signOut } = useAuth()
  const { stats, purchases, customers, fetchStats, fetchPurchases, fetchCustomers, fetchCourtesyUsers, loading } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchStats()
    fetchPurchases()
    fetchCustomers()
    fetchCourtesyUsers()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const filteredPurchases = purchases.filter(p =>
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productName.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'refunded': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'pending': return 'Pendente'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">
                Bem-vindo, {adminUser?.fullName || adminUser?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        <div className="mb-8">
          <AlertsPanel purchases={purchases} customers={customers} />
        </div>

        {/* SaaS Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Métricas SaaS</h2>
          <SaasMetrics purchases={purchases} customers={customers} />
        </div>

        {/* Últimas Compras */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Últimas Compras</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Nenhuma compra encontrada
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-white">{purchase.customerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{purchase.customerEmail}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{purchase.productName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-400">
                        {formatCurrency(purchase.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(purchase.paymentStatus)}`}>
                          {getStatusLabel(purchase.paymentStatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(purchase.purchaseDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* View All Link */}
          {purchases.length > 10 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/admin/purchases')}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Ver todas as compras ({purchases.length})
              </button>
            </div>
          )}
        </div>

        {/* Activity Logs e Usuários Cortesia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Activity Logs */}
          <ActivityLogs />

          {/* Estatísticas Rápidas */}
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resumo Rápido</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total de Clientes</span>
                  <span className="text-2xl font-bold text-white">{stats?.totalCustomers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Novos este mês</span>
                  <span className="text-2xl font-bold text-green-400">{stats?.newCustomersThisMonth || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Vendas este mês</span>
                  <span className="text-2xl font-bold text-blue-400">{formatCurrency(stats?.salesThisMonth || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/customers')}
                  className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg font-medium transition-colors text-left"
                >
                  Ver Todos os Clientes
                </button>
                <button
                  onClick={() => navigate('/admin/purchases')}
                  className="w-full py-2.5 px-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg font-medium transition-colors text-left"
                >
                  Ver Todas as Compras
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Usuários Cortesia */}
        <div className="mt-8">
          <CourtesyUsersSection />
        </div>
      </div>
    </div>
  )
}
