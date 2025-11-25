import { useState, useMemo, useEffect } from 'react'
import { Plus, Phone, Users, MessageCircle, FileText, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { getWhatsAppUrl } from '@/utils/env'
import { useToast } from '@/hooks/useToast'

export default function MobilePatients() {
  const patients = usePatients(s => s.patients)
  const fetchPatients = usePatients(s => s.fetchAll)
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Remove accents for search
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    // Sort alphabetically
    const sortedPatients = [...patients].sort((a, b) => {
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    })

    if (!query) {
      return sortedPatients
    }

    const normalizedQuery = removeAccents(query)

    return sortedPatients.filter(p => {
      const normalizedName = removeAccents(p.name.toLowerCase())

      // Search by name words
      const nameWords = normalizedName.split(' ')
      const matchesNameWord = nameWords.some(word => word.startsWith(normalizedQuery))
      const matchName = matchesNameWord || normalizedName.startsWith(normalizedQuery)

      // Search by CPF/phone if query has numbers
      const normalizedQueryCpf = query.replace(/\D/g, '')
      let matchCpf = false
      let matchPhone = false

      if (normalizedQueryCpf.length > 0) {
        const normalizedCpf = p.cpf.replace(/\D/g, '')
        matchCpf = normalizedCpf.includes(normalizedQueryCpf)
        matchPhone = p.phone ? p.phone.replace(/\D/g, '').includes(normalizedQueryCpf) : false
      }

      return matchName || matchCpf || matchPhone
    })
  }, [searchQuery, patients])

  const handleWhatsApp = (patientPhone?: string) => {
    if (!patientPhone) {
      showToast('Paciente não possui telefone cadastrado', 'warning')
      return
    }

    window.open(getWhatsAppUrl(patientPhone), '_blank')
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
    <div className="p-4 space-y-4 pb-20 bg-gray-50 min-h-screen">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-2 text-sm text-gray-500">
          {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} encontrado{filteredPatients.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => navigate('/app/pacientes/novo')}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Plus size={24} />
        <span>Novo Paciente</span>
      </button>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro paciente'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/app/pacientes/novo')}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={18} />
              Cadastrar Paciente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map(patient => {
            const proceduresCount = patient.plannedProcedures?.length || 0
            const pendingCount = patient.plannedProcedures?.filter(p => p.status === 'pending').length || 0

            return (
              <div
                key={patient.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  onClick={() => navigate(`/app/pacientes/${patient.id}`)}
                  className="p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Avatar */}
                    {patient.photoUrl ? (
                      <img
                        src={patient.photoUrl}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-100"
                        alt={patient.name}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-base">{getInitials(patient.name)}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                        {patient.name}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FileText size={14} className="text-orange-500 flex-shrink-0" />
                          <span className="truncate">{patient.cpf}</span>
                        </div>

                        {patient.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone size={14} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Procedures Info */}
                  {proceduresCount > 0 && (
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-md font-medium">
                        {proceduresCount} procedimento{proceduresCount !== 1 ? 's' : ''}
                      </span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-xs rounded-md font-medium">
                          {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* WhatsApp Button */}
                  {patient.phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleWhatsApp(patient.phone)
                      }}
                      className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <MessageCircle size={18} />
                      <span>Enviar mensagem no WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
