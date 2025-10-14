import { FormEvent, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useStock } from '@/store/stock'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import { SaleItem } from '@/types/sales'
import { Save, ArrowLeft, Plus, Trash2, User } from 'lucide-react'

export default function SaleForm() {
  const { professionals, createSale } = useSales()
  const { items: stockItems, removeStock } = useStock()
  const navigate = useNavigate()

  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix' | 'transfer' | 'check'>('cash')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saleItems, setSaleItems] = useState<Array<{
    stockItemId: string
    quantity: number
    salePrice: string
  }>>([{ stockItemId: '', quantity: 1, salePrice: '' }])

  // Função para formatar moeda durante a digitação
  function formatCurrencyInput(value: string): string {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const calculatedItems = useMemo(() => {
    return saleItems.map(item => {
      const stockItem = stockItems.find(s => s.id === item.stockItemId)
      const salePrice = parseCurrency(item.salePrice)
      const totalPrice = salePrice * item.quantity
      const unitCost = stockItem?.costPrice || 0
      const profit = (salePrice - unitCost) * item.quantity

      return {
        ...item,
        stockItem,
        salePriceNumber: salePrice,
        totalPrice,
        unitCost,
        profit
      }
    }).filter(item => item.stockItem && item.quantity > 0 && item.salePriceNumber > 0)
  }, [saleItems, stockItems])

  const totalAmount = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalProfit = calculatedItems.reduce((sum, item) => sum + item.profit, 0)

  const addItem = () => {
    setSaleItems([...saleItems, { stockItemId: '', quantity: 1, salePrice: '' }])
  }

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...saleItems]
    if (field === 'salePrice') {
      updated[index] = { ...updated[index], [field]: formatCurrencyInput(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setSaleItems(updated)
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedProfessional) {
      alert('Selecione um profissional')
      return
    }

    if (calculatedItems.length === 0) {
      alert('Adicione pelo menos um produto à venda')
      return
    }

    // Verificar estoque disponível
    for (const item of calculatedItems) {
      if (item.stockItem!.quantity < item.quantity) {
        alert(`Estoque insuficiente de ${item.stockItem!.name}. Disponível: ${item.stockItem!.quantity} ${item.stockItem!.unit}`)
        return
      }
    }

    const professional = professionals.find(p => p.id === selectedProfessional)!
    
    const saleItemsData: SaleItem[] = calculatedItems.map(item => ({
      id: crypto.randomUUID(),
      stockItemId: item.stockItemId,
      stockItemName: item.stockItem!.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      salePrice: item.salePriceNumber,
      totalPrice: item.totalPrice,
      profit: item.profit
    }))

    const saleId = createSale({
      professionalId: selectedProfessional,
      professionalName: professional.name,
      items: saleItemsData,
      subtotal: totalAmount,
      discount: 0,
      totalAmount,
      totalProfit,
      paymentMethod,
      paymentStatus,
      dueDate: dueDate || undefined,
      paidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
      notes: notes || undefined
    })

    // Subtrair do estoque
    calculatedItems.forEach(item => {
      removeStock(
        item.stockItemId,
        item.quantity,
        `Venda para ${professional.name}`,
        undefined, // procedureId
        undefined  // patientId
      )
    })

    navigate('/vendas')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/vendas" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Nova Venda</h1>
          <p className="text-gray-400">Registre uma venda de produtos para profissional</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Professional Selection */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Profissional</h3>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Selecionar Profissional *</label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} {prof.specialty ? `- ${prof.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Link
              to="/vendas/profissionais/novo"
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors h-fit mt-7"
            >
              <User size={16} />
              Novo
            </Link>
          </div>
        </div>

        {/* Products */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Produtos</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} />
              Adicionar Produto
            </button>
          </div>

          <div className="space-y-4">
            {saleItems.map((item, index) => (
              <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Produto</label>
                    <select
                      value={item.stockItemId}
                      onChange={(e) => updateItem(index, 'stockItemId', e.target.value)}
                      className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione um produto</option>
                      {stockItems.filter(s => s.quantity > 0).map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.name} (Estoque: {stock.quantity} {stock.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Venda</label>
                    <input
                      type="text"
                      value={item.salePrice}
                      onChange={(e) => updateItem(index, 'salePrice', e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Item Summary */}
                {calculatedItems[index] && (
                  <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between items-center text-sm">
                    <div className="text-gray-400">
                      Custo unitário: {formatCurrency(calculatedItems[index].unitCost)}
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white">
                        Total: {formatCurrency(calculatedItems[index].totalPrice)}
                      </span>
                      <span className="text-green-400">
                        Lucro: {formatCurrency(calculatedItems[index].profit)}
                      </span>
                    </div>
                  </div>
                )}

                {saleItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-3 flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          {calculatedItems.length > 0 && (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-300">Total da Venda:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-sm text-blue-400">
                    Lucro Total: {formatCurrency(totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pagamento</h3>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              >
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="pix">PIX</option>
                <option value="transfer">Transferência</option>
                <option value="check">Cheque</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status do Pagamento</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            
            {paymentStatus === 'pending' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a venda..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Save size={18} />
            Registrar Venda
          </button>
          <Link
            to="/vendas"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
