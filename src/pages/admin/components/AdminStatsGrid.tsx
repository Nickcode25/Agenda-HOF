import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Activity,
  BarChart3,
  XCircle,
  AlertTriangle,
  Package
} from 'lucide-react'

interface Stats {
  totalClinics: number
  totalUsers: number
  totalRevenue: number
  activeSubscriptions: number
  totalAppointments: number
  totalSales: number
  clinicsInTrial: number
  clinicsExpired: number
  clinicsWithoutPlan: number
}

interface AdminStatsGridProps {
  stats: Stats
}

export default function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Usuários */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <Users className="w-10 h-10 text-blue-400" />
          <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
        </div>
        <h3 className="text-gray-300 font-medium">Total de Usuários</h3>
        <p className="text-xs text-gray-500 mt-2">Cadastros na plataforma</p>
      </div>

      {/* MRR - Receita Mensal Recorrente */}
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <DollarSign className="w-10 h-10 text-green-400" />
          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">R$ {stats.totalRevenue.toFixed(2)}</div>
        <h3 className="text-gray-300 font-medium">MRR</h3>
        <p className="text-xs text-gray-500 mt-2">Receita Mensal Recorrente</p>
      </div>

      {/* Assinaturas Ativas */}
      <div className="bg-green-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <span className="text-3xl font-bold text-white">{stats.activeSubscriptions}</span>
        </div>
        <h3 className="text-gray-300 font-medium">Assinaturas Ativas</h3>
        <p className="text-xs text-gray-500 mt-2">Pagantes atuais</p>
      </div>

      {/* Taxa de Conversão */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <Activity className="w-10 h-10 text-blue-400" />
          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {stats.totalUsers > 0 ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%
        </div>
        <h3 className="text-gray-300 font-medium">Taxa de Conversão</h3>
        <p className="text-xs text-gray-500 mt-2">{stats.activeSubscriptions} de {stats.totalUsers} usuários</p>
      </div>

      {/* Ticket Médio */}
      <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
        <div className="flex items-center justify-between mb-4">
          <BarChart3 className="w-10 h-10 text-orange-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          R$ {stats.activeSubscriptions > 0 ? (stats.totalRevenue / stats.activeSubscriptions).toFixed(2) : '0.00'}
        </div>
        <h3 className="text-gray-300 font-medium">Ticket Médio</h3>
        <p className="text-xs text-gray-500 mt-2">Por assinatura ativa</p>
      </div>

      {/* Cancelados */}
      <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <XCircle className="w-10 h-10 text-red-400" />
          <span className="text-3xl font-bold text-white">{stats.clinicsExpired}</span>
        </div>
        <h3 className="text-gray-300 font-medium">Cancelados</h3>
        <p className="text-xs text-gray-500 mt-2">Assinaturas encerradas</p>
      </div>

      {/* Churn Rate */}
      <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {stats.totalUsers > 0 ? ((stats.clinicsExpired / stats.totalUsers) * 100).toFixed(1) : 0}%
        </div>
        <h3 className="text-gray-300 font-medium">Churn Rate</h3>
        <p className="text-xs text-gray-500 mt-2">Taxa de cancelamento</p>
      </div>

      {/* Sem Plano */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <Package className="w-10 h-10 text-gray-400" />
          <span className="text-3xl font-bold text-white">{stats.clinicsWithoutPlan}</span>
        </div>
        <h3 className="text-gray-300 font-medium">Sem Plano</h3>
        <p className="text-xs text-gray-500 mt-2">Nunca assinaram</p>
      </div>
    </div>
  )
}
