import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/store/admin'
import { useAuth } from '@/store/auth'
import {
  ShoppingCart,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  ArrowLeft,
  LogOut,
  Filter
} from 'lucide-react'
import type { Purchase, PaymentStatus } from '@/types/admin'

export default function PurchasesManager() {
  const navigate = useNavigate()
  const { adminUser, signOut } = useAuth()
  const { purchases, customers, fetchPurchases, fetchCustomers, addPurchase, updatePurchase, deletePurchase, loading } = useAdmin()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    productName: '',
    amount: '',
    paymentStatus: 'pending' as PaymentStatus,
    paymentMethod: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchPurchases()
    fetchCustomers()
  }, [])

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch =
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleOpenModal = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase)
      setFormData({
        customerId: purchase.customerId,
        customerName: purchase.customerName,
        customerEmail: purchase.customerEmail,
        productName: purchase.productName,
        amount: purchase.amount.toString(),
        paymentStatus: purchase.paymentStatus,
        paymentMethod: purchase.paymentMethod || '',
        purchaseDate: purchase.purchaseDate.split('T')[0],
        notes: purchase.notes || ''
      })
    } else {
      setEditingPurchase(null)
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        productName: '',
        amount: '',
        paymentStatus: 'pending',
        paymentMethod: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPurchase(null)
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const purchaseData = {
      ...formData,
      amount: parseFloat(formData.amount)
    }

    if (editingPurchase) {
      await updatePurchase(editingPurchase.id, purchaseData)
      handleCloseModal()
    } else {
      const id = await addPurchase(purchaseData)
      if (id) {
        handleCloseModal()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta compra?')) {
      await deletePurchase(id)
    }
  }

  const handleStatusChange = async (id: string, status: PaymentStatus) => {
    await updatePurchase(id, { paymentStatus: status })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'refunded': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'pending': return 'Pendente'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  return (
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
                <h1 className="text-2xl font-bold text-white">Gerenciar Compras</h1>
                <p className="text-sm text-gray-400 mt-1">{purchases.length} compra(s) registrada(s)</p>
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
              placeholder="Buscar por cliente, email ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
          </select>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Compra
          </button>
        </div>

        {/* Purchases Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Data</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Nenhuma compra encontrada</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-orange-400 hover:text-orange-300 text-sm font-medium"
                      >
                        Adicionar primeira compra
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-white">{purchase.customerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{purchase.customerEmail}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{purchase.productName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-400">
                        {formatCurrency(purchase.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={purchase.paymentStatus}
                          onChange={(e) => handleStatusChange(purchase.id, e.target.value as PaymentStatus)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(purchase.paymentStatus)} bg-transparent cursor-pointer`}
                        >
                          <option value="paid">Pago</option>
                          <option value="pending">Pendente</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(purchase.purchaseDate)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(purchase)}
                            className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id)}
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
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingPurchase ? 'Editar Compra' : 'Nova Compra'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingPurchase && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selecionar Cliente
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">Selecione ou preencha manualmente</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.email}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status do Pagamento *
                  </label>
                  <select
                    required
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Método de Pagamento
                  </label>
                  <input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="Ex: PIX, Cartão..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
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
                  {loading ? 'Salvando...' : editingPurchase ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
