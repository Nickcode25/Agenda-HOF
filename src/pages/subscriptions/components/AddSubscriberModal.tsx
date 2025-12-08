import { useEffect } from 'react'
import { X, Search, CheckCircle, Users, Calendar, CreditCard, DollarSign, UserPlus, CalendarClock } from 'lucide-react'
import { Patient } from '@/types/patient'
import CurrencyInput from '@/components/CurrencyInput'
import DateInput from '@/components/DateInput'

interface AddSubscriberModalProps {
  isOpen: boolean
  planName: string
  planPrice: number
  availablePatients: Patient[]
  allAvailablePatients: Patient[]
  selectedPatientId: string
  searchPatient: string
  paymentDate: string
  subscriptionStartDate: string
  paidAmount: string
  paymentMethod: string
  onPatientSelect: (patientId: string) => void
  onSearchChange: (search: string) => void
  onPaymentDateChange: (date: string) => void
  onSubscriptionStartDateChange: (date: string) => void
  onPaidAmountChange: (amount: string) => void
  onPaymentMethodChange: (method: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onNavigateToNewPatient: () => void
}

export default function AddSubscriberModal({
  isOpen,
  planName,
  planPrice,
  availablePatients,
  allAvailablePatients,
  selectedPatientId,
  searchPatient,
  paymentDate,
  subscriptionStartDate,
  paidAmount,
  paymentMethod,
  onPatientSelect,
  onSearchChange,
  onPaymentDateChange,
  onSubscriptionStartDateChange,
  onPaidAmountChange,
  onPaymentMethodChange,
  onSubmit,
  onClose,
  onNavigateToNewPatient
}: AddSubscriberModalProps) {
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

  const hasPatients = allAvailablePatients.length > 0
  const selectedPatient = availablePatients.find(p => p.id === selectedPatientId)

  // Calcular próxima cobrança com base na data de início
  const getNextBillingDate = () => {
    if (!subscriptionStartDate) return null
    const [year, month, day] = subscriptionStartDate.split('-').map(Number)
    const nextDate = new Date(year, month, day) // month já é +1 automaticamente
    return nextDate.toLocaleDateString('pt-BR')
  }

  // Verificar se é pagamento antecipado (data de início > data de pagamento)
  const isAdvancePayment = subscriptionStartDate && paymentDate && subscriptionStartDate > paymentDate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Novo Assinante</h2>
                <p className="text-orange-100 text-sm">{planName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {!hasPatients ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Todos os pacientes já são assinantes
            </h3>
            <p className="text-gray-500">
              Todos os pacientes disponíveis já estão neste plano
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="overflow-y-auto max-h-[calc(90vh-88px)]">
            <div className="p-6 space-y-5">
              {/* Seção: Selecionar Paciente */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Selecionar Paciente</h3>
                </div>

                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={searchPatient}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Grid de Cards de Pacientes */}
                <div className="mt-3">
                  {!searchPatient || searchPatient.length < 2 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                      <Search className="mx-auto mb-2 text-gray-300" size={32} />
                      <p className="text-gray-500 text-sm">Digite ao menos 2 caracteres para buscar</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {allAvailablePatients.length} paciente(s) disponível(is)
                      </p>
                    </div>
                  ) : availablePatients.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Search className="mx-auto mb-2 text-gray-300" size={32} />
                      <p className="text-gray-500 text-sm">Nenhum paciente encontrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {availablePatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => onPatientSelect(patient.id)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            selectedPatientId === patient.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{patient.name}</h4>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.phone || patient.cpf || 'Sem contato'}
                              </p>
                            </div>
                            {selectedPatientId === patient.id && (
                              <CheckCircle className="text-orange-500 flex-shrink-0" size={20} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Paciente selecionado ou aviso */}
                {selectedPatient ? (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800">Paciente selecionado</p>
                      <p className="text-sm text-green-600 truncate">{selectedPatient.name}</p>
                    </div>
                  </div>
                ) : searchPatient.length >= 2 && availablePatients.length > 0 && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Selecione um paciente para continuar
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100"></div>

              {/* Seção: Datas */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock size={18} className="text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Datas</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        Data do Pagamento
                      </span>
                    </label>
                    <DateInput
                      required
                      value={paymentDate}
                      onChange={onPaymentDateChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Quando o pagamento foi realizado</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock size={14} className="text-gray-400" />
                        Data de Início da Assinatura
                      </span>
                    </label>
                    <DateInput
                      required
                      value={subscriptionStartDate}
                      onChange={onSubscriptionStartDateChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Quando a assinatura começa a valer</p>
                  </div>
                </div>

                {/* Aviso de pagamento antecipado */}
                {isAdvancePayment && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <CalendarClock className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Pagamento Antecipado</p>
                      <p className="text-xs text-blue-600">
                        O pagamento é referente a {(() => {
                          const [year, month, day] = subscriptionStartDate.split('-').map(Number)
                          const date = new Date(year, month - 1, day)
                          return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100"></div>

              {/* Seção: Detalhes do Pagamento */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={18} className="text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Detalhes do Pagamento</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-gray-400" />
                      Valor Pago
                    </span>
                  </label>
                  <CurrencyInput
                    required
                    value={paidAmount}
                    onChange={onPaidAmountChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Método de Pagamento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['PIX', 'Crédito', 'Débito', 'Dinheiro', 'Transferência'].map((method) => {
                      const value = method === 'Crédito' ? 'Cartão de Crédito' : method === 'Débito' ? 'Cartão de Débito' : method
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => onPaymentMethodChange(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            paymentMethod === value
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {method}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Resumo */}
              {paidAmount && parseFloat(paidAmount.replace(/[^\d,]/g, '').replace(',', '.')) > 0 && subscriptionStartDate && (
                <>
                  <div className="border-t border-gray-100"></div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumo da Assinatura</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor mensal</span>
                        <span className="font-semibold text-orange-600">{paidAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Início da assinatura</span>
                        <span className="font-medium text-gray-900">
                          {(() => {
                            const [year, month, day] = subscriptionStartDate.split('-').map(Number)
                            const date = new Date(year, month - 1, day)
                            return date.toLocaleDateString('pt-BR')
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Próxima cobrança</span>
                        <span className="font-medium text-gray-900">{getNextBillingDate()}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer com botões */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedPatientId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Adicionar Assinante
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
