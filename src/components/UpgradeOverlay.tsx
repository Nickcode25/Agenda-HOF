import { Lock, Sparkles, Check, ArrowLeft, Calendar, Users, Package, BarChart3 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/store/auth'

interface UpgradeOverlayProps {
  message?: string
  feature?: string
}

export default function UpgradeOverlay({
  message = 'Seu período de teste expirou',
  feature = 'todas as funcionalidades premium'
}: UpgradeOverlayProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Background com gradiente light */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100">
        {/* Efeitos de gradiente decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <h1 className="font-black text-3xl flex items-center tracking-tight">
                <span className="text-gray-900">Agenda</span>
                <span className="text-orange-500 ml-2">HOF</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Sair
              </button>
              <Link
                to="/planos"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30"
              >
                Ver Planos
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Container principal */}
      <div className="relative h-full overflow-auto pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Grid de duas colunas */}
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">

            {/* Coluna esquerda - Mensagem principal */}
            <div className="space-y-8">
              {/* Badge de status */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                <Lock className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600 text-sm font-medium">Acesso Limitado</span>
              </div>

              {/* Título principal */}
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  {message}
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Continue aproveitando todas as funcionalidades do <span className="text-orange-500 font-semibold">Agenda HOF</span> assinando nosso plano premium.
                </p>
              </div>

              {/* Features em grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Calendar, label: 'Agendamentos ilimitados' },
                  { icon: Users, label: 'Gestão de pacientes' },
                  { icon: Package, label: 'Controle de estoque' },
                  { icon: BarChart3, label: 'Relatórios financeiros' }
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Botões de ação */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/planos')}
                  className="group px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Assinar Agora
                </button>
                <button
                  onClick={handleLogout}
                  className="px-8 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar ao Início
                </button>
              </div>
            </div>

            {/* Coluna direita - Card de preço */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-3xl blur-2xl" />

              {/* Card principal */}
              <div className="relative bg-white rounded-3xl border-2 border-orange-500/30 p-8 shadow-xl">
                {/* Badge popular */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-sm font-semibold shadow-lg">
                    Recomendado
                  </div>
                </div>

                {/* Header do card */}
                <div className="text-center mb-8 pt-4">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                    <h3 className="text-2xl font-bold text-gray-900">Plano Premium</h3>
                  </div>
                  <p className="text-gray-500">Acesso completo a todas as funcionalidades</p>
                </div>

                {/* Preço */}
                <div className="text-center mb-8 py-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl text-gray-500">R$</span>
                    <span className="text-6xl font-bold text-gray-900">99</span>
                    <span className="text-2xl text-gray-500">,90</span>
                  </div>
                  <span className="text-gray-500">por mês</span>
                </div>

                {/* Lista de benefícios */}
                <div className="space-y-4 mb-8">
                  {[
                    'Agendamentos ilimitados',
                    'Agenda inteligente',
                    'Analytics Avançado',
                    'Gestão Financeira',
                    'Gestão de Pacientes',
                    'Gestão de Profissionais',
                    'Controle de Estoque'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Botão principal */}
                <button
                  onClick={() => navigate('/planos')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-center gap-2 text-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Começar Agora
                </button>

                {/* Info adicional */}
                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-500">
                    Cancele quando quiser • Sem taxas ocultas
                  </p>
                  <p className="text-xs text-gray-400">
                    Pagamento seguro via Mercado Pago
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              Dúvidas? Entre em contato pelo WhatsApp ou email
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
