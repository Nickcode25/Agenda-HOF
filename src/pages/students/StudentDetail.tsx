import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { PlannedMentorship } from '@/types/student'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Clock, ArrowLeft, Phone, GraduationCap, ChevronDown, Mail, MapPin, Calendar, BookOpen, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import MentorshipModal from './components/MentorshipModal'
import MentorshipList from './components/MentorshipList'
import CompletedMentorshipList from './components/CompletedMentorshipList'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = useStudents(s => s.students.find(st => st.id === id))
  const update = useStudents(s => s.update)
  const remove = useStudents(s => s.remove)
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showMentorshipModal, setShowMentorshipModal] = useState(false)
  const [showMentorshipMenu, setShowMentorshipMenu] = useState(false)
  const [mentorshipType, setMentorshipType] = useState<'enrollment' | 'mentorship'>('enrollment')
  const [mentorshipNotes, setMentorshipNotes] = useState('')
  const [mentorshipQuantity, setMentorshipQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card'>('cash')
  const [installments, setInstallments] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [isEditingValue, setIsEditingValue] = useState(false)

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">Aluno não encontrado</p>
          <Link to="/app/alunos" className="text-purple-600 hover:text-purple-500 font-medium">
            Voltar para lista de alunos
          </Link>
        </div>
      </div>
    )
  }

  const openMentorshipModal = (type: 'enrollment' | 'mentorship') => {
    setMentorshipType(type)
    setShowMentorshipMenu(false)
    setShowMentorshipModal(true)
  }

  const resetMentorshipModal = () => {
    setMentorshipNotes('')
    setMentorshipQuantity(1)
    setPaymentType('cash')
    setPaymentMethod('cash')
    setInstallments(1)
    setCustomValue('')
    setIsEditingValue(false)
    setShowMentorshipModal(false)
  }

  const handleAddMentorship = async () => {
    if (!student) return

    let totalValue: number
    if (customValue) {
      const cleanValue = customValue.replace(/[R$\s.]/g, '').replace(',', '.')
      totalValue = parseFloat(cleanValue) || 0
    } else {
      totalValue = 0
    }

    if (totalValue <= 0) {
      showToast('Informe o valor da mentoria', 'error')
      return
    }

    const newPlannedMentorship: PlannedMentorship = {
      id: crypto.randomUUID(),
      mentorshipName: mentorshipType === 'enrollment' ? 'Inscrição Mentoria' : 'Mentoria',
      quantity: mentorshipQuantity,
      unitValue: totalValue,
      totalValue,
      paymentType,
      paymentMethod,
      installments,
      status: 'pending',
      notes: mentorshipNotes,
      createdAt: new Date().toISOString()
    }

    const currentPlanned = student.plannedMentorships || []
    update(student.id, {
      plannedMentorships: [...currentPlanned, newPlannedMentorship]
    })

    resetMentorshipModal()
    showToast('Mentoria adicionada com sucesso!', 'success')
  }

  const handleUpdateMentorshipStatus = async (mentId: string, status: PlannedMentorship['status']) => {
    if (!student) return

    const mentorship = student.plannedMentorships?.find(m => m.id === mentId)
    if (!mentorship) return

    const updated = (student.plannedMentorships || []).map(m =>
      m.id === mentId ? { ...m, status, completedAt: status === 'completed' ? new Date().toISOString() : m.completedAt } : m
    )

    update(student.id, { plannedMentorships: updated })
    showToast(`Mentoria marcada como ${status === 'completed' ? 'realizada' : status === 'in_progress' ? 'em andamento' : 'pendente'}!`, 'success')
  }

  const handleRemoveMentorship = async (mentId: string) => {
    if (!student) return

    const mentorship = student.plannedMentorships?.find(m => m.id === mentId)
    if (!mentorship) return

    const confirmed = await confirm({
      title: 'Remover Mentoria',
      message: 'Remover esta mentoria do planejamento?',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    const updated = (student.plannedMentorships || []).filter(m => m.id !== mentId)
    update(student.id, { plannedMentorships: updated })
    showToast('Mentoria removida!', 'success')
  }

  const handleRemoveStudent = async () => {
    const confirmed = await confirm({
      title: 'Remover Aluno',
      message: `Tem certeza que deseja remover ${student?.name}? Esta ação não pode ser desfeita.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (confirmed && id) {
      try {
        await remove(id)
        showToast('Aluno removido com sucesso!', 'success')
        navigate('/app/alunos', { replace: true })
      } catch (error) {
        console.error('Erro ao remover aluno:', error)
        showToast('Erro ao remover aluno. Tente novamente.', 'error')
      }
    }
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setIsEditingValue(true)
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') {
      setCustomValue('')
      return
    }
    const numberValue = parseFloat(numbers) / 100
    setCustomValue(formatCurrency(numberValue))
  }

  const allMentorships = student.plannedMentorships || []
  const pendingMentorships = allMentorships.filter(m => m.status !== 'completed')
  const completedMentorships = allMentorships.filter(m => m.status === 'completed')
  const totalRevenue = completedMentorships.reduce((sum, m) => sum + m.totalValue, 0)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/alunos"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar</span>
          </Link>

          <div className="flex gap-2">
            <Link
              to={`/app/alunos/${student.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              <Edit size={18} />
              Editar
            </Link>
            <button
              onClick={handleRemoveStudent}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-xl font-medium transition-colors border border-red-200"
            >
              <Trash2 size={18} />
              Remover
            </button>
          </div>
        </div>

        {/* Card do Aluno */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Barra de status */}
          <div className="h-1.5 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"></div>

          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl object-cover border-2 border-purple-200"
                  />
                ) : (
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-200 flex items-center justify-center">
                    <span className="text-3xl lg:text-4xl font-bold text-purple-600">{getInitials(student.name)}</span>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{student.name}</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {student.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={16} className="text-gray-400" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={16} className="text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.cpf && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>CPF: {student.cpf}</span>
                    </div>
                  )}
                  {(student.street || student.city) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="truncate">
                        {[student.street, student.number, student.neighborhood, student.city, student.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:w-48">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BookOpen size={16} className="text-purple-500" />
                    <span className="text-sm text-gray-600">Mentorias</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{completedMentorships.length}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="text-sm text-gray-600">Receita</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mentorias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mentorias Planejadas */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white border border-purple-200 rounded-lg shadow-sm">
                    <Clock size={18} className="text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Mentorias Planejadas</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMentorshipMenu(!showMentorshipMenu)}
                    className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition-all"
                  >
                    <Plus size={16} />
                    Mentoria
                    <ChevronDown size={16} />
                  </button>
                  {showMentorshipMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      <button
                        onClick={() => openMentorshipModal('enrollment')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Inscrição Mentoria
                      </button>
                      <button
                        onClick={() => openMentorshipModal('mentorship')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                      >
                        Mentoria
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <MentorshipList
                mentorships={pendingMentorships}
                onUpdateStatus={handleUpdateMentorshipStatus}
                onRemove={handleRemoveMentorship}
              />
            </div>
          </div>

          {/* Mentorias Realizadas */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white border border-green-200 rounded-lg shadow-sm">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Mentorias Realizadas</h3>
              </div>
            </div>

            <div className="p-6">
              <CompletedMentorshipList
                mentorships={completedMentorships}
                onRemove={handleRemoveMentorship}
              />
            </div>
          </div>
        </div>
      </div>

      <MentorshipModal
        show={showMentorshipModal}
        mentorshipType={mentorshipType}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        installments={installments}
        setInstallments={setInstallments}
        mentorshipQuantity={mentorshipQuantity}
        customValue={customValue}
        isEditingValue={isEditingValue}
        setIsEditingValue={setIsEditingValue}
        setCustomValue={setCustomValue}
        handleCustomValueChange={handleCustomValueChange}
        mentorshipNotes={mentorshipNotes}
        setMentorshipNotes={setMentorshipNotes}
        onClose={resetMentorshipModal}
        onSubmit={handleAddMentorship}
      />

      <ConfirmDialog />
    </>
  )
}
