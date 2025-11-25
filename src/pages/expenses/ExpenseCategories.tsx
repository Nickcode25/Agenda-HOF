import { useState, useEffect } from 'react'
import { useExpenses } from '@/store/expenses'
import { ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES } from '@/types/cash'
import { Plus, Edit2, Trash2, Tag, Palette, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

export default function ExpenseCategories() {
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, initializeDefaultCategories, loading } = useExpenses()
  const { show } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#EF4444',
    icon: 'DollarSign',
    isActive: true
  })
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    initializeDefaultCategories()
    fetchCategories()
  }, [])

  const handleOpenModal = (category?: ExpenseCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon,
        isActive: category.isActive
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        color: '#EF4444',
        icon: 'DollarSign',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCategory) {
      await updateCategory(editingCategory.id, formData)
      show('Categoria atualizada com sucesso!', 'success')
    } else {
      await addCategory(formData)
      show('Categoria criada com sucesso!', 'success')
    }

    setIsModalOpen(false)
    await fetchCategories()
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Excluir Categoria',
      message: `Tem certeza que deseja excluir a categoria "${name}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (confirmed) {
      await deleteCategory(id)
      await fetchCategories()
    }
  }

  const colorOptions = [
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#10B981', label: 'Verde' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Cinza' }
  ]

  const iconOptions = [
    'DollarSign', 'Home', 'Users', 'ShoppingCart', 'Zap', 'FileText',
    'CreditCard', 'Package', 'Truck', 'Briefcase', 'Tool', 'Award'
  ]

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 p-8 shadow-lg">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-xl">
                <Tag size={32} className="text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Categorias de Despesas</h1>
                <p className="text-gray-500">Organize suas despesas por categorias</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40"
            >
              <Plus size={18} />
              Nova Categoria
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando categorias...</div>
      ) : categories.length === 0 ? (
        <div className="relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-lg">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Tag size={40} className="text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma categoria cadastrada</h3>
            <p className="text-gray-500 mb-6">Comece criando categorias para organizar suas despesas</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40"
            >
              <Plus size={18} />
              Nova Categoria
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all duration-300 hover:shadow-lg shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${category.color}15`, border: `1px solid ${category.color}30` }}
                  >
                    <div className="w-6 h-6" style={{ color: category.color }}>
                      <Tag size={24} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {category.isActive ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200 text-sm font-medium"
                >
                  <Edit2 size={16} className="inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200 text-sm font-medium"
                >
                  <Trash2 size={16} className="inline mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Ex: Aluguel, Salários, Fornecedores"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Descrição opcional da categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === option.value
                          ? 'border-gray-900 ring-2 ring-gray-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: option.value }}
                      title={option.label}
                    >
                      {formData.color === option.value && (
                        <CheckCircle size={16} className="text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'}
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
