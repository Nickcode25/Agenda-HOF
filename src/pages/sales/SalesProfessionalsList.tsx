import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useMemo, useState, useEffect } from 'react'
import { Search, User, Plus, Edit, Mail, Phone, MapPin, Trash2, DollarSign } from 'lucide-react'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatCurrency } from '@/utils/currency'
import { useConfirm } from '@/hooks/useConfirm'

export default function SalesProfessionalsList() {
  const { professionals, sales, fetchProfessionals, removeProfessional, fetchSales } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchProfessionals()
    fetchSales()
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

    return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [professionals, searchQuery])

  // Calcular estatísticas de vendas por profissional
  const getProfessionalStats = (professionalName: string) => {
    const profSales = sales.filter(sale => sale.professionalName === professionalName)
    const totalSold = profSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const commission = totalSold * 0.1 // 10% de comissão
    return { totalSold, commission }
  }

  const handleDeleteProfessional = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Excluir Profissional',
      message: `Tem certeza que deseja excluir o profissional ${name}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (confirmed) {
      await removeProfessional(id)
      await fetchProfessionals()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <User size={24} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profissionais de Vendas</h1>
                <p className="text-sm text-gray-500">Gerencie sua equipe de vendas</p>
              </div>
            </div>
          </div>
          <Link
            to="/app/vendas/profissionais/novo"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Novo Profissional
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, especialidade, email ou telefone..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Professionals Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <User size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum profissional encontrado</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro profissional'}
            </p>
            <Link
              to="/app/vendas/profissionais/novo"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Novo Profissional
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(professional => {
              const stats = getProfessionalStats(professional.name)
              const initials = professional.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={professional.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden border-l-4 border-l-amber-400 hover:shadow-md transition-all">
                  {/* Header com avatar e nome */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                          {professional.specialty && (
                            <p className="text-sm text-amber-600 font-medium">{professional.specialty}</p>
                          )}
                        </div>
                      </div>
                      <Edit size={18} className="text-amber-500" />
                    </div>

                    {/* Contato */}
                    <div className="space-y-2 mb-4">
                      {professional.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <span>{professional.phone}</span>
                        </div>
                      )}
                      {professional.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          <span>{professional.email}</span>
                        </div>
                      )}
                      {(professional.city || professional.state) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>
                            {professional.city}
                            {professional.city && professional.state && ', '}
                            {professional.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-amber-50 px-5 py-3 border-t border-amber-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-amber-700 font-medium mb-1">Total Vendido</div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(stats.totalSold)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-700 font-medium mb-1">Comissão</div>
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(stats.commission)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/vendas/profissionais/editar/${professional.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-gray-200 hover:border-amber-200"
                      >
                        <Edit size={16} />
                        <span className="text-sm font-medium">Editar</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteProfessional(professional.id, professional.name)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Deletar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
