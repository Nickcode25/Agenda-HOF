import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/store/admin'
import { useAuth } from '@/store/auth'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  ArrowLeft,
  LogOut
} from 'lucide-react'
import type { Customer } from '@/types/admin'
import { useConfirm } from '@/hooks/useConfirm'

export default function CustomersManager() {
  const navigate = useNavigate()
  const { adminUser, signOut } = useAuth()
  const { customers, fetchCustomers, addCustomer, updateCustomer, deleteCustomer, searchCustomers, loading } = useAdmin()

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  })
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      await searchCustomers(query)
    } else {
      await fetchCustomers()
    }
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        cpf: customer.cpf || ''
      })
    } else {
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phone: '', cpf: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', cpf: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData)
      handleCloseModal()
    } else {
      const id = await addCustomer(formData)
      if (id) {
        handleCloseModal()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja deletar este cliente?' })) {
      await deleteCustomer(id)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Gerenciar Clientes</h1>
                <p className="text-sm text-gray-400 mt-1">{customers.length} cliente(s) cadastrado(s)</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>

        {/* Customers Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">CPF</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cadastrado em</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Carregando...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Nenhum cliente encontrado</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-orange-400 hover:text-orange-300 text-sm font-medium"
                      >
                        Adicionar primeiro cliente
                      </button>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-white">{customer.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{customer.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{customer.phone || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{customer.cpf || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{formatDate(customer.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : editingCustomer ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
