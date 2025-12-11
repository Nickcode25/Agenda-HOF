import { Check, CreditCard, Calendar, Sparkles } from 'lucide-react'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'

interface SuccessModalProps {
  show: boolean
  subscriptionData: {
    cardLastDigits: string
    amount: number
    nextBillingDate: string
  } | null
  onNavigate: () => void
}

export default function SuccessModal({ show, subscriptionData, onNavigate }: SuccessModalProps) {
  if (!show || !subscriptionData) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-5 shadow-lg shadow-green-500/30">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Assinatura Criada!
          </h2>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Bem-vindo ao Agenda HOF
            <Sparkles className="w-4 h-4 text-orange-500" />
          </p>
        </div>

        {/* Informações da Assinatura */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
          {/* Cartão */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Cartão</p>
              <p className="text-gray-900 font-semibold">**** **** **** {subscriptionData.cardLastDigits}</p>
            </div>
          </div>

          {/* Valor e Próxima Cobrança */}
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Valor mensal:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {subscriptionData.amount.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Próxima cobrança:
              </span>
              <span className="text-gray-900 font-medium">
                {formatDateTimeBRSafe(subscriptionData.nextBillingDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Mensagens de Sucesso */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="bg-green-500 rounded-full p-1">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
            <p className="text-gray-700">Sua conta foi criada e o acesso está liberado!</p>
          </div>
          <div className="flex items-center gap-3 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="bg-green-500 rounded-full p-1">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
            <p className="text-gray-700">Você será cobrado automaticamente todo mês</p>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={onNavigate}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25"
        >
          Acessar o Sistema
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Clique no botão acima para acessar sua conta
        </p>
      </div>
    </div>
  )
}
