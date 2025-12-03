import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Activity,
  BarChart3,
  XCircle,
  AlertTriangle,
  Package,
  Gift,
  ChevronRight
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
  totalCourtesies: number
}

interface AdminStatsGridProps {
  stats: Stats
  onCardClick?: (cardType: string) => void
}

export default function AdminStatsGrid({ stats, onCardClick }: AdminStatsGridProps) {
  const handleClick = (cardType: string) => {
    if (onCardClick) {
      onCardClick(cardType)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Usuários */}
      <button
        onClick={() => handleClick('users')}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-700 font-medium">Total de Usuários</h3>
            <p className="text-xs text-gray-500 mt-1">Cadastros na plataforma</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </button>

      {/* MRR - Receita Mensal Recorrente */}
      <button
        onClick={() => handleClick('revenue')}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md hover:border-green-400 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <TrendingUp className="w-6 h-6 text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">R$ {stats.totalRevenue.toFixed(2)}</div>
            <h3 className="text-gray-700 font-medium">MRR</h3>
            <p className="text-xs text-gray-500 mt-1">Receita Mensal Recorrente</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </div>
      </button>

      {/* Assinaturas Ativas */}
      <button
        onClick={() => handleClick('subscriptions')}
        className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md hover:border-green-400 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-700 font-medium">Assinaturas Ativas</h3>
            <p className="text-xs text-gray-500 mt-1">Pagantes atuais</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
        </div>
      </button>

      {/* Taxa de Conversão */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <TrendingUp className="w-6 h-6 text-green-500" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {stats.totalUsers > 0 ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%
        </div>
        <h3 className="text-gray-700 font-medium">Taxa de Conversão</h3>
        <p className="text-xs text-gray-500 mt-1">{stats.activeSubscriptions} de {stats.totalUsers} usuários</p>
      </div>

      {/* Ticket Médio */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          R$ {stats.activeSubscriptions > 0 ? (stats.totalRevenue / stats.activeSubscriptions).toFixed(2) : '0.00'}
        </div>
        <h3 className="text-gray-700 font-medium">Ticket Médio</h3>
        <p className="text-xs text-gray-500 mt-1">Por assinatura ativa</p>
      </div>

      {/* Cortesias Ativas */}
      <button
        onClick={() => handleClick('courtesy')}
        className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats.totalCourtesies}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-700 font-medium">Cortesias Ativas</h3>
            <p className="text-xs text-gray-500 mt-1">Acessos gratuitos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </div>
      </button>

      {/* Cancelados */}
      <button
        onClick={() => handleClick('cancelled')}
        className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats.clinicsExpired}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-700 font-medium">Cancelados</h3>
            <p className="text-xs text-gray-500 mt-1">Assinaturas encerradas</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
      </button>

      {/* Sem Plano */}
      <button
        onClick={() => handleClick('without_plan')}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
            <Package className="w-6 h-6 text-gray-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats.clinicsWithoutPlan}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-700 font-medium">Sem Plano</h3>
            <p className="text-xs text-gray-500 mt-1">Nunca assinaram</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </button>
    </div>
  )
}
