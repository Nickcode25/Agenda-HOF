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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full">
        {/* Card Premium */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur-xl opacity-20" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/30 p-8 text-center">
            {/* Lock Icon */}
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-lg opacity-30" />
              <div className="relative bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
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
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Plano Premium</h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300">Agendamentos ilimitados</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300">Gestão completa de pacientes</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300">Controle de estoque e vendas</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300">Relatórios financeiros completos</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-300">Prontuários médicos digitais</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-orange-400" />
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
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Ver Planos</span>
            </button>

            {/* Info adicional */}
            <p className="text-xs text-gray-500 mt-4">
              Cancele quando quiser • Sem taxas ocultas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
