import { Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMemo, useState } from 'react'
import { Search, UserPlus, Users as UsersIcon, Phone, FileText } from 'lucide-react'

export default function PatientsList() {
  const patients = usePatients(s => s.patients)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return patients
    return patients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.cpf.replace(/\D/g,'').includes(query.replace(/\D/g,''))
    )
  }, [q, patients])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Pacientes</h1>
          <p className="text-gray-400">Gerencie o cadastro de pacientes</p>
        </div>
        <Link 
          to="/pacientes/novo" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
        >
          <UserPlus size={20} />
          Novo Paciente
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          placeholder="Buscar por nome ou CPF..." 
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
        />
      </div>

      {/* Patients Grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum paciente encontrado</h3>
          <p className="text-gray-400 mb-6">Tente ajustar sua busca ou cadastre um novo paciente</p>
          <Link 
            to="/pacientes/novo" 
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <UserPlus size={18} />
            Cadastrar Paciente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(p => (
            <Link 
              key={p.id} 
              to={`/pacientes/${p.id}`}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 group"
            >
              <div className="flex items-center gap-4">
                {/* Photo */}
                {p.photoUrl ? (
                  <img src={p.photoUrl} className="h-16 w-16 rounded-xl object-cover border-2 border-gray-700 group-hover:border-orange-500/50 transition-colors" alt={p.name} />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700 group-hover:border-orange-500/50 transition-colors">
                    <UsersIcon size={28} className="text-gray-500" />
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">{p.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-orange-500" />
                      <span>{p.cpf}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-orange-500" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-gray-600 group-hover:text-orange-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
