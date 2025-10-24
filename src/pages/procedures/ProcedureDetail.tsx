import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { Scissors, DollarSign, Clock, ArrowLeft, Trash2, FileText, Package } from 'lucide-react'
import { useEffect } from 'react'
import { useConfirm } from '@/hooks/useConfirm'

export default function ProcedureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { procedures, remove, update, fetchAll } = useProcedures(s => ({
    procedures: s.procedures,
    remove: s.remove,
    update: s.update,
    fetchAll: s.fetchAll
  }))
  const { confirm, ConfirmDialog } = useConfirm()
  const procedure = procedures.find(p => p.id === id)

  useEffect(() => {
    fetchAll()
  }, [])

  // Listener para tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/procedimentos')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  if (!procedure) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center">
        <p className="text-gray-400 mb-4">Procedimento não encontrado.</p>
        <Link to="/app/procedimentos" className="text-orange-500 hover:text-orange-400 hover:underline">
          Voltar para lista de procedimentos
        </Link>
      </div>
    </div>
  )

  const handleDelete = async () => {
    if (await confirm({ title: 'Confirmação', message: `Tem certeza que deseja remover ${procedure.name}?` })) {
      await remove(procedure.id)
      navigate('/app/procedimentos')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
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
              <span className={`text-xs px-3 py-1 rounded-lg border ${procedure.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {procedure.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-green-500" />
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Valor Padrão</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(procedure.price)}</p>
                  {procedure.cashValue && (
                    <p className="text-xs text-blue-400">À vista com desconto: {formatCurrency(procedure.cashValue)}</p>
                  )}
                  {procedure.cardValue && (
                    <p className="text-xs text-purple-400">Parcelado: {formatCurrency(procedure.cardValue)}</p>
                  )}
                </div>
              </div>

              {procedure.durationMinutes && (
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">Duração</p>
                    <p className="text-white font-medium">{procedure.durationMinutes} minutos</p>
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

        {/* Stock Categories */}
        {procedure.stockCategories && procedure.stockCategories.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Package size={18} className="text-orange-500" />
              <h3 className="font-medium text-orange-500">Categorias de Produtos Utilizados</h3>
            </div>
            <div className="space-y-2">
              {procedure.stockCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-700/50 px-4 py-2 rounded-lg">
                  <span className="text-gray-300">{cat.category}</span>
                  <span className="text-orange-400 font-medium">Qtd: {cat.quantityUsed}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={() => update(procedure.id, { isActive: !procedure.isActive })}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${procedure.isActive ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'}`}
          >
            {procedure.isActive ? 'Desativar' : 'Ativar'}
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

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
