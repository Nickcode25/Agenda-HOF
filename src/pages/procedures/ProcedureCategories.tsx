import { useState, useEffect } from 'react'
import { useCategories } from '@/store/categories'
import { Plus, Trash2, Tag } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { Category } from '@/store/categories'

// Categorias nativas pré-cadastradas
const DEFAULT_PROCEDURE_CATEGORIES = [
  'Toxina Botulínica',
  'Preenchedores com Ácido Hialurônico',
  'Bioestimuladores de Colágeno',
  'Microagulhamento',
  'Peelings',
  'Fios de Sustentação',
  'Skinbooster',
  'Lipoenzimática',
  'Tecnologia / Equipamentos',
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Tag size={32} className="text-orange-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Categorias</h1>
                  <p className="text-gray-400">Categorias compartilhadas entre Procedimentos e Estoque</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
              >
                <Plus size={18} />
                Nova Categoria
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {procedureCategories.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                <Tag size={40} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Carregando categorias...</h3>
              <p className="text-gray-400 mb-6">Aguarde enquanto as categorias são carregadas</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {procedureCategories.map((category, index) => {
              const color = getCategoryColor(index)
              const isNative = DEFAULT_PROCEDURE_CATEGORIES.includes(category.name)

              return (
                <div
                  key={category.id}
                  className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/80 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                      >
                        <div className="w-6 h-6" style={{ color }}>
                          <Tag size={24} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{category.name}</h3>
                      </div>
                    </div>
                  </div>

                  {!isNative && (
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50">
                      <button
                        onClick={() => handleDelete(category)}
                        className="flex-1 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30 text-sm font-medium"
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Ex: Harmonização Facial, Depilação a Laser"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
