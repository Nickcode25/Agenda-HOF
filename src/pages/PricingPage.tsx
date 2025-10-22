import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Star, Zap, Shield, TrendingUp, Clock, Users, Calendar, Package, DollarSign, ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function PricingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Dados vindos do modal de registro da landing page
  const registrationData = location.state as {
    name?: string
    email?: string
    phone?: string
    password?: string
  } | null

  const handleSubscribe = () => {
    setLoading(true)

    // Se tem dados do registro, usar eles. Senão, usar dados do usuário logado
    const checkoutData = registrationData ? {
      name: registrationData.name || '',
      email: registrationData.email || '',
      phone: registrationData.phone || '',
      password: registrationData.password || '',
      existingUser: false // Novo usuário vindo do registro
    } : {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      password: '', // Usuário já tem conta
      existingUser: true // Flag para não criar conta novamente
    }

    // Redirecionar para checkout com dados
    navigate('/checkout', {
      state: checkoutData
    })
  }

  const features = [
    {
      icon: Calendar,
      title: 'Sistema Completo de Agendamentos',
      description: 'Gerencie todos os seus agendamentos de forma profissional'
    },
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Cadastro completo com histórico e fotos médicas'
    },
    {
      icon: Package,
      title: 'Controle de Estoque',
      description: 'Gerencie produtos e materiais com alertas de estoque baixo'
    },
    {
      icon: DollarSign,
      title: 'Gestão Financeira',
      description: 'Relatórios completos de vendas e mensalidades'
    },
    {
      icon: TrendingUp,
      title: 'Dashboard Analytics',
      description: 'Métricas em tempo real do seu negócio'
    },
    {
      icon: Clock,
      title: 'Disponibilidade 24/7',
      description: 'Acesse de qualquer lugar, a qualquer momento'
    },
    {
      icon: Shield,
      title: 'Segurança e Backup',
      description: 'Seus dados protegidos e sempre disponíveis'
    },
    {
      icon: Zap,
      title: 'Atualizações Constantes',
      description: 'Novas funcionalidades sem custo adicional'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Compacto */}
      <div className="relative overflow-hidden">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-blue-500/30">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Acesso Premium Necessário</span>
            </div>

            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Desbloqueie Todo o
              <span className="block mt-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Potencial do Agenda+ HOF
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base text-gray-300 max-w-xl mx-auto">
              Transforme a gestão da sua clínica com acesso completo a todas as funcionalidades profissionais
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Card Compacto */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />

            {/* Card principal */}
            <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
              {/* Badge de Recomendado */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full border border-yellow-500/30">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400">Mais Popular</span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="space-y-5">
                  {/* Header do Plano */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Plano Profissional</h3>
                    <p className="text-sm text-gray-400">Acesso completo ao sistema</p>
                  </div>

                  {/* Preço */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">R$ 109</span>
                    <div className="text-gray-400">
                      <span className="text-xl">,90</span>
                      <span className="text-base">/mês</span>
                    </div>
                  </div>

                  {/* Cupom de desconto */}
                  <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl border border-green-500/20">
                    <Zap className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300">
                      <span className="font-semibold text-green-400">Primeira mensalidade com 95% de desconto!</span>
                      {' '}Use o cupom <span className="font-mono font-bold text-green-400">PROMO95</span> no checkout
                    </p>
                  </div>

                  {/* Botão de Ação */}
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl" />
                    <div className="relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-xl transition-all duration-300 transform group-hover:scale-[1.02]">
                      <span className="text-base font-bold text-white">
                        {loading ? 'Carregando...' : 'Assinar Agora'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Garantia */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                    <span>Pagamento 100% seguro via PagBank</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid Compacto */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-sm text-gray-400">
            Ferramentas profissionais para gestão completa da sua clínica
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300" />

                <div className="relative h-full p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                  <div className="flex flex-col h-full space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-400 flex-grow">
                      {feature.description}
                    </p>
                    <div className="pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Incluído no plano</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Final Compacto */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20" />
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Pronto para transformar sua clínica?
            </h2>
            <p className="text-base text-gray-300 mb-6 max-w-xl mx-auto">
              Junte-se a centenas de profissionais que já estão usando o Agenda+ HOF
            </p>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-xl text-base font-bold text-white transition-all duration-300 transform hover:scale-105"
            >
              {loading ? 'Carregando...' : 'Começar Agora'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-xs">
        <p>© 2024 Agenda+ HOF. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}
