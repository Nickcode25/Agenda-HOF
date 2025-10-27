import { FormEvent, useState, useMemo, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useStock } from '@/store/stock'
import { autoRegisterCashMovement } from '@/store/cash'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import { SaleItem } from '@/types/sales'
import { Save, Plus, Trash2, User, ArrowLeft, CreditCard, DollarSign } from 'lucide-react'
import SearchableSelect from '@/components/SearchableSelect'

export default function SaleForm() {
  const { id } = useParams<{ id: string }>()
  const { professionals, createSale, updateSale, getSale, fetchSales, fetchProfessionals } = useSales()
  const { items: stockItems, removeStock, fetchItems } = useStock()
  const navigate = useNavigate()
  const isEditing = !!id

  useEffect(() => {
    fetchProfessionals()
    fetchItems()
    if (id) {
      fetchSales()
    }
  }, [id])

  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix' | 'transfer' | 'check'>('cash')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'overdue'>('pending')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saleItems, setSaleItems] = useState<Array<{
    stockItemId: string
    quantity: number
    salePrice: string
  }>>([{ stockItemId: '', quantity: 1, salePrice: '' }])

  // Carregar dados da venda se estiver editando
  useEffect(() => {
    if (id) {
      const sale = getSale(id)
      if (sale) {
        setSelectedProfessional(sale.professionalId)
        setPaymentMethod(sale.paymentMethod)
        setPaymentStatus(sale.paymentStatus)
        setNotes(sale.notes || '')

        // Converter items da venda para o formato do formulário
        const formattedItems = sale.items.map(item => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          salePrice: formatCurrency(item.salePrice)
        }))
        setSaleItems(formattedItems)
      }
    }
  }, [id, getSale])

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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedProfessional) {
      alert('Selecione um profissional')
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

    try {
      if (isEditing && id) {
        // Atualizar venda existente
        await updateSale(id, {
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

        alert('Venda atualizada com sucesso!')
      } else {
        // Criar nova venda no Supabase
        const saleId = await createSale({
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

        if (!saleId) {
          alert('Erro ao registrar venda')
          return
        }

        // Subtrair do estoque apenas em novas vendas
        for (const item of calculatedItems) {
          const success = await removeStock(
            item.stockItemId,
            item.quantity,
            `Venda para ${professional.name}`,
            undefined, // procedureId
            undefined  // patientId
          )
          if (!success) {
            console.error('❌ Erro ao remover do estoque:', item.stockItem?.name)
          }
        }

        // Registrar movimentação no caixa se o pagamento for à vista
        if (paymentStatus === 'paid') {
          await autoRegisterCashMovement({
            type: 'income',
            category: 'sale',
            amount: totalAmount,
            paymentMethod,
            referenceId: saleId,
            description: `Venda para ${professional.name} - ${calculatedItems.length} produto(s)`
          })
        }
      }

      // Atualizar lista de produtos do estoque
      await fetchItems(true)

      navigate('/app/vendas')
    } catch (error) {
      console.error('❌ Erro ao processar venda:', error)
      alert(`Erro ao ${isEditing ? 'atualizar' : 'registrar'} venda`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Form com Header Integrado */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header Premium */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <Link
              to="/app/vendas"
              className="p-3 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-600/50 hover:border-orange-500/50"
              title="Voltar"
            >
              <ArrowLeft size={24} className="text-gray-400 hover:text-orange-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{isEditing ? 'Editar Venda' : 'Nova Venda'}</h1>
              <p className="text-sm text-gray-400 mt-1">Preencha os dados da venda</p>
            </div>
          </div>
        </div>

        {/* Professional Selection */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
            <User size={20} />
            Profissional
          </h3>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Selecionar Profissional *</label>
              <SearchableSelect
                value={selectedProfessional}
                onChange={setSelectedProfessional}
                options={[
                  { value: '', label: 'Selecione um profissional', disabled: true },
                  ...professionals.map(prof => ({
                    value: prof.id,
                    label: `${prof.name}${prof.specialty ? ` - ${prof.specialty}` : ''}`
                  }))
                ]}
                placeholder="Selecione um profissional"
              />
            </div>
            <Link
              to="../profissionais/novo"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-colors h-fit mt-7 shadow-lg shadow-orange-500/20"
            >
              <User size={16} />
              Novo
            </Link>
          </div>
        </div>

        {/* Products */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
              <Plus size={20} />
              Produtos
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus size={16} />
              Adicionar Produto
            </button>
          </div>

          <div className="space-y-4">
            {saleItems.map((item, index) => (
              <div key={index} className="bg-gray-700/40 border border-gray-600/50 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Produto</label>
                    <SearchableSelect
                      value={item.stockItemId}
                      onChange={(value) => updateItem(index, 'stockItemId', value)}
                      options={[
                        { value: '', label: 'Selecione um produto', disabled: true },
                        ...stockItems
                          .filter(s => s.quantity > 0)
                          .map(stock => ({
                            value: stock.id,
                            label: `${stock.name} (Estoque: ${stock.quantity} ${stock.unit})`
                          }))
                      ]}
                      placeholder="Selecione um produto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preço de Venda</label>
                    <input
                      type="text"
                      value={item.salePrice}
                      onChange={(e) => updateItem(index, 'salePrice', e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Item Summary */}
                {calculatedItems[index] && (
                  <div className="mt-4 pt-4 border-t border-gray-600/50 flex justify-between items-center text-sm">
                    <div className="text-gray-400">
                      Custo unitário: <span className="font-medium">{formatCurrency(calculatedItems[index].unitCost)}</span>
                    </div>
                    <div className="flex gap-6">
                      <span className="text-white font-medium">
                        Total: {formatCurrency(calculatedItems[index].totalPrice)}
                      </span>
                      <span className="text-green-400 font-medium">
                        Lucro: {formatCurrency(calculatedItems[index].profit)}
                      </span>
                    </div>
                  </div>
                )}

                {saleItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-3 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    <Trash2 size={16} />
                    Remover item
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          {calculatedItems.length > 0 && (
            <div className="mt-6 p-5 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-300">Total da Venda:</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-sm text-blue-400 font-medium mt-1">
                    Lucro Total: {formatCurrency(totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-6 flex items-center gap-2">
            <CreditCard size={20} />
            Pagamento
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
              className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pb-8">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
          >
            <Save size={20} />
            {isEditing ? 'Atualizar Venda' : 'Registrar Venda'}
          </button>
          <Link
            to=".."
            className="px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white rounded-xl font-medium transition-all hover:border-gray-500"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
