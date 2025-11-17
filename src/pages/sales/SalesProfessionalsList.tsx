import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useMemo, useState, useEffect } from 'react'
import { Search, User, Plus, Edit, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import { containsIgnoringAccents } from '@/utils/textSearch'

export default function SalesProfessionalsList() {
  const { professionals, fetchProfessionals } = useSales()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProfessionals()
  }, [])

  const filtered = useMemo(() => {
    let result = professionals

    if (searchQuery.trim()) {
      result = result.filter(prof =>
        containsIgnoringAccents(prof.name, searchQuery) ||
        containsIgnoringAccents(prof.specialty || '', searchQuery) ||
        containsIgnoringAccents(prof.email || '', searchQuery) ||
        containsIgnoringAccents(prof.phone || '', searchQuery)
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [professionals, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/app/vendas" className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                <ArrowLeft size={24} className="text-gray-400 hover:text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <User size={32} className="text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Profissionais de Vendas</h1>
                  <p className="text-gray-400">Gerencie sua equipe de vendas</p>
                </div>
              </div>
            </div>
            <Link
              to="/app/vendas/profissionais/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 whitespace-nowrap"
            >
              <Plus size={18} />
              Novo Profissional
            </Link>
          </div>
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, especialidade, email ou telefone..."
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Professionals List */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <User size={40} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum profissional encontrado</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro profissional'}
            </p>
            <Link
              to="/app/vendas/profissionais/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
            >
              <Plus size={18} />
              Novo Profissional
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(professional => (
            <div key={professional.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1">{professional.name}</h3>
                  {professional.specialty && (
                    <p className="text-sm text-orange-400 mb-3">{professional.specialty}</p>
                  )}

                  <div className="space-y-2">
                    {professional.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail size={14} />
                        <span>{professional.email}</span>
                      </div>
                    )}
                    {professional.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone size={14} />
                        <span>{professional.phone}</span>
                      </div>
                    )}
                    {(professional.city || professional.state) && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin size={14} />
                        <span>
                          {professional.city}
                          {professional.city && professional.state && ', '}
                          {professional.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/app/vendas/profissionais/editar/${professional.id}`}
                  className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit size={18} className="text-gray-400 hover:text-orange-400" />
                </Link>
              </div>

              {professional.registrationNumber && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">Registro: {professional.registrationNumber}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
