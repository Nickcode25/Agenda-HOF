import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { useCategories } from '@/store/categories'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'procedure' | 'stock' | 'both'
  onCategoryCreated?: (categoryName: string) => void
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  type,
  onCategoryCreated
}: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const { addCategory, error } = useCategories()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName.trim()) return

    setLoading(true)
    const id = await addCategory(categoryName.trim(), type)
    setLoading(false)

    if (id) {
      // Notificar componente pai
      if (onCategoryCreated) {
        onCategoryCreated(categoryName.trim())
      }

      setCategoryName('')
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nova Categoria</h2>
            <p className="text-sm text-gray-500 mt-1">
              {type === 'both' && 'Para Procedimentos e Estoque'}
              {type === 'procedure' && 'Apenas para Procedimentos'}
              {type === 'stock' && 'Apenas para Estoque'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Skinbooster, Harmonização Facial..."
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !categoryName.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {loading ? 'Criando...' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
