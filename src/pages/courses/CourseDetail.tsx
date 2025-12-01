import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCourses } from '@/store/courses'
import { useEnrollments } from '@/store/enrollments'
import { formatCurrency } from '@/utils/currency'
import { formatDateOnlyBR } from '@/utils/timezone'
import {
  Edit,
  Trash2,
  BookOpen,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  GraduationCap
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

interface EnrollmentWithStudent {
  id: string
  student_id: string
  student_name: string
  student_phone?: string
  enrollment_date: string
  payment_status: string
  amount_paid?: number
  notes?: string
}

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { courses, fetchAll: fetchCourses, fetched: coursesFetched, remove, loading } = useCourses()
  const { fetchByCourse } = useEnrollments()
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [courseEnrollments, setCourseEnrollments] = useState<EnrollmentWithStudent[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)

  const course = courses.find(c => c.id === id)

  useEffect(() => {
    if (!coursesFetched) {
      fetchCourses()
    }
  }, [coursesFetched, fetchCourses])

  useEffect(() => {
    const loadEnrollments = async () => {
      if (id) {
        setLoadingEnrollments(true)
        const enrollments = await fetchByCourse(id)

        // Mapear matrículas com dados dos alunos
        const enrollmentsWithStudents = enrollments.map((e: any) => {
          return {
            id: e.id,
            student_id: e.student_id,
            student_name: e.student_name || 'Aluno não encontrado',
            student_phone: e.student_phone,
            enrollment_date: e.enrollment_date,
            payment_status: e.payment_status,
            amount_paid: e.amount_paid,
            notes: e.notes
          }
        })

        setCourseEnrollments(enrollmentsWithStudents)
        setLoadingEnrollments(false)
      }
    }

    loadEnrollments()
  }, [id, fetchByCourse])

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">Curso não encontrado</p>
            <Link to="/app/cursos" className="text-orange-600 hover:text-orange-500 font-medium">
              Voltar para lista de cursos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleRemoveCourse = async () => {
    const confirmed = await confirm({
      title: 'Excluir Curso',
      message: `Tem certeza que deseja excluir o curso "${course.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      confirmButtonClass: 'bg-red-500 hover:bg-red-600'
    })

    if (confirmed) {
      const success = await remove(course.id)
      if (success) {
        showToast('Curso excluído com sucesso!', 'success')
        navigate('/app/cursos')
      } else {
        showToast('Erro ao excluir curso. Tente novamente.', 'error')
      }
    }
  }

  // Calcular estatísticas
  const totalStudents = courseEnrollments.length
  const totalRevenue = courseEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0)
  const paidCount = courseEnrollments.filter(e => e.payment_status === 'paid').length
  const pendingCount = courseEnrollments.filter(e => e.payment_status === 'pending' || e.payment_status === 'partial').length

  const getPaymentStatusBadge = (status: string, notes?: string) => {
    // Se for uma inscrição, mostrar badge de inscrição
    if (notes?.includes('[Inscrição Curso]')) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Inscrição</span>
    }

    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Pago</span>
      case 'partial':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Parcial</span>
      case 'pending':
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Pendente</span>
    }
  }

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
          {/* Card Principal do Curso */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Header com Ícone, Nome e Botões */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <BookOpen size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
                    {course.description && (
                      <p className="text-gray-500 mt-1">{course.description}</p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Link
                    to={`/app/cursos/${course.id}/editar`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                  >
                    <Edit size={16} />
                    Editar
                  </Link>
                  <button
                    onClick={handleRemoveCourse}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-xl font-medium text-sm transition-colors border border-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Informações do Curso */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                {course.duration_hours && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-orange-500" />
                    <span>{course.duration_hours}h de duração</span>
                  </div>
                )}
                {course.price && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={14} className="text-orange-500" />
                    <span>Valor: {formatCurrency(course.price)}</span>
                  </div>
                )}
                {course.max_students && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-orange-500" />
                    <span>Máx. {course.max_students} alunos</span>
                  </div>
                )}
                {course.start_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-orange-500" />
                    <span>Início: {formatDateOnlyBR(course.start_date)}</span>
                  </div>
                )}
                {course.end_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-orange-500" />
                    <span>Término: {formatDateOnlyBR(course.end_date)}</span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Alunos</p>
                      <p className="text-xl font-bold text-orange-600">
                        {totalStudents}
                        {course.max_students && <span className="text-sm font-normal text-gray-400">/{course.max_students}</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Faturamento</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <GraduationCap size={20} className="text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Pagos</p>
                      <p className="text-xl font-bold text-blue-600">{paidCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-500">Pendentes</p>
                      <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Alunos Matriculados */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Users size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Alunos Matriculados</h2>
                    <p className="text-xs text-gray-500">{totalStudents} aluno{totalStudents !== 1 ? 's' : ''} neste curso</p>
                  </div>
                </div>
              </div>

              {loadingEnrollments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : courseEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">Nenhum aluno matriculado</p>
                  <p className="text-sm text-gray-400">Os alunos matriculados aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courseEnrollments.map(enrollment => (
                    <Link
                      key={enrollment.id}
                      to={`/app/alunos/${enrollment.student_id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-orange-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{getInitials(enrollment.student_name)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                            {enrollment.student_name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            {enrollment.student_phone && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone size={12} />
                                {enrollment.student_phone}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Matrícula: {formatDateOnlyBR(enrollment.enrollment_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {enrollment.amount_paid && enrollment.amount_paid > 0 && (
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(enrollment.amount_paid)}
                          </span>
                        )}
                        {getPaymentStatusBadge(enrollment.payment_status, enrollment.notes)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observações do Curso */}
          {course.notes && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{course.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog />
    </>
  )
}
