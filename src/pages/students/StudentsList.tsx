import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { GraduationCap, UserPlus, Phone, MapPin, MessageCircle, ChevronRight, CheckSquare, BookOpen } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { PageHeader, SearchInput, EmptyState, StatusBadge } from '@/components/ui'

export default function StudentsList() {
  const { students, loading, fetchAll } = useStudents()
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  // Função para remover acentos
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    // Primeiro, ordenar todos os alunos alfabeticamente
    const sortedStudents = [...students].sort((a, b) => {
      return a.name.localeCompare(b.name, 'pt-BR')
    })

    if (!query) return sortedStudents

    // Filtrar por nome ou CPF
    return sortedStudents.filter(student => {
      const nameMatch = removeAccents(student.name.toLowerCase()).includes(removeAccents(query))
      const cpfMatch = student.cpf?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      return nameMatch || cpfMatch
    })
  }, [students, q])

  // Stats calculations
  const stats = useMemo(() => {
    const total = students.length
    const activeCount = students.filter(s => s.plannedMentorships && s.plannedMentorships.length > 0).length
    const completedMentorships = students.reduce(
      (sum, s) => sum + (s.plannedMentorships?.filter(m => m.status === 'completed').length || 0),
      0
    )

    return { total, activeCount, completedMentorships }
  }, [students])

  // Calcular total de mentorias por aluno
  const getStudentMentorshipsTotal = (student: typeof students[0]) => {
    if (!student.plannedMentorships) return 0
    return student.plannedMentorships
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.totalValue, 0)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6">
      {/* Header */}
      <PageHeader
        icon={GraduationCap}
        title="Alunos"
        subtitle="Gerencie os alunos de mentoria"
        stats={[
          { label: 'Total de Alunos', value: stats.total, icon: GraduationCap, color: 'text-orange-500' },
          { label: 'Alunos Ativos', value: stats.activeCount, icon: CheckSquare, color: 'text-green-500' },
          { label: 'Mentorias Concluídas', value: stats.completedMentorships, icon: BookOpen, color: 'text-blue-500' }
        ]}
        primaryAction={{
          label: 'Novo Aluno',
          icon: UserPlus,
          href: '/app/alunos/novo',
          className: 'bg-orange-500 hover:bg-orange-600'
        }}
      />

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar aluno por nome ou CPF..."
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando alunos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={q ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          description={q ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro aluno para começar'}
          action={
            !q
              ? {
                  label: 'Novo Aluno',
                  icon: UserPlus,
                  href: '/app/alunos/novo',
                  className: 'bg-orange-500 hover:bg-orange-600'
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 px-1">
            {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(student => {
              const pendingCount = student.plannedMentorships?.filter(m => m.status === 'pending').length || 0
              const inProgressCount = student.plannedMentorships?.filter(m => m.status === 'in_progress').length || 0
              const completedCount = student.plannedMentorships?.filter(m => m.status === 'completed').length || 0

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all group"
                >
                  <Link to={`/app/alunos/${student.id}`} className="block p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.name}
                          className="h-14 w-14 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{getInitials(student.name)}</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                            {student.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pendingCount > 0 && (
                            <StatusBadge label={`${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`} variant="warning" />
                          )}
                          {inProgressCount > 0 && (
                            <StatusBadge label={`${inProgressCount} em andamento`} variant="info" />
                          )}
                          {completedCount > 0 && (
                            <StatusBadge label={`${completedCount} concluída${completedCount > 1 ? 's' : ''}`} variant="success" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={14} className="text-orange-500" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.city && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-orange-500" />
                              <span>
                                {student.city}, {student.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </Link>

                  {/* Footer with stats and actions */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-500">Total arrecadado: </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(getStudentMentorshipsTotal(student))}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {student.phone && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleWhatsApp(student.phone)
                            }}
                            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Enviar mensagem no WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
