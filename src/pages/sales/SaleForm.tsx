import { FormEvent, useState, useMemo, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { useStock } from '@/store/stock'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import { SaleItem } from '@/types/sales'
import { Save, Plus, Trash2, User, ShoppingCart, CreditCard, Package } from 'lucide-react'
import SearchableSelect from '@/components/SearchableSelect'
import { useToast } from '@/hooks/useToast'

export default function SaleForm() {
  const { id } = useParams<{ id: string }>()
  const { professionals, createSale, updateSale, getSale, fetchSales, fetchProfessionals } = useSales()
  const { items: stockItems, removeStock, fetchItems } = useStock()
  const navigate = useNavigate()
  const isEditing = !!id
  const { show } = useToast()

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
  const [soldAt, setSoldAt] = useState(() => new Date().toISOString().split('T')[0])
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
        // Carregar a data de venda existente ou usar a data de criação
        const existingDate = sale.soldAt || sale.createdAt
        setSoldAt(existingDate ? new Date(existingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])

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
    setSaleItems([{ stockItemId: '', quantity: 1, salePrice: '' }, ...saleItems])
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
      show('Selecione um profissional', 'error')
      return
    }

    // Verificar estoque disponível
    for (const item of calculatedItems) {
      if (item.stockItem!.quantity < item.quantity) {
        show(`Estoque insuficiente de ${item.stockItem!.name}. Disponível: ${item.stockItem!.quantity} ${item.stockItem!.unit}`, 'error')
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

    // Converter a data para ISO string mantendo o horário atual
    const now = new Date()
    const currentTime = now.toTimeString().split(' ')[0] // HH:MM:SS
    const soldAtISO = soldAt ? new Date(soldAt + 'T' + currentTime).toISOString() : now.toISOString()

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
          soldAt: soldAtISO,
          notes: notes || undefined
        })

        show('Venda atualizada com sucesso!', 'success')
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
          soldAt: soldAtISO,
          notes: notes || undefined
        })

        if (!saleId) {
          show('Erro ao registrar venda', 'error')
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

      }

      // Atualizar lista de produtos do estoque
      await fetchItems(true)

      navigate('/app/vendas')
    } catch (error) {
      console.error('❌ Erro ao processar venda:', error)
      show(`Erro ao ${isEditing ? 'atualizar' : 'registrar'} venda`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <ShoppingCart size={24} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Venda' : 'Nova Venda'}</h1>
              <p className="text-sm text-gray-500">Preencha os dados da venda</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6" id="sale-form">

          {/* Seção 1: Profissional */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <User size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Profissional</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Profissional *</label>
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
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors h-fit mt-7 shadow-sm"
                >
                  <User size={16} />
                  Novo
                </Link>
              </div>
            </div>
          </div>

          {/* Seção 2: Produtos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Package size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Adicionar Produto
                </button>
              </div>
            </div>
            <div className="p-6">

              <div className="space-y-4">
                {saleItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda</label>
                        <input
                          type="text"
                          value={item.salePrice}
                          onChange={(e) => updateItem(index, 'salePrice', e.target.value)}
                          placeholder="R$ 0,00"
                          className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Item Summary */}
                    {calculatedItems[index] && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm">
                        <div className="text-gray-600">
                          Custo unitário: <span className="font-medium text-gray-900">{formatCurrency(calculatedItems[index].unitCost)}</span>
                        </div>
                        <div className="flex gap-6">
                          <span className="text-gray-900 font-medium">
                            Total: {formatCurrency(calculatedItems[index].totalPrice)}
                          </span>
                          <span className="text-green-600 font-medium">
                            Lucro: {formatCurrency(calculatedItems[index].profit)}
                          </span>
                        </div>
                      </div>
                    )}

                    {saleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
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
                <div className="mt-6 p-5 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total da Venda:</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-600">
                        {formatCurrency(totalAmount)}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Lucro Total: {formatCurrency(totalProfit)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Pagamento */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CreditCard size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Pagamento</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Venda</label>
                <input
                  type="date"
                  value={soldAt}
                  onChange={(e) => setSoldAt(e.target.value)}
                  className="w-full md:w-1/3 bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Informe a data em que a venda foi realizada para o relatório financeiro</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                  <SearchableSelect
                    options={[
                      { value: 'cash', label: 'Dinheiro' },
                      { value: 'card', label: 'Cartão' },
                      { value: 'pix', label: 'PIX' },
                      { value: 'transfer', label: 'Transferência' },
                      { value: 'check', label: 'Cheque' }
                    ]}
                    value={paymentMethod}
                    onChange={(value) => setPaymentMethod(value as any)}
                    placeholder="Selecione a forma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status do Pagamento</label>
                  <SearchableSelect
                    options={[
                      { value: 'pending', label: 'Pendente' },
                      { value: 'paid', label: 'Pago' }
                    ]}
                    value={paymentStatus}
                    onChange={(value) => setPaymentStatus(value as any)}
                    placeholder="Selecione o status"
                  />
                </div>

                {paymentStatus === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre a venda..."
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-8 mt-6 shadow-lg">
          <div className="max-w-5xl mx-auto flex gap-4">
            <button
              type="submit"
              form="sale-form"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm transition-all"
            >
              <Save size={20} />
              {isEditing ? 'Atualizar Venda' : 'Registrar Venda'}
            </button>
            <Link
              to="/app/vendas"
              className="px-8 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium transition-all"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
