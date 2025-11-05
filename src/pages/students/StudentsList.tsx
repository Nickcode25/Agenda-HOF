import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { GraduationCap, Plus, Search, User, Phone, MapPin } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'

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

  // Calcular total de mentorias por aluno
  const getStudentMentorshipsTotal = (student: typeof students[0]) => {
    if (!student.plannedMentorships) return 0
    return student.plannedMentorships
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.totalValue, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <GraduationCap size={32} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Alunos</h1>
                <p className="text-gray-400">Gerencie os alunos de mentoria</p>
              </div>
            </div>
            <Link
              to="/app/alunos/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40"
            >
              <Plus size={18} />
              Novo Aluno
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar aluno por nome ou CPF..."
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <GraduationCap size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Alunos</p>
                  <p className="text-2xl font-bold text-purple-400">{students.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <User size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ativos</p>
                  <p className="text-2xl font-bold text-green-400">
                    {students.filter(s => s.plannedMentorships && s.plannedMentorships.length > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <GraduationCap size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mentorias Concluídas</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {students.reduce((sum, s) => sum + (s.plannedMentorships?.filter(m => m.status === 'completed').length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando alunos...</div>
      ) : filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <GraduationCap size={40} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {q ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </h3>
            <p className="text-gray-400 mb-6">
              {q ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro aluno para começar'}
            </p>
            {!q && (
              <Link
                to="/app/alunos/novo"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40"
              >
                <Plus size={18} />
                Novo Aluno
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(student => (
            <Link
              key={student.id}
              to={`/app/alunos/${student.id}`}
              className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <GraduationCap size={28} className="text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg mb-1 truncate group-hover:text-purple-400 transition-colors">
                    {student.name}
                  </h3>
                  {student.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                      <Phone size={14} />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.city && (
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin size={14} />
                      <span>{student.city}, {student.state}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mentorships Summary */}
              <div className="pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Mentorias</span>
                  <span className="text-purple-400 font-medium">
                    {student.plannedMentorships?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Concluídas</span>
                  <span className="text-green-400 font-medium">
                    {student.plannedMentorships?.filter(m => m.status === 'completed').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Total Arrecadado</span>
                  <span className="text-blue-400 font-bold">
                    {formatCurrency(getStudentMentorshipsTotal(student))}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
