import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useCategories } from '@/store/categories'
import { parseCurrency } from '@/utils/currency'
import { Save, Tag, DollarSign, FileText, Clock } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import SearchableSelect from '@/components/SearchableSelect'

export default function ProcedureForm() {
  const add = useProcedures(s => s.add)
  const procedures = useProcedures(s => s.procedures)
  const error = useProcedures(s => s.error)
  const { getProcedureCategories, fetchCategories } = useCategories()
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories()
  }, [])

  // Obter categorias de procedimentos do banco
  const procedureCategories = getProcedureCategories().map(cat => cat.name)

  // Verificação de duplicação
  const duplicateNameWarning = name.trim().length > 0 && procedures.some(
    p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
  )

  function formatCurrency(val: string) {
    // Remove tudo que não é número
    const numbers = val.replace(/\D/g, '')

    // Converte para centavos
    const cents = Number(numbers) / 100

    // Formata como moeda
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents)
  }

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setValue(formatted)
  }

  function handleCashValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setCashValue(formatted)
  }

  function handleCardValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setCardValue(formatted)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()

    // Validação
    if (duplicateNameWarning) {
      showToast(`Já existe um procedimento cadastrado com o nome "${trimmedName}"`, 'error')
      return
    }

    try {
      const procedureData = {
        name: trimmedName,
        price: value ? parseCurrency(value) : 0,
        cashValue: cashValue ? parseCurrency(cashValue) : undefined,
        cardValue: cardValue ? parseCurrency(cardValue) : undefined,
        description,
        durationMinutes: duration ? Number(duration) : 0,
        category: category || undefined,
        isActive: true,
        stockCategories: category ? [{ category: category, quantityUsed: 1 }] : []
      }

      const id = await add(procedureData)

      if (id) {
        showToast('Procedimento cadastrado com sucesso!', 'success')
        navigate(`/app/procedimentos/${id}`)
      } else {
        const errorMsg = error || 'Erro ao criar procedimento'
        showToast(`Erro: ${errorMsg}`, 'error')
      }
    } catch (error) {
      console.error('Erro ao criar procedimento:', error)
      showToast('Erro ao salvar procedimento: ' + (error as Error).message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Procedimento</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastre um novo procedimento ou serviço</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/procedimentos"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="procedure-form"
              disabled={duplicateNameWarning || !name.trim()}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                duplicateNameWarning || !name.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              Salvar Procedimento
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="procedure-form" onSubmit={onSubmit} className="space-y-4">
          {/* Seção: Informações Básicas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Tag size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-xs text-gray-500">Dados principais do procedimento</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Procedimento <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Botox, Preenchimento Labial..."
                  required
                  className={`w-full bg-gray-50 border ${
                    duplicateNameWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateNameWarning && (
                  <p className="text-xs text-red-500 mt-0.5">Já existe um procedimento com este nome</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <SearchableSelect
                  options={procedureCategories.map(cat => ({
                    value: cat,
                    label: cat
                  }))}
                  value={category}
                  onChange={setCategory}
                  placeholder="Selecione uma categoria"
                />
                <p className="text-xs text-gray-500 mt-0.5">Selecione a categoria do procedimento</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 30, 60, 90..."
                    min="0"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Tempo médio de duração</p>
              </div>
            </div>
          </div>

          {/* Seção: Valores */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Valores</h3>
                <p className="text-xs text-gray-500">Preços do procedimento</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor à Vista</label>
                <input
                  value={value}
                  onChange={handleValueChange}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Valor principal (à vista)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor com Desconto</label>
                <input
                  value={cashValue}
                  onChange={handleCashValueChange}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Desconto especial (opcional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Parcelado</label>
                <input
                  value={cardValue}
                  onChange={handleCardValueChange}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Pagamento parcelado (opcional)</p>
              </div>
            </div>
          </div>

          {/* Seção: Descrição */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Descrição</h3>
                <p className="text-xs text-gray-500">Detalhes do procedimento</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Procedimento</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o procedimento, indicações, contraindicações..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-0.5">Opcional - informações detalhadas sobre o procedimento</p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to="/app/procedimentos"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={duplicateNameWarning || !name.trim()}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  duplicateNameWarning || !name.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                Salvar Procedimento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
