import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCash } from '@/store/cash'
import { Plus, DollarSign, Edit, Trash2, CheckCircle, XCircle, Store } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'

export default function CashRegistersList() {
  const navigate = useNavigate()
  const { hasActiveSubscription } = useSubscription()
  const { registers, currentSession, fetchRegisters, deleteRegister, loading } = useCash()
  const { show } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegister, setEditingRegister] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    // Se há uma sessão aberta, redirecionar para ela
    if (currentSession) {
      navigate(`/app/caixa/sessao/${currentSession.cashRegisterId}`)
      return
    }
    fetchRegisters()
  }, [currentSession, navigate])

  const handleOpenModal = (register?: any) => {
    if (register) {
      setEditingRegister(register)
      setFormData({
        name: register.name,
        description: register.description || '',
        isActive: register.isActive
      })
    } else {
      setEditingRegister(null)
      setFormData({
        name: '',
        description: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { addRegister, updateRegister } = useCash.getState()

    if (editingRegister) {
      await updateRegister(editingRegister.id, formData)
      show('Caixa atualizado com sucesso!', 'success')
    } else {
      await addRegister(formData)
      show('Caixa criado com sucesso!', 'success')
    }

    setIsModalOpen(false)
    await fetchRegisters()
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o caixa "${name}"?`)) {
      await deleteRegister(id)
      await fetchRegisters()
      show('Caixa excluído com sucesso!', 'success')
    }
  }

  return (
    <>
    <div className="space-y-6 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Controle de Caixa bloqueado" feature="o controle completo de caixa e fluxo financeiro" />}
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Store size={32} className="text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Caixas</h1>
                <p className="text-gray-400">Gerencie os pontos de venda da clínica</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40"
            >
              <Plus size={18} />
              Novo Caixa
            </button>
          </div>
        </div>
      </div>

      {/* Registers Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando caixas...</div>
      ) : registers.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Store size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum caixa cadastrado</h3>
            <p className="text-gray-400 mb-6">Crie seu primeiro caixa para começar</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40"
            >
              <Plus size={18} />
              Novo Caixa
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registers.map(register => (
            <div
              key={register.id}
              className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/80 transition-all duration-300 hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                    <Store size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{register.name}</h3>
                    {register.description && (
                      <p className="text-sm text-gray-400 mt-1">{register.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {register.isActive ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50">
                <Link
                  to={`/app/caixa/sessao/${register.id}`}
                  className="flex-1 p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all border border-transparent hover:border-green-500/30 text-sm font-medium text-center"
                >
                  <DollarSign size={16} className="inline mr-1" />
                  Abrir Caixa
                </Link>
                <button
                  onClick={() => handleOpenModal(register)}
                  className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(register.id, register.name)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingRegister ? 'Editar Caixa' : 'Novo Caixa'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Caixa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Ex: Caixa Principal, Recepção 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Descrição opcional do caixa"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Caixa ativo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-green-500/30 transition-all"
                >
                  {editingRegister ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
