import { useEffect, useMemo, memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Users, Clock, ChevronRight, DollarSign, TrendingUp } from 'lucide-react'
import { PageHeader, SearchInput, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/utils/currency'
import { useCourses } from '@/store/courses'
import { useEnrollments } from '@/store/enrollments'
import { useSubscription, FEATURE_REQUIRED_PLAN } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'

// Skeleton loader
const CourseSkeleton = memo(() => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-100 rounded" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-5 w-5 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
))

export default function CoursesList() {
  const { courses, loading, fetched, fetchAll } = useCourses()
  const { enrollments, fetchAll: fetchEnrollments, fetched: enrollmentsFetched } = useEnrollments()
  const { hasFeature, planType } = useSubscription()
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchAll()
    if (!enrollmentsFetched) {
      fetchEnrollments()
    }
  }, [fetchAll, fetchEnrollments, enrollmentsFetched])

  const isInitialLoading = loading && !fetched

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const sortedCourses = [...courses].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (!query) return sortedCourses
    return sortedCourses.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    )
  }, [courses, q])

  // Calcular estatísticas com base em matrículas
  const stats = useMemo(() => {
    const total = courses.length

    // Total de alunos matriculados (apenas cursos, não inscrições)
    const totalStudents = enrollments.filter(e => !e.notes?.includes('[Inscrição Curso]')).length

    // Faturamento total (soma de todos os pagamentos)
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0)

    return { total, totalStudents, totalRevenue }
  }, [courses, enrollments])

  // Calcular alunos por curso
  const getStudentCountByCourse = (courseId: string) => {
    return enrollments.filter(e => e.course_id === courseId && !e.notes?.includes('[Inscrição Curso]')).length
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
      {/* Overlay de bloqueio se não tiver acesso à funcionalidade */}
      {!hasFeature('courses') && <UpgradeOverlay message="Cursos bloqueados" feature="o cadastro e gestão de cursos" requiredPlan={FEATURE_REQUIRED_PLAN['courses']} currentPlan={planType} />}

      {/* Header */}
      <PageHeader
        icon={BookOpen}
        title="Cursos"
        subtitle="Gerencie os cursos e treinamentos"
        stats={[
          { label: 'Total de Cursos', value: stats.total, icon: BookOpen, color: 'text-orange-500' },
          { label: 'Alunos Matriculados', value: stats.totalStudents, icon: Users, color: 'text-blue-500' },
          { label: 'Faturamento', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-green-500' }
        ]}
        primaryAction={{
          label: 'Novo Curso',
          icon: Plus,
          href: '/app/cursos/novo',
          className: 'bg-orange-500 hover:bg-orange-600'
        }}
      />

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar curso por nome ou descrição..."
        />
      </div>

      {/* Courses List */}
      {isInitialLoading ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 px-1 animate-pulse">Carregando cursos...</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={q ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
          description={q ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro curso para começar a organizar os treinamentos'}
          action={
            !q
              ? {
                  label: 'Novo Curso',
                  icon: Plus,
                  href: '/app/cursos/novo',
                  className: 'bg-orange-500 hover:bg-orange-600'
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all group"
                >
                  <Link to={`/app/cursos/${course.id}`} className="block p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={24} className="text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                            {course.name}
                          </h3>
                        </div>

                        {course.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {course.description}
                          </p>
                        )}

                        {course.duration_hours && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200 flex items-center gap-1">
                              <Clock size={12} />
                              {course.duration_hours}h
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronRight size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </Link>

                  {/* Footer with stats */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users size={14} className="text-orange-500" />
                        <span>{getStudentCountByCourse(course.id)}/{course.max_students || '∞'} alunos</span>
                      </div>
                      {course.price && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign size={14} />
                          {formatCurrency(course.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}
