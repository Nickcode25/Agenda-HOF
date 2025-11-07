import { X, Search, CheckCircle, Users } from 'lucide-react'
import { Patient } from '@/types/patient'
import CurrencyInput from '@/components/CurrencyInput'

interface AddSubscriberModalProps {
  isOpen: boolean
  planName: string
  planPrice: number
  availablePatients: Patient[]
  allAvailablePatients: Patient[]
  selectedPatientId: string
  searchPatient: string
  paymentDate: string
  paidAmount: string
  paymentMethod: string
  onPatientSelect: (patientId: string) => void
  onSearchChange: (search: string) => void
  onPaymentDateChange: (date: string) => void
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
  paidAmount,
  paymentMethod,
  onPatientSelect,
  onSearchChange,
  onPaymentDateChange,
  onPaidAmountChange,
  onPaymentMethodChange,
  onSubmit,
  onClose,
  onNavigateToNewPatient
}: AddSubscriberModalProps) {
  if (!isOpen) return null

  const hasPatients = allAvailablePatients.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Adicionar Assinante ao {planName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {!hasPatients ? (
          <div className="text-center py-8">
            <Users className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Todos os pacientes já são assinantes
            </h3>
            <p className="text-gray-500 mb-6">
              Todos os pacientes disponíveis já estão neste plano
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Buscar e Selecionar Paciente
              </label>

              {/* Campo de Busca */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={searchPatient}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Grid de Cards de Pacientes */}
              {!searchPatient || searchPatient.length < 2 ? (
                <div className="text-center py-12 bg-gray-700/30 rounded-lg border border-gray-600">
                  <Search className="mx-auto mb-3 text-gray-500" size={40} />
                  <p className="text-gray-400 mb-1">Digite ao menos 2 caracteres para buscar</p>
                  <p className="text-sm text-gray-500">
                    {allAvailablePatients.length} paciente(s) disponível(is)
                  </p>
                </div>
              ) : availablePatients.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-gray-600">
                  <Search className="mx-auto mb-3 text-gray-500" size={40} />
                  <p className="text-gray-400">Nenhum paciente encontrado com "{searchPatient}"</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-hide">
                  {availablePatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => onPatientSelect(patient.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedPatientId === patient.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{patient.name}</h3>
                          <p className="text-sm text-gray-400">{patient.cpf}</p>
                          <p className="text-sm text-gray-400">{patient.phone}</p>
                        </div>
                        {selectedPatientId === patient.id && (
                          <CheckCircle className="text-orange-400 flex-shrink-0" size={20} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!selectedPatientId && (
                <p className="text-sm text-yellow-400 mt-2">
                  ⚠️ Selecione um paciente para continuar
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data do Pagamento *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor Pago (R$) *</label>
                <CurrencyInput
                  required
                  value={paidAmount}
                  onChange={onPaidAmountChange}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>

            {paidAmount && parseFloat(paidAmount.replace(/[^\d,]/g, '').replace(',', '.')) > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-medium mb-2">Resumo</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Valor mensal:</span>{' '}
                    <span className="text-orange-400 font-medium">{paidAmount}</span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Próxima cobrança:</span>{' '}
                    {(() => {
                      const [year, month, day] = paymentDate.split('-').map(Number)
                      const nextDate = new Date(year, month - 1, day)
                      nextDate.setMonth(nextDate.getMonth() + 1)
                      return nextDate.toLocaleDateString('pt-BR')
                    })()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Adicionar Assinante
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
