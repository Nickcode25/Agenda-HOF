import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useMemo, useState, useEffect } from 'react'
import { Search, User, Plus, Edit, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function SalesProfessionalsList() {
  const { professionals, fetchProfessionals } = useSales()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProfessionals()
  }, [])

  const filtered = useMemo(() => {
    let result = professionals

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(prof =>
        prof.name.toLowerCase().includes(query) ||
        prof.specialty?.toLowerCase().includes(query) ||
        prof.email?.toLowerCase().includes(query) ||
        prof.phone?.toLowerCase().includes(query)
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [professionals, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app/vendas" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Profissionais de Vendas</h1>
        </div>
        <Link
          to="/app/vendas/profissionais/novo"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
        >
          <Plus size={18} />
          Novo Profissional
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome, especialidade, email ou telefone..."
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
        />
      </div>

      {/* Professionals List */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum profissional encontrado</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro profissional'}
          </p>
          <Link
            to="/app/vendas/profissionais/novo"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Novo Profissional
          </Link>
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
