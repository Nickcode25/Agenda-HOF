import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { parseCurrency, formatCurrency } from '@/utils/currency'
import { normalizeDateString, getTodayString } from '@/utils/dateHelpers'
import { Receipt, Save, Calendar, DollarSign, Tag, Repeat } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/app" className="hover:text-red-600 transition-colors">Início</Link>
            <span>›</span>
            <Link to="/app/despesas" className="hover:text-red-600 transition-colors">Despesas</Link>
            <span>›</span>
            <span className="text-gray-900">{isEditing ? 'Editar' : 'Nova Despesa'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
              <Receipt size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações da despesa' : 'Registre uma nova despesa'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag size={16} className="inline mr-2" />
            Categoria *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          >
            <option value="">Selecione uma categoria</option>
            {categories.filter(c => c.isActive).map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Ex: Aluguel Janeiro 2025, Conta de Luz"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pagamento *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
            required
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status de Pagamento *
          </label>
          <select
            value={formData.paymentStatus}
            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
            required
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          >
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Vencido</option>
          </select>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Data de Pagamento {formData.paymentStatus === 'paid' && '*'}
            </label>
            <input
              type="date"
              value={formData.paidAt}
              onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
              required={formData.paymentStatus === 'paid'}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>
        </div>

        {/* Despesa Recorrente */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
              <Repeat size={16} className="inline mr-2" />
              Despesa Recorrente
            </label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-red-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequência
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency })}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.recurringFrequency === 'monthly' ? 31 : 7}
                    value={formData.recurringDay}
                    onChange={(e) => setFormData({ ...formData, recurringDay: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.recurringFrequency === 'monthly' ? 'Dia do mês (1-31)' : 'Dia da semana (0-6)'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término (opcional)
                </label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Observações adicionais sobre esta despesa"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/app/despesas')}
            className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="inline mr-2" />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Despesa' : 'Registrar Despesa'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
