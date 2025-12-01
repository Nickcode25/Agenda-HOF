import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useCourses } from '@/store/courses'
import { Save, BookOpen, DollarSign, Users, FileText, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const amount = parseInt(numbers || '0', 10) / 100
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrencyToNumber(value: string): number {
  const numbers = value.replace(/\D/g, '')
  return parseInt(numbers || '0', 10) / 100
}

export default function CourseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { add, update, loading, courses, fetchAll, fetched } = useCourses()
  const { show: showToast } = useToast()

  const isEditing = Boolean(id)
  const existingCourse = id ? courses.find(c => c.id === id) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [maxStudents, setMaxStudents] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!fetched) {
      fetchAll()
    }
  }, [fetched, fetchAll])

  useEffect(() => {
    if (isEditing && existingCourse) {
      setName(existingCourse.name)
      setDescription(existingCourse.description || '')
      setPrice(existingCourse.price ? formatCurrencyInput((existingCourse.price * 100).toString()) : '')
      setMaxStudents(existingCourse.max_students?.toString() || '')
      setNotes(existingCourse.notes || '')
    }
  }, [isEditing, existingCourse])

  // Verificação de duplicação
  const duplicateNameWarning = name.trim().length > 0 && courses.some(
    c => c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.id !== id
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()

    if (duplicateNameWarning) {
      showToast(`Já existe um curso cadastrado com o nome "${trimmedName}"`, 'error')
      return
    }

    const courseData = {
      name: trimmedName,
      description: description.trim() || undefined,
      price: price ? parseCurrencyToNumber(price) : undefined,
      max_students: maxStudents ? parseInt(maxStudents, 10) : undefined,
      notes: notes.trim() || undefined
    }

    if (isEditing && id) {
      const success = await update(id, courseData)
      if (success) {
        showToast('Curso atualizado com sucesso!', 'success')
        navigate(`/app/cursos`)
      } else {
        showToast('Erro ao atualizar curso. Tente novamente.', 'error')
      }
    } else {
      const newId = await add(courseData)
      if (newId) {
        showToast('Curso cadastrado com sucesso!', 'success')
        navigate(`/app/cursos`)
      } else {
        showToast('Erro ao cadastrar curso. Tente novamente.', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/app/cursos"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editar Curso' : 'Novo Curso'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Atualize as informações do curso' : 'Cadastre um novo curso ou treinamento'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/cursos"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="course-form"
              disabled={loading || !name.trim() || duplicateNameWarning}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                loading || !name.trim() || duplicateNameWarning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Curso'}
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="course-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Seção: Informações Básicas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <BookOpen size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-xs text-gray-500">Dados principais do curso</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Curso <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Curso de Harmonização Facial"
                  required
                  className={`w-full bg-gray-50 border ${
                    duplicateNameWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateNameWarning ? (
                  <p className="text-xs text-red-500 mt-0.5">Já existe um curso com este nome</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Nome que identifica o curso</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo e objetivos do curso..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional - descrição detalhada do curso</p>
              </div>
            </div>
          </div>

          {/* Seção: Valores e Vagas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Valores e Vagas</h3>
                <p className="text-xs text-gray-500">Informações financeiras e de capacidade</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={14} className="inline mr-1" />
                  Valor do Curso (R$)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional - valor de investimento</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users size={14} className="inline mr-1" />
                  Máximo de Alunos
                </label>
                <input
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  placeholder="Ex: 20"
                  min="1"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional - limite de vagas</p>
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Observações</h3>
                <p className="text-xs text-gray-500">Informações adicionais</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o curso..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-0.5">Opcional - informações internas</p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-4xl mx-auto">
              <Link
                to="/app/cursos"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim() || duplicateNameWarning}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  loading || !name.trim() || duplicateNameWarning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Curso'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
