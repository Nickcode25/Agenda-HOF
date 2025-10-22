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
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-blue-500/30">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Acesso Premium Necessário</span>
            </div>

            {/* Título */}
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Desbloqueie Todo o
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Potencial do Agenda+ HOF
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transforme a gestão da sua clínica com acesso completo a todas as funcionalidades profissionais
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000" />

            {/* Card principal */}
            <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden">
              {/* Badge de Recomendado */}
              <div className="absolute top-6 right-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full border border-yellow-500/30">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">Mais Popular</span>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="space-y-8">
                  {/* Header do Plano */}
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Plano Profissional</h3>
                    <p className="text-gray-400">Acesso completo ao sistema</p>
                  </div>

                  {/* Preço */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-bold text-white">R$ 109</span>
                    <div className="text-gray-400">
                      <span className="text-2xl">,90</span>
                      <span className="text-lg">/mês</span>
                    </div>
                  </div>

                  {/* Cupom de desconto */}
                  <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20">
                    <Zap className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-green-400">Primeira mensalidade com 95% de desconto!</span>
                      <br />
                      Use o cupom <span className="font-mono font-bold text-green-400">PROMO95</span> no checkout
                    </p>
                  </div>

                  {/* Botão de Ação */}
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl" />
                    <div className="relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-2xl transition-all duration-300 transform group-hover:scale-[1.02]">
                      <span className="text-lg font-bold text-white">
                        {loading ? 'Carregando...' : 'Assinar Agora'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Garantia */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Pagamento 100% seguro via PagBank</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-gray-400">
            Ferramentas profissionais para gestão completa da sua clínica
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-25 blur transition duration-500" />

                <div className="relative h-full p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                  <div className="flex flex-col h-full space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400 flex-grow">
                      {feature.description}
                    </p>
                    <div className="pt-4 border-t border-gray-700/50">
                      <div className="flex items-center gap-2 text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Incluído no plano</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Final */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-25" />
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para transformar sua clínica?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de profissionais que já estão usando o Agenda+ HOF
            </p>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-2xl text-lg font-bold text-white transition-all duration-300 transform hover:scale-105"
            >
              {loading ? 'Carregando...' : 'Começar Agora'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 Agenda+ HOF. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}
