import { Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { useMemo, useState } from 'react'
import { Search, UserPlus, Stethoscope, Phone, Mail, Award, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ProfessionalsList() {
  const { professionals, toggleActive } = useProfessionals(s => ({ professionals: s.professionals, toggleActive: s.toggleActive }))
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return professionals
    return professionals.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.specialty.toLowerCase().includes(query) ||
      p.registrationNumber.toLowerCase().includes(query)
    )
  }, [q, professionals])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Profissionais</h1>
          <p className="text-gray-400">Gerencie os profissionais do consultório</p>
        </div>
        <Link
          to="/app/profissionais/novo"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
        >
          <UserPlus size={20} />
          Novo Profissional
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          placeholder="Buscar por nome, especialidade ou registro..." 
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
        />
      </div>

      {/* Professionals Grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum profissional encontrado</h3>
          <p className="text-gray-400 mb-6">Cadastre os profissionais que trabalham no consultório</p>
          <Link
            to="/app/profissionais/novo"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <UserPlus size={18} />
            Cadastrar Profissional
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(prof => (
            <div 
              key={prof.id} 
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="flex items-center gap-4">
                {/* Photo */}
                {prof.photoUrl ? (
                  <img src={prof.photoUrl} className="h-16 w-16 rounded-xl object-cover border-2 border-gray-700" alt={prof.name} />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
                    <Stethoscope size={28} className="text-gray-500" />
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{prof.name}</h3>
                    {!prof.active && (
                      <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Award size={14} className="text-orange-500" />
                      <span>{prof.specialty}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={14} className="text-orange-500" />
                      <span>{prof.registrationNumber}</span>
                    </div>
                    {prof.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-orange-500" />
                        <span>{prof.phone}</span>
                      </div>
                    )}
                    {prof.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-orange-500" />
                        <span>{prof.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(prof.id)}
                    className={`p-2 rounded-lg transition-all ${prof.active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}
                    title={prof.active ? 'Desativar' : 'Ativar'}
                  >
                    {prof.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <Link
                    to={`/profissionais/${prof.id}`}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
