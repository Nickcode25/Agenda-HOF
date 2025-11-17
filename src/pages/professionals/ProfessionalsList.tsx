import { Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { useMemo, useState, useEffect } from 'react'
import { Search, UserPlus, Stethoscope, Phone, Mail, Award, ToggleLeft, ToggleRight } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'

export default function ProfessionalsList() {
  const { professionals, toggleActive, fetchAll, loading } = useProfessionals(s => ({
    professionals: s.professionals,
    toggleActive: s.toggleActive,
    fetchAll: s.fetchAll,
    loading: s.loading
  }))
  const [q, setQ] = useState('')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return professionals
    return professionals.filter(p =>
      containsIgnoringAccents(p.name, q) ||
      containsIgnoringAccents(p.specialty, q) ||
      containsIgnoringAccents(p.registrationNumber, q)
    )
  }, [q, professionals])

  return (
    <div className="space-y-6 relative">
      {/* Overlay de bloqueio se não tiver assinatura */}
      {!hasActiveSubscription && <UpgradeOverlay message="Profissionais bloqueados" feature="o cadastro e gestão de profissionais" />}
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <Stethoscope size={32} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Profissionais</h1>
                <p className="text-gray-400">Gerencie os profissionais do consultório</p>
              </div>
            </div>
            <Link
              to="/app/profissionais/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 whitespace-nowrap"
            >
              <UserPlus size={20} />
              Novo Profissional
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nome, especialidade ou registro..."
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <Stethoscope size={40} className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum profissional encontrado</h3>
            <p className="text-gray-400 mb-6">Cadastre os profissionais que trabalham no consultório</p>
            <Link
              to="/app/profissionais/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
            >
              <UserPlus size={18} />
              Cadastrar Profissional
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(prof => (
            <Link
              key={prof.id}
              to={`/app/profissionais/${prof.id}`}
              className="block bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
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
                <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleActive(prof.id)
                    }}
                    className={`p-2 rounded-lg transition-all ${prof.active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}
                    title={prof.active ? 'Desativar' : 'Ativar'}
                  >
                    {prof.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
