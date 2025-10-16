import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { formatCurrency } from '@/utils/currency'
import { useMemo } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  Scissors, 
  BarChart3,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle
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

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <h3 className="font-medium text-gray-300">Faturamento Total</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Procedimentos realizados</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle size={20} className="text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-300">Procedimentos Realizados</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">{totalProcedures}</p>
          <p className="text-xs text-gray-500 mt-1">Total concluído</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock size={20} className="text-orange-400" />
            </div>
            <h3 className="font-medium text-gray-300">Procedimentos Planejados</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{totalPlanned}</p>
          <p className="text-xs text-gray-500 mt-1">Pendentes e em andamento</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users size={20} className="text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300">Total de Pacientes</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">{totalPatients}</p>
          <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
        </div>
      </div>

      {/* Most Performed Procedure */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award size={20} className="text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Procedimento Mais Realizado</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-yellow-400">{mostPerformedProcedure[0]}</p>
            <p className="text-gray-400">Realizado {mostPerformedProcedure[1]} vezes</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {totalProcedures > 0 ? Math.round((mostPerformedProcedure[1] / totalProcedures) * 100) : 0}% do total
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Revenue Procedures */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-green-400" />
            <h3 className="text-lg font-semibold text-white">Top 5 - Faturamento</h3>
          </div>
          <div className="space-y-3">
            {topRevenueProcs.length > 0 ? topRevenueProcs.map(([name, revenue], index) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">{name}</span>
                </div>
                <span className="text-green-400 font-bold">{formatCurrency(revenue)}</span>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">Nenhum procedimento realizado ainda</p>
            )}
          </div>
        </div>

        {/* Top Popular Procedures */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Top 5 - Mais Realizados</h3>
          </div>
          <div className="space-y-3">
            {topPopularProcs.length > 0 ? topPopularProcs.map(([name, count], index) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">{name}</span>
                </div>
                <span className="text-blue-400 font-bold">{count}x</span>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">Nenhum procedimento realizado ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Unused Procedures */}
      {unusedProcedures.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Procedimentos Não Realizados</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Estes procedimentos estão cadastrados mas ainda não foram realizados em nenhum paciente:
          </p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {unusedProcedures.map(proc => (
              <div key={proc.id} className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Scissors size={16} className="text-yellow-400" />
                <div>
                  <p className="text-white font-medium">{proc.name}</p>
                  <p className="text-xs text-yellow-400">{formatCurrency(proc.value || proc.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
