import { useEffect } from 'react'
import {
  Calendar,
  Users,
  BarChart3,
  Package,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Star,
  Play,
  Droplet,
  Syringe
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

export default function NewLandingPage() {
  const navigate = useNavigate()

  // Redirecionar para reset-password se houver token de recuperação na URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      // Redirecionar para página de reset de senha com o hash preservado
      navigate('/reset-password' + window.location.hash)
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header */}
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
              <Link
                to="/login"
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                aria-label="Entrar"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30"
                aria-label="Começar Agora"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        {/* Gradient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Transforme a
                <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-clip-text text-transparent mt-2">
                  gestão da sua clínica
                </span>
              </h2>

              <p className="text-xl text-gray-600 leading-relaxed">
                Sistema completo de agendamento e gestão desenvolvido especialmente para profissionais de
                <span className="text-orange-500 font-semibold"> Harmonização Orofacial</span>.
                Controle total da sua clínica em um só lugar.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="group px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                  aria-label="Começar Gratuitamente"
                >
                  Começar Gratuitamente
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group px-8 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-sm"
                  aria-label="Ver Demonstração"
                >
                  <Play size={18} />
                  Ver Demonstração
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-gray-900">350+</div>
                  <div className="text-sm text-gray-500">Profissionais</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-500">Satisfação</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1" aria-label="5 estrelas">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="fill-yellow-500" size={18} />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">5.0 Avaliação</div>
                </div>
              </div>
            </div>

            {/* Right Visual - Modern Design */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Animated Background Circles */}
              <div className="absolute inset-0" aria-hidden="true">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Modern Visual Element */}
              <div className="relative mb-8">
                {/* Central Circle with Icons */}
                <div className="relative w-64 h-64 lg:w-72 lg:h-72 flex items-center justify-center">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500/30" style={{ animation: 'spin 20s linear infinite' }} aria-hidden="true">
                    <div className="absolute -top-2 left-1/2 w-4 h-4 bg-orange-500 rounded-full -translate-x-1/2"></div>
                    <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-orange-400 rounded-full -translate-x-1/2"></div>
                  </div>

                  {/* Middle ring */}
                  <div className="absolute inset-8 rounded-full border border-orange-500/20" aria-hidden="true"></div>

                  {/* Inner glowing circle */}
                  <div className="absolute inset-16 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-400/10 backdrop-blur-sm border border-orange-500/20 flex items-center justify-center">
                    <div className="relative">
                      {/* Calendar Icon in center */}
                      <div className="relative z-10">
                        <Calendar size={64} className="text-orange-500 drop-shadow-2xl" strokeWidth={1.5} aria-hidden="true" />
                      </div>
                      {/* Pulse effect */}
                      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                        <div className="w-20 h-20 bg-orange-500/20 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  </div>

                  {/* Floating icons around */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Pacientes">
                      <Users size={20} className="text-orange-500" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Analytics">
                      <BarChart3 size={20} className="text-orange-500" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Produtos">
                      <Droplet size={20} className="text-orange-500" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Procedimentos">
                      <Syringe size={20} className="text-orange-500" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Name and Tagline */}
              <div className="text-center space-y-3 relative z-10">
                <div className="font-black text-4xl lg:text-5xl flex items-center justify-center tracking-tight">
                  <span className="text-gray-900">Agenda</span>
                  <span className="text-orange-500 ml-2">HOF</span>
                </div>
                <p className="text-lg lg:text-xl font-semibold text-gray-600">
                  O futuro da gestão em
                </p>
                <p className="text-xl lg:text-2xl text-orange-500 font-bold">
                  Harmonização Orofacial
                </p>
              </div>

              {/* Benefits Cards Row */}
              <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-xl relative z-10">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-500/50 hover:shadow-lg transition-all group shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <Zap className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} aria-hidden="true" />
                    <div className="text-lg font-bold text-gray-900">Eficiência</div>
                    <div className="text-xs text-gray-500 mt-1">Automatize processos</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-500/50 hover:shadow-lg transition-all group shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <Shield className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} aria-hidden="true" />
                    <div className="text-lg font-bold text-gray-900">Segurança</div>
                    <div className="text-xs text-gray-500 mt-1">Dados protegidos</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-500/50 hover:shadow-lg transition-all group shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <TrendingUp className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} aria-hidden="true" />
                    <div className="text-lg font-bold text-gray-900">Crescimento</div>
                    <div className="text-xs text-gray-500 mt-1">Aumente resultados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pt-8 pb-20 px-4 bg-gradient-to-b from-transparent to-gray-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-orange-600 text-sm font-medium mb-6">
              Recursos Completos
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Tudo que você precisa em
              <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mt-2">
                um único sistema
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ferramentas poderosas para gerenciar sua clínica de harmonização orofacial com eficiência e profissionalismo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Agenda Inteligente',
                description: 'Sistema completo de agendamento com lembretes automáticos, gestão de fila de espera e sincronização em tempo real.',
              },
              {
                icon: Users,
                title: 'Gestão de Pacientes',
                description: 'Prontuário eletrônico completo, histórico de procedimentos e acompanhamento personalizado de cada paciente.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Avançado',
                description: 'Dashboard com métricas em tempo real, relatórios detalhados e insights para tomar decisões estratégicas.',
              },
              {
                icon: Package,
                title: 'Controle de Estoque',
                description: 'Gestão completa de insumos, alertas de estoque baixo e controle de validade de produtos.',
              },
              {
                icon: TrendingUp,
                title: 'Gestão Financeira',
                description: 'Controle de vendas, comissionamento automático e relatórios financeiros completos.',
              },
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Dados criptografados, backups automáticos e conformidade com LGPD para proteção total.',
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-orange-500/50 hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                      <Icon className="text-orange-500" size={32} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Benefits List */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-orange-600 text-sm font-medium mb-6">
                Por que escolher?
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Resultados que
                <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mt-2">
                  você vai sentir
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-12">
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
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="text-orange-500" size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h4>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right - Image/Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-400/10 blur-3xl rounded-3xl" aria-hidden="true"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Economia de Tempo', value: '70%', color: 'text-blue-500' },
                    { label: 'Mais Faturamento', value: '+40%', color: 'text-green-500' },
                    { label: 'Satisfação', value: '98%', color: 'text-purple-500' },
                    { label: 'Suporte', value: '24/7', color: 'text-orange-500' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Star className="text-orange-500 fill-orange-500" size={24} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-yellow-500 mb-1" aria-label="5 estrelas">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="fill-yellow-500" size={14} />
                        ))}
                      </div>
                      <div className="text-sm text-gray-700">Avaliação 5.0/5.0</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">
                    &ldquo;Revolucionou completamente a forma como gerencio minha clínica. Indispensável!&rdquo;
                  </p>
                  <div className="mt-3 text-sm text-gray-600">
                    - Dra. Ana Paula, Harmonização Orofacial
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-white rounded-3xl border border-gray-200 p-16 text-center overflow-hidden shadow-xl">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-orange-600 text-sm font-medium mb-8">
                Comece Gratuitamente
              </div>

              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Pronto para transformar
                <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mt-2">
                  sua clínica?
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Junte-se a centenas de profissionais que já revolucionaram a gestão de suas clínicas
              </p>

              <Link
                to="/signup"
                className="inline-flex items-center gap-3 px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 text-lg group"
                aria-label="Começar Agora - É Grátis"
              >
                Começar Agora - É Grátis
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <div className="font-black text-2xl flex items-center tracking-tight">
                <span className="text-gray-900">Agenda</span>
                <span className="text-orange-500 ml-2">HOF</span>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm">
              <p>© 2025 Agenda HOF - Todos os direitos reservados</p>
              <p className="mt-1">Desenvolvido para profissionais de Harmonização Orofacial</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
