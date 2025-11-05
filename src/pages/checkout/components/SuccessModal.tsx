import { Check, CreditCard } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-green-500/20 animate-scaleIn">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
              <Check className="w-16 h-16 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Assinatura Criada!
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Bem-vindo ao Agenda+ HOF
        </p>

        {/* Informações da Assinatura */}
        <div className="bg-gray-700/50 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Cartão</p>
                <p className="text-white font-medium">**** **** **** {subscriptionData.cardLastDigits}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Valor mensal:</span>
              <span className="text-2xl font-bold text-green-400">
                R$ {subscriptionData.amount.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Próxima cobrança:</span>
              <span className="text-white font-medium">
                {new Date(subscriptionData.nextBillingDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Mensagens de Sucesso */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-sm">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300">Sua conta foi criada e o acesso está liberado!</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300">Você será cobrado automaticamente todo mês</p>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={onNavigate}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/30"
        >
          Acessar o Sistema
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Redirecionando automaticamente em 3 segundos...
        </p>
      </div>
    </div>
  )
}
