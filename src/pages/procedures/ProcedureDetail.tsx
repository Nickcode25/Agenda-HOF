import { useParams, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { Scissors, DollarSign, Clock, ArrowLeft, Trash2, FileText } from 'lucide-react'

export default function ProcedureDetail() {
  const { id } = useParams()
  const { procedures, remove, toggleActive } = useProcedures(s => ({ 
    procedures: s.procedures, 
    remove: s.remove,
    toggleActive: s.toggleActive 
  }))
  const procedure = procedures.find(p => p.id === id)

  if (!procedure) return (
    <div>
      <p className="text-gray-400">Procedimento não encontrado.</p>
      <Link to="/procedimentos" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja remover ${procedure.name}?`)) {
      remove(procedure.id)
      window.location.href = '/procedimentos'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">Detalhes do Procedimento</h1>
          <p className="text-gray-400">Informações do procedimento</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Icon */}
          <div className="h-32 w-32 rounded-xl bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/30">
            <Scissors size={48} className="text-orange-500" />
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{procedure.name}</h2>
              <span className={`text-xs px-3 py-1 rounded-lg border ${procedure.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {procedure.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-green-500" />
                <div>
                  <p className="text-xs text-gray-400">Valor</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(procedure.value)}</p>
                </div>
              </div>
              
              {procedure.duration && (
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">Duração</p>
                    <p className="text-white font-medium">{procedure.duration} minutos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {procedure.description && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-orange-500" />
              <h3 className="font-medium text-orange-500">Descrição</h3>
            </div>
            <p className="text-gray-300">{procedure.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={() => toggleActive(procedure.id)}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${procedure.active ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'}`}
          >
            {procedure.active ? 'Desativar' : 'Ativar'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/30"
          >
            <Trash2 size={18} />
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}
