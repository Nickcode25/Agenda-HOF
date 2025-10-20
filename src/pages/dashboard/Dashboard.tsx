import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { formatCurrency } from '@/utils/currency'
import { useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Scissors,
  BarChart3,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Sparkles
} from 'lucide-react'

export default function Dashboard() {
  const { patients } = usePatients()
  const { procedures } = useProcedures()

  // Calcular métricas dos procedimentos realizados
  const completedProcedures = useMemo(() => {
    return patients.flatMap(patient =>
      patient.plannedProcedures?.filter(proc => proc.status === 'completed') || []
    )
  }, [patients])

  const plannedProcedures = useMemo(() => {
    return patients.flatMap(patient =>
      patient.plannedProcedures?.filter(proc => proc.status !== 'completed') || []
    )
  }, [patients])

  // Métricas principais
  const totalRevenue = completedProcedures.reduce((sum, proc) => sum + (proc.totalValue || 0), 0)
  const totalProcedures = completedProcedures.length
  const totalPlanned = plannedProcedures.length
  const totalPatients = patients.length

  // Procedimento mais realizado
  const procedureCount = completedProcedures.reduce((acc, proc) => {
    acc[proc.procedureName] = (acc[proc.procedureName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostPerformedProcedure = Object.entries(procedureCount)
    .sort(([,a], [,b]) => b - a)[0] || ['Nenhum', 0]

  // Faturamento por procedimento
  const revenueByProcedure = completedProcedures.reduce((acc, proc) => {
    acc[proc.procedureName] = (acc[proc.procedureName] || 0) + (proc.totalValue || 0)
    return acc
  }, {} as Record<string, number>)

  const topRevenueProcs = Object.entries(revenueByProcedure)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Procedimentos mais populares
  const topPopularProcs = Object.entries(procedureCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Procedimentos cadastrados mas não realizados
  const procedureNames = new Set(completedProcedures.map(p => p.procedureName))
  const unusedProcedures = procedures.filter(proc => !procedureNames.has(proc.name))

  const stats = [
    {
      label: 'Faturamento Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
      border: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      subtitle: 'Procedimentos realizados'
    },
    {
      label: 'Procedimentos Realizados',
      value: totalProcedures.toString(),
      icon: CheckCircle,
      color: 'text-blue-400',
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      subtitle: 'Total concluído'
    },
    {
      label: 'Procedimentos Planejados',
      value: totalPlanned.toString(),
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
      iconBg: 'bg-orange-500/20',
      subtitle: 'Pendentes e em andamento'
    },
    {
      label: 'Total de Pacientes',
      value: totalPatients.toString(),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      subtitle: 'Cadastrados no sistema'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Activity size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Visão geral do seu negócio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`${stat.bg} border ${stat.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
                <div className="flex-1">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Most Performed Procedure */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-xl">
            <Award size={24} className="text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Procedimento Mais Realizado</h3>
        </div>
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <div>
            <p className="text-2xl font-bold text-yellow-400">{mostPerformedProcedure[0]}</p>
            <p className="text-gray-400 mt-1">Realizado {mostPerformedProcedure[1]} vezes</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <Sparkles size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold">
                {totalProcedures > 0 ? Math.round((mostPerformedProcedure[1] / totalProcedures) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Revenue Procedures */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Top 5 - Faturamento</h3>
          </div>
          <div className="space-y-3">
            {topRevenueProcs.length > 0 ? topRevenueProcs.map(([name, revenue], index) => (
              <div key={name} className="group relative bg-gradient-to-r from-green-500/10 to-transparent hover:from-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <span className="text-green-400 font-bold text-lg">{formatCurrency(revenue)}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                <BarChart3 size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum procedimento realizado ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Popular Procedures */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <BarChart3 size={24} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Top 5 - Mais Realizados</h3>
          </div>
          <div className="space-y-3">
            {topPopularProcs.length > 0 ? topPopularProcs.map(([name, count], index) => (
              <div key={name} className="group relative bg-gradient-to-r from-blue-500/10 to-transparent hover:from-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-lg">{count}x</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                <Scissors size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum procedimento realizado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unused Procedures */}
      {unusedProcedures.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <AlertTriangle size={24} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Procedimentos Não Realizados</h3>
              <p className="text-gray-400 text-sm mt-1">
                Estes procedimentos estão cadastrados mas ainda não foram realizados
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {unusedProcedures.map(proc => (
              <div key={proc.id} className="group flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all hover:scale-[1.02]">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Scissors size={20} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{proc.name}</p>
                  <p className="text-sm text-yellow-400">{formatCurrency(proc.value || proc.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
