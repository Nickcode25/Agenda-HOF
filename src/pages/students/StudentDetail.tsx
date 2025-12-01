import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { useEnrollments, Enrollment } from '@/store/enrollments'
import { formatCurrency } from '@/utils/currency'
import { formatDateOnlyBR } from '@/utils/timezone'
import { Edit, Trash2, Plus, Phone, GraduationCap, ChevronDown, Mail, MapPin, Calendar, BookOpen, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import EnrollmentModal from './components/EnrollmentModal'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = useStudents(s => s.students.find(st => st.id === id))
  const remove = useStudents(s => s.remove)
  const { fetchByStudent, add: addEnrollment, update: updateEnrollment, remove: removeEnrollment } = useEnrollments()
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [showCourseMenu, setShowCourseMenu] = useState(false)
  const [courseType, setCourseType] = useState<'enrollment' | 'course'>('enrollment')
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null)

  // Carregar matrículas do aluno
  useEffect(() => {
    const loadEnrollments = async () => {
      if (id) {
        setLoadingEnrollments(true)
        const enrollments = await fetchByStudent(id)
        setStudentEnrollments(enrollments)
        setLoadingEnrollments(false)
      }
    }
    loadEnrollments()
  }, [id, fetchByStudent])

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">Aluno não encontrado</p>
          <Link to="/app/alunos" className="text-orange-600 hover:text-orange-500 font-medium">
            Voltar para lista de alunos
          </Link>
        </div>
      </div>
    )
  }

  const openCourseModal = (type: 'enrollment' | 'course') => {
    setCourseType(type)
    setShowCourseMenu(false)
    setEditingEnrollment(null)
    setShowEnrollmentModal(true)
  }

  const openEditModal = (enrollment: Enrollment) => {
    // Determinar o tipo baseado nas notas
    const type = enrollment.notes?.includes('[Inscrição Curso]') ? 'enrollment' : 'course'
    setCourseType(type)
    setEditingEnrollment(enrollment)
    setShowEnrollmentModal(true)
  }

  const handleSaveEnrollment = async (data: {
    courseId: string
    courseName: string
    coursePrice: number
    enrollmentDate: string
    paymentType: 'cash' | 'installment'
    paymentMethod: 'cash' | 'pix' | 'card'
    installments: number
    amountPaid: number
    notes: string
    courseType: 'enrollment' | 'course'
    paymentSplits?: { method: 'cash' | 'pix' | 'card'; amount: number; installments?: number }[]
  }) => {
    if (!student || !id) return

    // Determinar status do pagamento baseado no valor pago
    let paymentStatus: 'pending' | 'paid' | 'partial' = 'pending'
    if (data.amountPaid > 0) {
      paymentStatus = data.amountPaid >= data.coursePrice ? 'paid' : 'partial'
    }

    const courseTypeName = data.courseType === 'enrollment' ? 'Inscrição Curso' : 'Curso'

    // Construir notas com informações de pagamento
    let notesContent = `[${courseTypeName}]`
    if (data.paymentSplits && data.paymentSplits.length > 0) {
      const paymentMethodNames: Record<string, string> = { cash: 'Dinheiro', pix: 'PIX', card: 'Cartão' }
      const paymentDetails = data.paymentSplits
        .filter(split => split.amount > 0)
        .map(split => {
          const methodName = paymentMethodNames[split.method]
          const installmentInfo = split.method === 'card' && split.installments ? ` ${split.installments}x` : ''
          return `${methodName}${installmentInfo}: R$ ${split.amount.toFixed(2).replace('.', ',')}`
        })
        .join(' | ')
      if (paymentDetails) {
        notesContent += ` [Pagamentos: ${paymentDetails}]`
      }
    }
    if (data.notes) {
      notesContent += ` ${data.notes}`
    }

    if (editingEnrollment) {
      // Atualizar matrícula existente
      const success = await updateEnrollment(editingEnrollment.id, {
        course_id: data.courseId,
        enrollment_date: data.enrollmentDate,
        payment_status: paymentStatus,
        amount_paid: data.amountPaid,
        notes: notesContent
      })

      if (success) {
        const enrollments = await fetchByStudent(id)
        setStudentEnrollments(enrollments)
        setShowEnrollmentModal(false)
        setEditingEnrollment(null)
        showToast(`Matrícula atualizada com sucesso!`, 'success')
      } else {
        showToast('Erro ao atualizar matrícula. Tente novamente.', 'error')
      }
    } else {
      // Adicionar nova matrícula
      const enrollmentId = await addEnrollment({
        student_id: id,
        course_id: data.courseId,
        enrollment_date: data.enrollmentDate,
        payment_status: paymentStatus,
        amount_paid: data.amountPaid,
        notes: notesContent
      })

      if (enrollmentId) {
        const enrollments = await fetchByStudent(id)
        setStudentEnrollments(enrollments)
        setShowEnrollmentModal(false)
        showToast(`Aluno ${data.courseType === 'enrollment' ? 'inscrito' : 'matriculado'} em ${data.courseName}!`, 'success')
      } else {
        showToast('Erro ao matricular aluno. Tente novamente.', 'error')
      }
    }
  }

  const handleRemoveEnrollment = async (enrollmentId: string, courseName: string) => {
    const confirmed = await confirm({
      title: 'Cancelar Matrícula',
      message: `Deseja cancelar a matrícula no curso "${courseName}"?`,
      confirmText: 'Cancelar Matrícula',
      cancelText: 'Voltar'
    })

    if (!confirmed || !id) return

    const success = await removeEnrollment(enrollmentId)
    if (success) {
      const enrollments = await fetchByStudent(id)
      setStudentEnrollments(enrollments)
      showToast('Matrícula cancelada!', 'success')
    } else {
      showToast('Erro ao cancelar matrícula.', 'error')
    }
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

  // Calcular receita total das matrículas
  const totalRevenue = studentEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0)

  // Contar apenas cursos (excluindo inscrições)
  const coursesCount = studentEnrollments.filter(e => !e.notes?.includes('[Inscrição Curso]')).length

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
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Card Principal do Aluno */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Header com Avatar, Nome e Botões */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-orange-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">{getInitials(student.name)}</span>
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Link
                    to={`/app/alunos/${student.id}/editar`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                  >
                    <Edit size={16} />
                    Editar
                  </Link>
                  <button
                    onClick={handleRemoveStudent}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-xl font-medium text-sm transition-colors border border-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Informações e Stats em uma linha */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Informações de Contato */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-orange-500" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-orange-500" />
                      <span>{student.email}</span>
                    </div>
                  )}
                  {student.cpf && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-orange-500" />
                      <span>CPF: {student.cpf}</span>
                    </div>
                  )}
                  {(student.street || student.city) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-orange-500" />
                      <span>{[student.city, student.state].filter(Boolean).join(' - ')}</span>
                    </div>
                  )}
                </div>

                {/* Stats Cards */}
                <div className="flex gap-3">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 flex items-center gap-3">
                    <BookOpen size={18} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Cursos</p>
                      <p className="text-lg font-bold text-orange-600">{coursesCount}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 flex items-center gap-3">
                    <DollarSign size={18} className="text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Receita</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cursos Matriculados */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <BookOpen size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cursos Matriculados</h3>
                    <p className="text-xs text-gray-500">{studentEnrollments.length} curso{studentEnrollments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCourseMenu(!showCourseMenu)}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition-all"
                  >
                    <Plus size={16} />
                    Curso
                    <ChevronDown size={16} />
                  </button>
                  {showCourseMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      <button
                        onClick={() => openCourseModal('enrollment')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                        Inscrição Curso
                      </button>
                      <button
                        onClick={() => openCourseModal('course')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors border-t border-gray-100"
                      >
                        Curso
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingEnrollments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : studentEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} className="text-orange-300" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Nenhum curso matriculado</p>
                  <p className="text-gray-400 text-sm">Clique em "+ Curso" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentEnrollments.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                          <BookOpen size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{enrollment.course_name || 'Curso'}</h4>
                            {enrollment.notes?.includes('[Inscrição Curso]') && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-200">Inscrição</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">{formatDateOnlyBR(enrollment.enrollment_date)}</span>
                            {enrollment.amount_paid && enrollment.amount_paid > 0 && (
                              <span className="text-sm text-green-600 font-semibold">{formatCurrency(enrollment.amount_paid)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(enrollment)}
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Editar matrícula"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.course_name || 'este curso')}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar matrícula"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EnrollmentModal
        show={showEnrollmentModal}
        courseType={courseType}
        enrollment={editingEnrollment}
        onClose={() => {
          setShowEnrollmentModal(false)
          setEditingEnrollment(null)
        }}
        onSubmit={handleSaveEnrollment}
      />

      <ConfirmDialog />
    </>
  )
}
