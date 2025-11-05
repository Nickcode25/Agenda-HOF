import { Link } from 'react-router-dom'
import { X, Camera, Upload, AlertTriangle } from 'lucide-react'
import { PlannedProcedure } from '@/types/patient'
import { Procedure } from '@/store/procedures'
import { StockItem } from '@/types/stock'

interface CompleteProcedureModalProps {
  isOpen: boolean
  procedure: PlannedProcedure | null
  selectedProductId: string
  beforePhotos: string[]
  afterPhotos: string[]
  photoNotes: string
  procedures: Procedure[]
  stockItems: StockItem[]
  onProductSelect: (productId: string) => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => void
  onRemovePhoto: (index: number, type: 'before' | 'after') => void
  onPhotoNotesChange: (notes: string) => void
  onClose: () => void
  onComplete: () => void
}

export default function CompleteProcedureModal({
  isOpen,
  procedure,
  selectedProductId,
  beforePhotos,
  afterPhotos,
  photoNotes,
  procedures,
  stockItems,
  onProductSelect,
  onPhotoUpload,
  onRemovePhoto,
  onPhotoNotesChange,
  onClose,
  onComplete
}: CompleteProcedureModalProps) {
  if (!isOpen || !procedure) return null

  // Obter categoria do procedimento
  const procedureData = procedures.find(p => p.name === procedure.procedureName)
  const hasCategory = !!procedureData?.category
  const categoryProducts = procedureData?.category
    ? stockItems.filter(item => item.category === procedureData.category)
    : []

  // Verificar se o botão deve estar desabilitado
  const isDisabled = (() => {
    if (!selectedProductId) return false
    const product = stockItems.find(item => item.id === selectedProductId)
    return product ? product.quantity < procedure.quantity : false
  })()

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Concluir Procedimento</h2>
            <p className="text-gray-400 mt-1">{procedure.procedureName} - {procedure.quantity}x</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              {/* Se não tem categoria, mostrar aviso e pular seleção de produto */}
              {!hasCategory && (
                <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <AlertTriangle size={20} className="text-blue-400" />
                  <p className="text-sm text-blue-400">
                    Este procedimento não está vinculado a nenhuma categoria de produto. Você pode concluir sem selecionar produto.
                  </p>
                </div>
              )}

              {/* Se tem categoria mas não tem produtos */}
              {hasCategory && categoryProducts.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <AlertTriangle size={20} className="text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      Categoria: {procedureData?.category}
                    </p>
                    <p className="text-sm text-blue-300">
                      Nenhum produto cadastrado na categoria "{procedureData?.category}". Você pode concluir o procedimento sem vincular produto ou <Link to="/app/estoque/novo" className="underline hover:text-blue-200">cadastrar um produto</Link>.
                    </p>
                  </div>
                </div>
              )}

              {/* Se tem categoria e produtos, mostrar seleção */}
              {hasCategory && categoryProducts.length > 0 && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Selecione o produto utilizado (opcional)
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {categoryProducts.map(product => (
                      <label
                        key={product.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedProductId === product.id
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="radio"
                            name="product"
                            value={product.id}
                            checked={selectedProductId === product.id}
                            onChange={(e) => onProductSelect(e.target.value)}
                            className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-white">{product.name}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-gray-400">
                                Estoque: {product.quantity} {product.unit}
                              </p>
                              <p className="text-sm text-gray-400">
                                Necessário: {procedure.quantity} {product.unit}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              product.quantity >= procedure.quantity
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                            title={
                              product.quantity >= procedure.quantity
                                ? 'Estoque suficiente'
                                : 'Estoque insuficiente'
                            }
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedProductId && (() => {
              const product = stockItems.find(item => item.id === selectedProductId)
              if (product && product.quantity < procedure.quantity) {
                return (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertTriangle size={20} className="text-red-500" />
                    <p className="text-sm text-red-500">
                      Estoque insuficiente. Disponível: {product.quantity} {product.unit}
                    </p>
                  </div>
                )
              }
              return null
            })()}

            {/* Upload de Fotos Antes/Depois */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Camera size={20} className="text-blue-400" />
                Fotos Antes/Depois (Opcional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fotos Antes */}
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">
                    📷 Fotos ANTES
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPhotoUpload(e, 'before')}
                    className="hidden"
                    id="before-photos"
                  />
                  <label
                    htmlFor="before-photos"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-blue-400" />
                    <span className="text-sm text-blue-400">Adicionar fotos</span>
                  </label>

                  {beforePhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {beforePhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-blue-500/30">
                          <img src={photo} alt={`Antes ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => onRemovePhoto(index, 'before')}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fotos Depois */}
                <div>
                  <label className="block text-sm font-medium text-green-400 mb-2">
                    📷 Fotos DEPOIS
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPhotoUpload(e, 'after')}
                    className="hidden"
                    id="after-photos"
                  />
                  <label
                    htmlFor="after-photos"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 rounded-xl cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-green-400" />
                    <span className="text-sm text-green-400">Adicionar fotos</span>
                  </label>

                  {afterPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {afterPhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30">
                          <img src={photo} alt={`Depois ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => onRemovePhoto(index, 'after')}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Observações sobre as fotos
                  </label>
                  <textarea
                    value={photoNotes}
                    onChange={(e) => onPhotoNotesChange(e.target.value)}
                    placeholder="Ex: Primeira sessão, aplicação em testa e glabela..."
                    className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onComplete}
            disabled={isDisabled}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/40"
          >
            Concluir Procedimento
          </button>
        </div>
      </div>
    </div>
  )
}
