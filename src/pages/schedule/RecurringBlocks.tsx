import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useRecurring } from '@/store/recurring'
import { DAYS_OF_WEEK } from '@/types/recurring'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { formatTimeInput } from '@/utils/inputFormatters'
import {
  ArrowLeft,
  Plus,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Repeat
} from 'lucide-react'

export default function RecurringBlocks() {
  const { blocks, loading, fetchBlocks, addBlock, updateBlock, removeBlock, toggleBlockActive } = useRecurring()
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  // Estados do formulário
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  useEffect(() => {
    fetchBlocks()
  }, [])

  const resetForm = () => {
    setTitle('')
    setStartTime('')
    setEndTime('')
    setSelectedDays([])
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block) {
      setTitle(block.title)
      setStartTime(block.startTime)
      setEndTime(block.endTime)
      setSelectedDays(block.daysOfWeek)
      setEditingId(blockId)
      setShowForm(true)
    }
  }

  const handleDelete = async (blockId: string) => {
    if (await confirm({
      title: 'Remover Bloqueio',
      message: 'Tem certeza que deseja remover este bloqueio recorrente?'
    })) {
      await removeBlock(blockId)
      showToast('Bloqueio removido com sucesso!', 'success')
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showToast('Por favor, informe o título do bloqueio', 'error')
      return
    }

    if (!startTime || !endTime) {
      showToast('Por favor, informe os horários de início e término', 'error')
      return
    }

    if (selectedDays.length === 0) {
      showToast('Por favor, selecione pelo menos um dia da semana', 'error')
      return
    }

    if (editingId) {
      await updateBlock(editingId, {
        title,
        startTime,
        endTime,
        daysOfWeek: selectedDays,
      })
      showToast('Bloqueio atualizado com sucesso!', 'success')
    } else {
      await addBlock({
        title,
        startTime,
        endTime,
        daysOfWeek: selectedDays,
        active: true,
      })
      showToast('Bloqueio criado com sucesso!', 'success')
    }

    resetForm()
  }

  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return 'Todos os dias'
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Segunda a Sexta'
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fim de semana'

    return days
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short)
      .join(', ')
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/app/agenda"
              className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bloqueios Recorrentes</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure horários que se repetem automaticamente na sua agenda
              </p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              Novo Bloqueio
            </button>
          )}
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Bloqueio' : 'Novo Bloqueio Recorrente'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Almoço, Reunião semanal, Intervalo..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                />
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Início <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(formatTimeInput(e.target.value))}
                      maxLength={5}
                      placeholder="HH:MM"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Término <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(formatTimeInput(e.target.value))}
                      maxLength={5}
                      placeholder="HH:MM"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dias da semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da Semana <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                        selectedDays.includes(day.value)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selecione os dias em que este bloqueio deve aparecer
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {editingId ? 'Salvar Alterações' : 'Criar Bloqueio'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Bloqueios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Repeat size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Seus Bloqueios Recorrentes</h2>
            </div>
          </div>

          {loading && blocks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : blocks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum bloqueio configurado
              </h3>
              <p className="text-gray-500 mb-4">
                Crie bloqueios recorrentes para reservar horários automaticamente na sua agenda.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Criar Primeiro Bloqueio
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {blocks.map(block => (
                <div
                  key={block.id}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    !block.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      block.active ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <Clock size={24} className={block.active ? 'text-orange-500' : 'text-gray-400'} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{block.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {block.startTime} - {block.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {getDaysLabel(block.daysOfWeek)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBlockActive(block.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        block.active
                          ? 'text-orange-500 hover:bg-orange-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={block.active ? 'Desativar' : 'Ativar'}
                    >
                      {block.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button
                      onClick={() => handleEdit(block.id)}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dica */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <h4 className="font-medium text-orange-800 mb-1">Como funciona?</h4>
          <p className="text-sm text-orange-700">
            Os bloqueios recorrentes aparecem automaticamente nos dias configurados.
            Se você agendar um paciente em um horário que tem bloqueio recorrente,
            o agendamento prevalece e o bloqueio é "cortado" naquele horário.
          </p>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
