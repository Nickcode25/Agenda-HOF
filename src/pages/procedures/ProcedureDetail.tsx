import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { Scissors, DollarSign, Clock, ArrowLeft, Trash2, FileText, Package, Edit, ToggleLeft, ToggleRight, CreditCard, Banknote, Tag } from 'lucide-react'
import { useEffect } from 'react'
import { useConfirm } from '@/hooks/useConfirm'
import { useToast } from '@/hooks/useToast'

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
  const { show: showToast } = useToast()
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <Scissors size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">Procedimento não encontrado.</p>
        <Link to="/app/procedimentos" className="text-orange-500 hover:text-orange-600 font-medium">
          Voltar para lista de procedimentos
        </Link>
      </div>
    </div>
  )

  const handleDelete = async () => {
    if (await confirm({
      title: 'Remover Procedimento',
      message: `Tem certeza que deseja remover "${procedure.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })) {
      await remove(procedure.id)
      showToast('Procedimento removido com sucesso!', 'success')
      navigate('/app/procedimentos')
    }
  }

  const handleToggleActive = async () => {
    await update(procedure.id, { isActive: !procedure.isActive })
    showToast(
      procedure.isActive ? 'Procedimento desativado' : 'Procedimento ativado',
      'success'
    )
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
      {/* Header com botão voltar */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/procedimentos"
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar</span>
        </Link>

        <Link
          to={`/app/procedimentos/${id}/editar`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Edit size={18} />
          Editar
        </Link>
      </div>

      {/* Card Principal */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra de Status */}
        <div className={`h-1.5 ${procedure.isActive ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />

        {/* Conteúdo Principal */}
        <div className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Ícone */}
            <div className="flex-shrink-0">
              <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 flex items-center justify-center">
                <Scissors size={40} className="text-orange-500" />
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{procedure.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${
                  procedure.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${procedure.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {procedure.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Categoria */}
              {procedure.category && (
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-gray-400" />
                  <span className="text-gray-600">{procedure.category}</span>
                </div>
              )}

              {/* Grid de Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* Valor Padrão */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Valor Padrão</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(procedure.price)}</p>
                </div>

                {/* Valor à Vista */}
                {procedure.cashValue && procedure.cashValue > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Banknote size={16} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">À Vista</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(procedure.cashValue)}</p>
                    {procedure.cashValue < procedure.price && (
                      <p className="text-xs text-blue-500 mt-1">
                        Economia de {formatCurrency(procedure.price - procedure.cashValue)}
                      </p>
                    )}
                  </div>
                )}

                {/* Valor Parcelado */}
                {procedure.cardValue && procedure.cardValue > 0 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <CreditCard size={16} className="text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-600">Parcelado</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(procedure.cardValue)}</p>
                  </div>
                )}

                {/* Duração */}
                {procedure.durationMinutes && procedure.durationMinutes > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <Clock size={16} className="text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-600">Duração</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{procedure.durationMinutes} min</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição */}
          {procedure.description && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900">Descrição</h3>
              </div>
              <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{procedure.description}</p>
            </div>
          )}

          {/* Categorias de Estoque */}
          {procedure.stockCategories && procedure.stockCategories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900">Produtos Utilizados</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {procedure.stockCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                    <span className="text-gray-700 font-medium">{cat.category}</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                      Qtd: {cat.quantityUsed}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-6 lg:px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
              procedure.isActive
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
          >
            {procedure.isActive ? (
              <>
                <ToggleRight size={18} />
                Desativar
              </>
            ) : (
              <>
                <ToggleLeft size={18} />
                Ativar
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 rounded-xl font-medium transition-colors border border-red-200"
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
