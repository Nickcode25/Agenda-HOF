import { useState, useEffect } from 'react'
import { useCategories } from '@/store/categories'
import { Plus, Trash2, Tag } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { Category } from '@/store/categories'

// Categorias nativas pré-cadastradas
const DEFAULT_PROCEDURE_CATEGORIES = [
  'Bichectomia',
  'Bioestimuladores de Colágeno',
  'Fios de Sustentação',
  'Lipoaspiração',
  'Lipoenzimática',
  'Microagulhamento',
  'Peelings',
  'Preenchedores com Ácido Hialurônico',
  'Rinomodelação',
  'Skinbooster',
  'Tecnologia / Equipamentos',
  'Toxina Botulínica',
  'Tratamentos Vasculares'
]

export default function ProcedureCategories() {
  const { categories, fetchCategories, addCategory, deleteCategory } = useCategories()
  const { show } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initializeDefaultCategories()
    fetchCategories()
  }, [])

  // Inicializar categorias padrão se não existirem
  const initializeDefaultCategories = async () => {
    await fetchCategories()
    const existingCategories = categories.filter(c => c.type === 'procedure' || c.type === 'both')
    const existingNames = existingCategories.map(c => c.name)

    for (const defaultCategory of DEFAULT_PROCEDURE_CATEGORIES) {
      if (!existingNames.includes(defaultCategory)) {
        await addCategory(defaultCategory, 'both')
      }
    }

    await fetchCategories()
  }

  // Obter apenas categorias de procedimentos
  const procedureCategories = categories.filter(
    c => c.type === 'procedure' || c.type === 'both'
  )

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
    } else {
      setEditingCategory(null)
      setCategoryName('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName.trim()) {
      show('Digite o nome da categoria', 'error')
      return
    }

    setLoading(true)

    try {
      if (editingCategory) {
        // Não permitimos editar o nome de categorias nativas
        const isNative = DEFAULT_PROCEDURE_CATEGORIES.includes(editingCategory.name)
        if (isNative) {
          show('Não é possível editar categorias nativas', 'error')
          setLoading(false)
          return
        }
        show('Edição de categorias ainda não implementada', 'info')
      } else {
        // Criar nova categoria (tipo 'both' para aparecer em procedimentos e estoque)
        const id = await addCategory(categoryName.trim(), 'both')
        if (id) {
          show('Categoria criada com sucesso!', 'success')
          setCategoryName('')
          setIsModalOpen(false)
          await fetchCategories()
        } else {
          show('Erro ao criar categoria', 'error')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      show('Erro ao salvar categoria', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    // Não permitir excluir categorias nativas
    const isNative = DEFAULT_PROCEDURE_CATEGORIES.includes(category.name)
    if (isNative) {
      show('Não é possível excluir categorias nativas', 'error')
      return
    }

    if (window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      try {
        await deleteCategory(category.id)
        show('Categoria excluída com sucesso!', 'success')
        await fetchCategories()
      } catch (error) {
        console.error('Erro ao excluir categoria:', error)
        show('Erro ao excluir categoria', 'error')
      }
    }
  }

  const colorOptions = [
    { value: '#F97316', label: 'Laranja' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F59E0B', label: 'Âmbar' },
    { value: '#10B981', label: 'Verde' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' }
  ]

  // Cor aleatória para cada categoria
  const getCategoryColor = (index: number) => {
    return colorOptions[index % colorOptions.length].value
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
              <Tag size={28} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
              <p className="text-sm text-gray-500">Categorias compartilhadas entre Procedimentos e Estoque</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>

        {/* Categories Grid */}
        {procedureCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <Tag size={32} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando categorias...</h3>
            <p className="text-gray-500">Aguarde enquanto as categorias são carregadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {procedureCategories.map((category, index) => {
              const color = getCategoryColor(index)
              const isNative = DEFAULT_PROCEDURE_CATEGORIES.includes(category.name)

              return (
                <div
                  key={category.id}
                  className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                      >
                        <Tag size={20} style={{ color }} />
                      </div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                    </div>

                    {!isNative && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir categoria"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Ex: Harmonização Facial, Depilação a Laser"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
