import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft, FileText, DollarSign, Clock } from 'lucide-react'

export default function ProcedureEdit() {
  const { id } = useParams()
  const { procedures, update, fetchAll } = useProcedures(s => ({ procedures: s.procedures, update: s.update, fetchAll: s.fetchAll }))
  const navigate = useNavigate()

  const procedure = procedures.find(p => p.id === id)

  useEffect(() => {
    fetchAll()
  }, [])

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')

  useEffect(() => {
    if (procedure) {
      setName(procedure.name)
      setDescription(procedure.description || '')
      setDuration(procedure.durationMinutes?.toString() || '')
      setValue(formatCurrency(procedure.price))
      setCashValue(procedure.cashValue ? formatCurrency(procedure.cashValue) : '')
      setCardValue(procedure.cardValue ? formatCurrency(procedure.cardValue) : '')
    }
  }, [procedure])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/procedimentos')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  function formatCurrency(val: string | number) {
    // Se for número (vindo do banco), formata diretamente
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(val)
    }

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

    if (!procedure) return

    await update(procedure.id, {
      name,
      price: value ? parseCurrency(value) : 0,
      cashValue: cashValue ? parseCurrency(cashValue) : undefined,
      cardValue: cardValue ? parseCurrency(cardValue) : undefined,
      description: description || undefined,
      durationMinutes: duration ? Number(duration) : undefined,
    })

    navigate(`/app/procedimentos/${procedure.id}`)
  }

  if (!procedure) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Procedimento não encontrado.</p>
          <Link to="/app/procedimentos" className="text-orange-500 hover:text-orange-600 hover:underline">
            Voltar para lista
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/app/procedimentos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Procedimento</h1>
            <p className="text-sm text-gray-500">Atualize os dados do procedimento</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileText size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-xs text-gray-500">Dados principais do procedimento</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Procedimento *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Botox, Preenchimento Labial..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o procedimento..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Valores</h3>
                <p className="text-xs text-gray-500">Preços do procedimento</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor à Vista</label>
                  <input
                    value={value}
                    onChange={handleValueChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Valor principal (à vista)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor com Desconto</label>
                  <input
                    value={cashValue}
                    onChange={handleCashValueChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Desconto especial (opcional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Parcelado</label>
                  <input
                    value={cardValue}
                    onChange={handleCardValueChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cartão parcelado (opcional)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Duração */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Duração</h3>
                <p className="text-xs text-gray-500">Tempo estimado do procedimento</p>
              </div>
            </div>

            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="Ex: 30, 60, 90..."
                  className="w-full max-w-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
            <Link
              to="/app/procedimentos"
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
