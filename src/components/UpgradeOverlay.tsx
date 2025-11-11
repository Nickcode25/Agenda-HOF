import { Lock, Sparkles, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UpgradeOverlayProps {
  message?: string
  feature?: string
}

export default function UpgradeOverlay({
  message = 'Esta funcionalidade está bloqueada',
  feature = 'todas as funcionalidades'
}: UpgradeOverlayProps) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 backdrop-blur-md">
      <div className="max-w-lg w-full mx-4 my-8 overflow-y-auto max-h-screen">
        {/* Card Premium */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 text-center">
            {/* Lock Icon */}
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-orange-500/20 to-pink-500/20 p-4 rounded-2xl border border-orange-500/30">
                <Lock className="w-12 h-12 text-orange-400" />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {message}
            </h2>
            <p className="text-gray-400 mb-6">
              Faça upgrade para o plano Premium e desbloqueie {feature}
            </p>

            {/* Benefícios */}
            <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Plano Premium</h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Agendamentos ilimitados</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Gestão completa de pacientes</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Controle de estoque e vendas</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Relatórios financeiros completos</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Prontuários médicos digitais</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-300">Suporte prioritário</span>
                </div>
              </div>

              {/* Preço */}
              <div className="border-t border-gray-700/50 pt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-white">R$ 99</span>
                  <span className="text-xl text-gray-400">,90</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </div>
            </div>

            {/* Botão de Upgrade */}
            <button
              onClick={() => navigate('/planos')}
              className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Ver Planos</span>
            </button>

            {/* Info adicional */}
            <p className="text-xs text-gray-500 mt-4">
              💳 Cancele quando quiser • Sem taxas ocultas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
