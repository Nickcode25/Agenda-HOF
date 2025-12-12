import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, BarChart3, ShoppingCart, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import DateInput from '@/components/DateInput'
import { getTodayInSaoPaulo, formatInSaoPaulo } from '@/utils/timezone'

type PeriodFilter = 'day' | 'week' | 'month' | 'year' | 'custom'

export default function SalesHistory() {
  const { sales, fetchSales } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  // Calcular datas baseado no período selecionado (usando fuso horário de São Paulo)
  useEffect(() => {
    const todayStr = getTodayInSaoPaulo()
    const [year, month, day] = todayStr.split('-').map(Number)
    const today = new Date(year, month - 1, day)

    switch (periodFilter) {
      case 'day':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(day - today.getDay())
        const weekEnd = new Date(today)
        weekEnd.setDate(day + (6 - today.getDay()))
        setStartDate(`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`)
        setEndDate(`${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`)
        break
      case 'month':
        const monthEnd = new Date(year, month, 0)
        setStartDate(`${year}-${String(month).padStart(2, '0')}-01`)
        setEndDate(`${year}-${String(month).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`)
        break
      case 'year':
        setStartDate(`${year}-01-01`)
        setEndDate(`${year}-12-31`)
        break
      case 'custom':
        break
    }
  }, [periodFilter])

  const filtered = useMemo(() => {
    let result = sales

    if (searchQuery.trim()) {
      result = result.filter(sale =>
        containsIgnoringAccents(sale.professionalName, searchQuery) ||
        containsIgnoringAccents(sale.id, searchQuery) ||
        sale.items.some(item => containsIgnoringAccents(item.stockItemName, searchQuery))
      )
    }

    if (statusFilter) {
      result = result.filter(sale => sale.paymentStatus === statusFilter)
    }

    if (startDate && endDate) {
      result = result.filter(sale => {
        const saleDateRaw = sale.soldAt || sale.createdAt
        if (!saleDateRaw) return false
        // Converter a data UTC para o fuso horário de São Paulo antes de comparar
        const saleDateStr = formatInSaoPaulo(saleDateRaw, 'yyyy-MM-dd')
        return saleDateStr >= startDate && saleDateStr <= endDate
      })
    }

    return result.sort((a, b) => new Date(b.soldAt || b.createdAt).getTime() - new Date(a.soldAt || a.createdAt).getTime())
  }, [sales, searchQuery, statusFilter, startDate, endDate])

  const periodTotals = useMemo(() => {
    const total = filtered.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const profit = filtered.reduce((sum, sale) => sum + sale.totalProfit, 0)
    const count = filtered.length
    return { total, profit, count }
  }, [filtered])

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Pago', dot: 'bg-green-500' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pendente', dot: 'bg-yellow-500' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Vencido', dot: 'bg-red-500' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Pendente', dot: 'bg-gray-500' }
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    }
    return methods[method as keyof typeof methods] || method
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(245, 158, 11) // Amber
    doc.text('Relatório de Vendas', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    // Formatar datas corretamente sem problemas de timezone
    const formatDateForPDF = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }
    const periodText = `Período: ${formatDateForPDF(startDate)} até ${formatDateForPDF(endDate)}`
    doc.text(periodText, 14, 28)

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Resumo do Período', 14, 38)

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(`Total de Vendas: ${periodTotals.count}`, 14, 45)
    doc.text(`Faturamento Total: ${formatCurrency(periodTotals.total)}`, 14, 51)
    doc.text(`Lucro Total: ${formatCurrency(periodTotals.profit)}`, 14, 57)

    const tableData = filtered.map(sale => {
      const products = sale.items
        .map(item => `${item.quantity} ${item.stockItemName}`)
        .join(', ')
      const statusLabel = getPaymentStatusConfig(sale.paymentStatus).label

      return [
        formatDateTimeBRSafe(sale.soldAt || sale.createdAt),
        sale.professionalName,
        products,
        getPaymentMethodLabel(sale.paymentMethod),
        statusLabel,
        formatCurrency(sale.totalAmount),
        formatCurrency(sale.totalProfit)
      ]
    })

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Profissional', 'Produtos', 'Pagamento', 'Status', 'Total', 'Lucro']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [60, 60, 60]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 23 },
        6: { cellWidth: 23 }
      },
      margin: { left: 14, right: 14 }
    })

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Agenda HOF - Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        14,
        doc.internal.pageSize.height - 10
      )
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      )
    }

    const fileName = `relatorio-vendas-${startDate}-${endDate}.pdf`
    doc.save(fileName)
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <BarChart3 size={24} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
                <p className="text-sm text-gray-500">Visualize todas as vendas realizadas</p>
              </div>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>
        </div>

        {/* Period Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setPeriodFilter('day')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodFilter === 'day'
                  ? 'bg-amber-500 text-white'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodFilter === 'week'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodFilter === 'month'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodFilter === 'year'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodFilter === 'custom'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Date Fields */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <DateInput
                    value={startDate}
                    onChange={(value) => {
                      setStartDate(value)
                      if (periodFilter !== 'custom') setPeriodFilter('custom')
                    }}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <DateInput
                    value={endDate}
                    onChange={(value) => {
                      setEndDate(value)
                      if (periodFilter !== 'custom') setPeriodFilter('custom')
                    }}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => {}}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-all text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-amber-600">Faturamento Total</span>
              <DollarSign size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(periodTotals.total)}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Lucro Total</span>
              <BarChart3 size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(periodTotals.profit)}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-600">Total de Vendas</span>
              <ShoppingCart size={18} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{periodTotals.count}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por profissional, produto ou ID da venda..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm min-w-[160px]"
            >
              <option value="">Todos os status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        </div>

        {/* Sales List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <ShoppingCart size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Ainda não há vendas registradas para este período
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(sale => {
              const statusConfig = getPaymentStatusConfig(sale.paymentStatus)

              return (
                <div key={sale.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShoppingCart size={18} className="text-amber-500" />
                        <span className="font-medium text-gray-900">Vendedor: {sale.professionalName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{formatDateTimeBRSafe(sale.soldAt || sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <DollarSign size={14} className="text-green-500" />
                          <span className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                        <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="text-sm text-gray-700 mb-2">Items:</div>
                    <div className="space-y-1">
                      {sale.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">├─ {item.stockItemName} - {formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                      <div className="text-sm text-gray-600">
                        └─ Quantidade: {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm">
                        <span className="text-gray-600">Lucro: </span>
                        <span className="font-semibold text-green-600">{formatCurrency(sale.totalProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
