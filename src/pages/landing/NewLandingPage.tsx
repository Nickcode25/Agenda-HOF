import { useState } from 'react'
import { Check, Calendar, Users, BarChart3, Package, ArrowRight, Sparkles, Shield, Zap, TrendingUp, Star, ChevronDown, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export default function NewLandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = await signIn(email, password)

    if (success) {
      navigate('/app/agenda')
    } else {
      setError('Email ou senha incorretos')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    navigate('/checkout', {
      state: {
        name: fullName,
        email: email,
        password: password,
      }
    })
  }

  const openRegisterModal = () => {
    setShowRegisterModal(true)
    setShowLogin(false)
  }

  const closeRegisterModal = () => {
    setShowRegisterModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <h1 className="font-black text-3xl flex items-center tracking-tight">
                <span className="text-white">Agenda</span>
                <span className="text-orange-500 ml-2">HOF</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
              >
                Entrar
              </button>
              <button
                onClick={openRegisterModal}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Gradient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Transforme a
                <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent mt-2">
                  gestão da sua clínica
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed">
                Sistema completo de agendamento e gestão desenvolvido especialmente para profissionais de
                <span className="text-orange-400 font-semibold"> Harmonização Orofacial</span>.
                Controle total da sua clínica em um só lugar.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={openRegisterModal}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  Começar Gratuitamente
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700/50 transition-all flex items-center gap-2"
                >
                  <Play size={18} />
                  Ver Demonstração
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-8 pt-8 border-t border-gray-800">
                <div>
                  <div className="text-3xl font-bold text-white">350+</div>
                  <div className="text-sm text-gray-400">Profissionais</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-sm text-gray-400">Satisfação</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="fill-yellow-500" size={18} />
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">5.0 Avaliação</div>
                </div>
              </div>
            </div>

            {/* Right Visual - Modern Design */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Animated Background Circles */}
              <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Modern Visual Element */}
              <div className="relative mb-8">
                {/* Central Circle with Icons */}
                <div className="relative w-64 h-64 lg:w-72 lg:h-72 flex items-center justify-center">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500/30" style={{ animation: 'spin 20s linear infinite' }}>
                    <div className="absolute -top-2 left-1/2 w-4 h-4 bg-orange-500 rounded-full -translate-x-1/2"></div>
                    <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-orange-400 rounded-full -translate-x-1/2"></div>
                  </div>

                  {/* Middle ring */}
                  <div className="absolute inset-8 rounded-full border border-orange-500/20"></div>

                  {/* Inner glowing circle */}
                  <div className="absolute inset-16 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 flex items-center justify-center">
                    <div className="relative">
                      {/* Calendar Icon in center */}
                      <div className="relative z-10">
                        <Calendar size={64} className="text-orange-500 drop-shadow-2xl" strokeWidth={1.5} />
                      </div>
                      {/* Pulse effect */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-orange-500/30 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  </div>

                  {/* Floating icons around */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <Users size={20} className="text-orange-500" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <BarChart3 size={20} className="text-orange-500" />
                    </div>
                  </div>

                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <Package size={20} className="text-orange-500" />
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <Sparkles size={20} className="text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Name and Tagline */}
              <div className="text-center space-y-3 relative z-10">
                <div className="font-black text-4xl lg:text-5xl flex items-center justify-center tracking-tight">
                  <span className="text-white">Agenda</span>
                  <span className="text-orange-500 ml-2">HOF</span>
                </div>
                <p className="text-lg lg:text-xl font-semibold text-gray-300">
                  O futuro da gestão em
                </p>
                <p className="text-xl lg:text-2xl text-orange-400 font-bold">
                  Harmonização Orofacial
                </p>
              </div>

              {/* Benefits Cards Row */}
              <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-xl relative z-10">
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 hover:border-orange-500/30 transition-all group">
                  <div className="flex flex-col items-center text-center">
                    <Zap className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                    <div className="text-lg font-bold text-white">Eficiência</div>
                    <div className="text-xs text-gray-400 mt-1">Automatize processos</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 hover:border-orange-500/30 transition-all group">
                  <div className="flex flex-col items-center text-center">
                    <Shield className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                    <div className="text-lg font-bold text-white">Segurança</div>
                    <div className="text-xs text-gray-400 mt-1">Dados protegidos</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 hover:border-orange-500/30 transition-all group">
                  <div className="flex flex-col items-center text-center">
                    <TrendingUp className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                    <div className="text-lg font-bold text-white">Crescimento</div>
                    <div className="text-xs text-gray-400 mt-1">Aumente resultados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center mt-16">
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors group"
            >
              <span className="text-sm">Descubra mais</span>
              <ChevronDown size={24} className="animate-bounce group-hover:text-orange-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-6">
              Recursos Completos
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Tudo que você precisa em
              <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mt-2">
                um único sistema
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Ferramentas poderosas para gerenciar sua clínica de harmonização orofacial com eficiência e profissionalismo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Agenda Inteligente',
                description: 'Sistema completo de agendamento com lembretes automáticos, gestão de fila de espera e sincronização em tempo real.',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-500/10'
              },
              {
                icon: Users,
                title: 'Gestão de Pacientes',
                description: 'Prontuário eletrônico completo, histórico de procedimentos e acompanhamento personalizado de cada paciente.',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-500/10'
              },
              {
                icon: BarChart3,
                title: 'Analytics Avançado',
                description: 'Dashboard com métricas em tempo real, relatórios detalhados e insights para tomar decisões estratégicas.',
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-500/10'
              },
              {
                icon: Package,
                title: 'Controle de Estoque',
                description: 'Gestão completa de insumos, alertas de estoque baixo e controle de validade de produtos.',
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-500/10'
              },
              {
                icon: TrendingUp,
                title: 'Gestão Financeira',
                description: 'Controle de vendas, comissionamento automático e relatórios financeiros completos.',
                color: 'from-pink-500 to-pink-600',
                bgColor: 'bg-pink-500/10'
              },
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Dados criptografados, backups automáticos e conformidade com LGPD para proteção total.',
                color: 'from-cyan-500 to-cyan-600',
                bgColor: 'bg-cyan-500/10'
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="group relative bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Benefits List */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-6">
                Por que escolher?
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Resultados que
                <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mt-2">
                  você vai sentir
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-12">
                Benefícios comprovados por centenas de profissionais de harmonização orofacial
              </p>

              <div className="space-y-6">
                {[
                  { icon: Zap, title: 'Reduza 70% do tempo em agendamentos', description: 'Automação inteligente que agiliza todo o processo' },
                  { icon: TrendingUp, title: 'Aumente seu faturamento em até 40%', description: 'Gestão eficiente que gera mais resultados' },
                  { icon: Shield, title: '100% seguro e conforme LGPD', description: 'Seus dados e dos pacientes totalmente protegidos' },
                  { icon: Sparkles, title: 'Foque no que importa: seus pacientes', description: 'Menos tempo com burocracia, mais tempo cuidando' }
                ].map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="text-orange-500" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{benefit.title}</h4>
                        <p className="text-gray-400">{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right - Image/Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-3xl rounded-3xl"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Economia de Tempo', value: '70%', color: 'text-blue-400' },
                    { label: 'Mais Faturamento', value: '+40%', color: 'text-green-400' },
                    { label: 'Satisfação', value: '98%', color: 'text-purple-400' },
                    { label: 'Suporte', value: '24/7', color: 'text-orange-400' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                      <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Star className="text-orange-500 fill-orange-500" size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="fill-yellow-500" size={14} />
                        ))}
                      </div>
                      <div className="text-sm text-gray-300">Avaliação 5.0/5.0</div>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">
                    "Revolucionou completamente a forma como gerencio minha clínica. Indispensável!"
                  </p>
                  <div className="mt-3 text-sm text-gray-400">
                    - Dra. Ana Paula, Harmonização Orofacial
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptMC0ydjJ6bS0yIDB2Mmgydi0yem0wLTJ2Mmgydi0yem0tMiAwdjJoMnYtMnptMC0ydjJoMnYtMnptLTIgMHYyaDJ2LTJ6bTAtMnYyaDJ2LTJ6bS0yIDB2Mmgydi0yem0wLTJ2Mmgydi0yem0tMiAwdjJoMnYtMnptMC0ydjJoMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Pronto para transformar
                <span className="block">sua clínica?</span>
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de profissionais que já revolucionaram a gestão de suas clínicas
              </p>
              <button
                onClick={openRegisterModal}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-lg group"
              >
                Começar Agora - É Grátis
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <div className="mt-6 text-white/80 text-sm">
                <Check className="inline mr-2" size={16} /> Sem cartão de crédito • <Check className="inline mx-2" size={16} /> Suporte 24/7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
                <p className="text-gray-400">Entre para acessar sua conta</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-gray-400">Não tem uma conta? </span>
                <button
                  onClick={() => {
                    setShowLogin(false)
                    openRegisterModal()
                  }}
                  className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
                >
                  Cadastre-se
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
              <button
                onClick={closeRegisterModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Comece sua transformação
                </h2>
                <p className="text-gray-400">Preencha seus dados para continuar</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Senha *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-gray-400 text-sm">Já tem uma conta? </span>
                <button
                  onClick={() => {
                    setShowRegisterModal(false)
                    setShowLogin(true)
                  }}
                  className="text-orange-500 hover:text-orange-400 font-medium transition-colors text-sm"
                >
                  Faça login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <div className="font-black text-2xl flex items-center tracking-tight">
                <span className="text-white">Agenda</span>
                <span className="text-orange-500 ml-2">HOF</span>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>© 2025 Agenda HOF - Todos os direitos reservados</p>
              <p className="mt-1">Desenvolvido para profissionais de Harmonização Orofacial</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
