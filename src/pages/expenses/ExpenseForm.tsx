import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { parseCurrency, formatCurrency } from '@/utils/currency'
import { normalizeDateString, getTodayString } from '@/utils/dateHelpers'
import { Receipt, ArrowLeft, Save, Calendar, DollarSign, Tag, Repeat } from 'lucide-react'
import type { RecurringFrequency } from '@/types/cash'
import { useToast } from '@/hooks/useToast'

export default function ExpenseForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { categories, getExpense, addExpense, updateExpense, fetchCategories } = useExpenses()
  const { show } = useToast()

  const isEditing = !!id
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    categoryId: '',
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'pix' | 'transfer' | 'check',
    paymentStatus: 'paid' as 'pending' | 'paid' | 'overdue',
    dueDate: '',
    paidAt: '',
    isRecurring: false,
    recurringFrequency: 'monthly' as RecurringFrequency,
    recurringDay: 1,
    recurringEndDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchCategories()

    if (id) {
      const expense = getExpense(id)
      if (expense) {
        setFormData({
          categoryId: expense.categoryId || '',
          description: expense.description,
          amount: formatCurrency(expense.amount),
          paymentMethod: expense.paymentMethod,
          paymentStatus: expense.paymentStatus,
          dueDate: expense.dueDate || '',
          paidAt: expense.paidAt || '',
          isRecurring: expense.isRecurring,
          recurringFrequency: expense.recurringFrequency || 'monthly',
          recurringDay: expense.recurringDay || 1,
          recurringEndDate: expense.recurringEndDate || '',
          notes: expense.notes || ''
        })
      }
    }
  }, [id, getExpense, fetchCategories])

  // Preencher automaticamente a data de pagamento quando o status mudar para "Pago"
  useEffect(() => {
    if (formData.paymentStatus === 'paid' && !formData.paidAt) {
      setFormData(prev => ({ ...prev, paidAt: getTodayString() }))
    }
  }, [formData.paymentStatus])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const category = categories.find(c => c.id === formData.categoryId)
      if (!category) {
        show('Selecione uma categoria válida', 'warning')
        setLoading(false)
        return
      }

      const expenseData = {
        categoryId: formData.categoryId,
        categoryName: category.name,
        description: formData.description,
        amount: parseCurrency(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        dueDate: formData.dueDate ? normalizeDateString(formData.dueDate) : undefined,
        paidAt: formData.paymentStatus === 'paid'
          ? normalizeDateString(formData.paidAt || getTodayString())
          : (formData.paidAt ? normalizeDateString(formData.paidAt) : undefined),
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringDay: formData.isRecurring ? formData.recurringDay : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? normalizeDateString(formData.recurringEndDate) : undefined,
        notes: formData.notes || undefined
      }

      if (isEditing && id) {
        await updateExpense(id, expenseData)
        show('Despesa atualizada com sucesso!', 'success')
      } else {
        await addExpense(expenseData)
        show('Despesa registrada com sucesso!', 'success')
      }

      navigate('/app/despesas')
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      show('Erro ao salvar despesa. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => navigate('/app/despesas')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Despesas
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Receipt size={32} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
              </h1>
              <p className="text-gray-400">
                {isEditing ? 'Atualize as informações da despesa' : 'Registre uma nova despesa'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 border border-gray-700/50 rounded-2xl p-8 space-y-6">
        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Tag size={16} className="inline mr-2" />
            Categoria *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Selecione uma categoria</option>
            {categories.filter(c => c.isActive).map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descrição *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Ex: Aluguel Janeiro 2025, Conta de Luz"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <DollarSign size={16} className="inline mr-2" />
            Valor *
          </label>
          <input
            type="text"
            value={formData.amount}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              const formatted = formatCurrency(parseFloat(value) / 100)
              setFormData({ ...formData, amount: formatted })
            }}
            required
            placeholder="R$ 0,00"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Método de Pagamento *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
            required
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          >
            <option value="cash">Dinheiro</option>
            <option value="card">Cartão</option>
            <option value="pix">PIX</option>
            <option value="transfer">Transferência</option>
            <option value="check">Cheque</option>
          </select>
        </div>

        {/* Status de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status de Pagamento *
          </label>
          <select
            value={formData.paymentStatus}
            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
            required
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          >
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Vencido</option>
          </select>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Data de Pagamento {formData.paymentStatus === 'paid' && '*'}
            </label>
            <input
              type="date"
              value={formData.paidAt}
              onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
              required={formData.paymentStatus === 'paid'}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>

        {/* Despesa Recorrente */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-300">
              <Repeat size={16} className="inline mr-2" />
              Despesa Recorrente
            </label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-red-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frequência
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.recurringFrequency === 'monthly' ? 31 : 7}
                    value={formData.recurringDay}
                    onChange={(e) => setFormData({ ...formData, recurringDay: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.recurringFrequency === 'monthly' ? 'Dia do mês (1-31)' : 'Dia da semana (0-6)'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Término (opcional)
                </label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Observações adicionais sobre esta despesa"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/app/despesas')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="inline mr-2" />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Despesa' : 'Registrar Despesa'}
          </button>
        </div>
      </form>
    </div>
  )
}
