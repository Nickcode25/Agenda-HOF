import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { PlannedMentorship } from '@/types/student'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Clock, ArrowLeft, Phone, GraduationCap, ChevronDown } from 'lucide-react'
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
      <div className="text-center py-12">
        <p className="text-gray-400">Aluno não encontrado</p>
        <Link to="/app/alunos" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
          Voltar para lista de alunos
        </Link>
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

    // Calcular o valor total a partir do customValue
    let totalValue: number
    if (customValue) {
      const cleanValue = customValue.replace(/[R$\s.]/g, '').replace(',', '.')
      totalValue = parseFloat(cleanValue) || 0
    } else {
      totalValue = 0
    }

    // Validar se o valor foi informado
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

    // Registrar no caixa imediatamente ao adicionar
    let paymentInfo = ''
    if (paymentMethod === 'cash') {
      paymentInfo = 'Dinheiro'
    } else if (paymentMethod === 'pix') {
      paymentInfo = 'PIX'
    } else if (paymentMethod === 'card') {
      if (installments > 1) {
        paymentInfo = `Cartão de Crédito ${installments}x`
      } else {
        paymentInfo = 'Cartão de Crédito à vista'
      }
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

    // Não precisa mais registrar no caixa aqui, pois já foi registrado ao adicionar a mentoria

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

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <Link
              to="/app/alunos"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar para Alunos
            </Link>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/30">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <GraduationCap size={40} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{student.name}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {student.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={16} />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.cpf && <span>CPF: {student.cpf}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/app/alunos/${student.id}/editar`}
                  className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/30 transition-all"
                >
                  <Edit size={18} />
                  Editar
                </Link>
                <button
                  onClick={handleRemoveStudent}
                  className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/30 transition-all"
                >
                  <Trash2 size={18} />
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mentorias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mentorias Planejadas */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                <Clock size={20} />
                Mentorias Planejadas
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowMentorshipMenu(!showMentorshipMenu)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-lg shadow-purple-500/30 transition-all"
                >
                  <Plus size={16} />
                  Mentoria
                  <ChevronDown size={16} />
                </button>
                {showMentorshipMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10">
                    <button
                      onClick={() => openMentorshipModal('enrollment')}
                      className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors rounded-t-xl"
                    >
                      Inscrição Mentoria
                    </button>
                    <button
                      onClick={() => openMentorshipModal('mentorship')}
                      className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors rounded-b-xl border-t border-gray-700"
                    >
                      Mentoria
                    </button>
                  </div>
                )}
              </div>
            </div>

            <MentorshipList
              mentorships={pendingMentorships}
              onUpdateStatus={handleUpdateMentorshipStatus}
              onRemove={handleRemoveMentorship}
            />
          </div>

          {/* Mentorias Realizadas */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              Mentorias Realizadas
            </h3>

            <CompletedMentorshipList
              mentorships={completedMentorships}
              onRemove={handleRemoveMentorship}
            />
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
