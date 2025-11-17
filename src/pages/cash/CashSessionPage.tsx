import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCash } from '@/store/cash'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import {
  DollarSign, ArrowLeft, Lock, Unlock, TrendingUp, TrendingDown,
  Plus, Minus, AlertCircle, CheckCircle, Calendar, Receipt, Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

export default function CashSessionPage() {
  const { registerId } = useParams<{ registerId: string }>()
  const navigate = useNavigate()
  const { show } = useToast()
  const {
    registers,
    currentSession,
    movements,
    fetchRegisters,
    getCurrentSession,
    openSession,
    closeSession,
    fetchMovements,
    addMovement,
    deleteMovement,
    getSessionTotal,
    getRegister
  } = useCash()

  const [loading, setLoading] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('R$ 0,00')
  const [closingBalance, setClosingBalance] = useState('R$ 0,00')
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementType, setMovementType] = useState<'income' | 'expense' | 'withdrawal' | 'deposit'>('income')
  const [movementData, setMovementData] = useState({
    amount: 'R$ 0,00',
    description: '',
    category: 'other' as 'procedure' | 'sale' | 'subscription' | 'expense' | 'other',
    paymentMethod: 'cash' as 'cash' | 'card' | 'pix' | 'transfer' | 'check'
  })
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    if (registerId) {
      fetchRegisters()
      loadSession()
    }
  }, [registerId])

  const loadSession = async () => {
    if (!registerId) return
    const session = await getCurrentSession(registerId)
    if (session) {
      await fetchMovements(session.id)
    }
  }

  const register = registerId ? getRegister(registerId) : null

  const handleOpenSession = async () => {
    if (!registerId) return
    setLoading(true)
    try {
      const sessionId = await openSession(registerId, parseCurrency(openingBalance))
      if (sessionId) {
        show('Caixa aberto com sucesso!', 'success')
        await loadSession()
      } else {
        show('Erro ao criar sessão de caixa', 'error')
      }
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error)
      show(error.message || 'Erro ao abrir caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSession = async () => {
    if (!currentSession) return

    const confirmed = await confirm({
      title: 'Fechar Caixa',
      message: 'Tem certeza que deseja fechar o caixa?',
      confirmText: 'OK',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'
    })

    if (!confirmed) return

    setLoading(true)
    try {
      await closeSession(currentSession.id, parseCurrency(closingBalance))
      show('Caixa fechado com sucesso!', 'success')
      navigate('/app/caixa')
    } catch (error: any) {
      show(error.message || 'Erro ao fechar caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentSession) return

    setLoading(true)
    try {
      await addMovement({
        cashSessionId: currentSession.id,
        type: movementType,
        category: movementData.category,
        amount: parseCurrency(movementData.amount),
        paymentMethod: movementData.paymentMethod,
        description: movementData.description
      })

      show('Movimentação registrada com sucesso!', 'success')
      setIsMovementModalOpen(false)
      setMovementData({
        amount: 'R$ 0,00',
        description: '',
        category: 'other',
        paymentMethod: 'cash'
      })
      await loadSession()
    } catch (error: any) {
      show(error.message || 'Erro ao registrar movimentação', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMovement = async (movementId: string, description: string) => {
    const confirmed = await confirm({
      title: 'Excluir Movimentação',
      message: `Tem certeza que deseja excluir a movimentação "${description}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })

    if (confirmed) {
      setLoading(true)
      try {
        await deleteMovement(movementId)
        show('Movimentação excluída com sucesso!', 'success')
        await loadSession()
      } catch (error: any) {
        show(error.message || 'Erro ao excluir movimentação', 'error')
      } finally {
        setLoading(false)
      }
    }
  }

  const totals = currentSession ? getSessionTotal(currentSession.id) : null

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'income': return <TrendingUp className="text-green-600" size={20} />
      case 'expense': return <TrendingDown className="text-red-600" size={20} />
      case 'withdrawal': return <Minus className="text-yellow-600" size={20} />
      case 'deposit': return <Plus className="text-amber-600" size={20} />
      default: return <Receipt className="text-gray-600" size={20} />
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Entrada'
      case 'expense': return 'Saída'
      case 'withdrawal': return 'Sangria'
      case 'deposit': return 'Reforço'
      default: return type
    }
  }

  if (!register) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Caixa não encontrado</p>
        <Link to="/app/caixa" className="text-green-400 hover:underline mt-4 inline-block">
          Voltar para Caixas
        </Link>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/app/caixa"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mb-2 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar para Caixas
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{register.name}</h1>
                <p className="text-sm text-gray-500">
                  {currentSession ? 'Caixa aberto' : 'Caixa fechado'}
                </p>
              </div>
            </div>
          </div>
          {currentSession && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <Unlock size={18} className="text-green-600" />
              <span className="text-green-600 font-medium">Aberto</span>
            </div>
          )}
        </div>

        {/* Session Info or Open Form */}
        {!currentSession ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Abrir Caixa</h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Inicial
              </label>
              <input
                type="text"
                value={openingBalance}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  const formatted = formatCurrency(parseFloat(value) / 100)
                  setOpeningBalance(formatted)
                }}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 mb-4"
                placeholder="R$ 0,00"
              />
              <button
                onClick={handleOpenSession}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
              >
                <Unlock size={18} className="inline mr-2" />
                {loading ? 'Abrindo...' : 'Abrir Caixa'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Totals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Entradas */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-600">Entradas</span>
                  <TrendingUp size={18} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(totals?.income || 0)}
                </div>
                <div className="text-sm text-gray-500">Receitas do dia</div>
              </div>

              {/* Saídas */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-red-600">Saídas</span>
                  <TrendingDown size={18} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(totals?.expense || 0)}
                </div>
                <div className="text-sm text-gray-500">Despesas do dia</div>
              </div>

              {/* Saldo */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-600">Saldo</span>
                  <DollarSign size={18} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(totals?.balance || 0)}
                </div>
                <div className="text-sm text-gray-500">Saldo atual</div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => { setMovementType('income'); setIsMovementModalOpen(true) }}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-6 text-left transition-all shadow-sm group"
              >
                <TrendingUp size={32} className="mb-3" />
                <div className="text-lg font-semibold">Entrada</div>
                <div className="text-sm opacity-90">Registrar receita</div>
              </button>

              <button
                onClick={() => { setMovementType('expense'); setIsMovementModalOpen(true) }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-6 text-left transition-all shadow-sm group"
              >
                <TrendingDown size={32} className="mb-3" />
                <div className="text-lg font-semibold">Saída</div>
                <div className="text-sm opacity-90">Registrar despesa</div>
              </button>

              <button
                onClick={() => { setMovementType('deposit'); setIsMovementModalOpen(true) }}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-6 text-left transition-all shadow-sm group"
              >
                <Plus size={32} className="mb-3" />
                <div className="text-lg font-semibold">Reforço</div>
                <div className="text-sm opacity-90">Adicionar dinheiro</div>
              </button>
            </div>

            {/* Movements List */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Movimentações do Dia</h2>
              {movements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-3">
                  {movements.map(movement => (
                    <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all group">
                      <div className="flex items-center gap-3 flex-1">
                        {getMovementIcon(movement.type)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{movement.description}</div>
                          <div className="text-sm text-gray-600">
                            {getMovementLabel(movement.type)} • {movement.paymentMethod.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`font-bold text-lg ${movement.type === 'income' || movement.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(movement.amount)}
                        </div>
                        <button
                          onClick={() => handleDeleteMovement(movement.id, movement.description)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir movimentação"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Session */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Fechar Caixa</h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Final (contado)
                </label>
                <input
                  type="text"
                  value={closingBalance}
                  onChange={(e) => {
                    let value = e.target.value
                    const isNegative = value.startsWith('-')
                    value = value.replace(/\D/g, '')
                    const numericValue = parseFloat(value || '0') / 100
                    const finalValue = isNegative ? -numericValue : numericValue
                    const formatted = formatCurrency(finalValue)
                    setClosingBalance(formatted)
                  }}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 mb-2"
                  placeholder="R$ 0,00"
                />
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle size={16} className="text-blue-600" />
                  <span>Saldo esperado: <strong>{formatCurrency(totals?.balance || 0)}</strong></span>
                </div>
                <button
                  onClick={handleCloseSession}
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                >
                  <Lock size={18} className="inline mr-2" />
                  {loading ? 'Fechando...' : 'Fechar Caixa'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Movement Modal */}
    {isMovementModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Registrar {getMovementLabel(movementType)}
          </h2>

          <form onSubmit={handleAddMovement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <input
                type="text"
                value={movementData.amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  const formatted = formatCurrency(parseFloat(value) / 100)
                  setMovementData({ ...movementData, amount: formatted })
                }}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={movementData.description}
                onChange={(e) => setMovementData({ ...movementData, description: e.target.value })}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                placeholder="Descrição da movimentação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={movementData.paymentMethod}
                onChange={(e) => setMovementData({ ...movementData, paymentMethod: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="pix">PIX</option>
                <option value="transfer">Transferência</option>
                <option value="check">Cheque</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
