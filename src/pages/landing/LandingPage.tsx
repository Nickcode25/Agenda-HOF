import { useState } from 'react'
import { Check, Calendar, Users, Clock, BarChart3, Package, ChevronRight, Sparkles, Shield, Zap, TrendingUp, Star, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

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

    // Redirecionar para checkout com os dados do usuário
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
    setCpf('')
    setPhone('')
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    }
    return cpf
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
    }
    return phone
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const features = [
    'Sistema completo para Harmonização Orofacial',
    'Gestão inteligente de pacientes e profissionais',
    'Controle de procedimentos estéticos e fila de espera',
    'Dashboard com analytics em tempo real',
    'Controle de estoque de insumos e produtos',
    'Gestão de vendas com comissionamento automático',
    'Interface moderna e intuitiva',
    'Suporte técnico especializado'
  ]

  const benefits = [
    {
      icon: Zap,
      title: 'Agilidade',
      description: 'Reduza o tempo de agendamento em até 70% com automação inteligente'
    },
    {
      icon: TrendingUp,
      title: 'Crescimento',
      description: 'Aumente seu faturamento com gestão eficiente de vendas e procedimentos'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Dados protegidos com criptografia e backups automáticos'
    },
    {
      icon: Sparkles,
      title: 'Produtividade',
      description: 'Organize sua rotina e foque no que realmente importa: seus pacientes'
    }
  ]

  const stats = [
    { value: '350+', label: 'Profissionais' },
    { value: '10x', label: 'Mais Organizado' },
    { value: '98%', label: 'Satisfação' },
    { value: '24/7', label: 'Suporte' }
  ]

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className="font-bold text-white text-xl">Agenda+ HOF</h1>
            </div>
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            >
              {showLogin ? 'Ver Planos' : 'Entrar'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!showLogin ? (
          <>
            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
              {/* Left Side - Info */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium">
                  <Sparkles size={16} />
                  Sistema #1 em Harmonização Orofacial
                </div>

                <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Transforme a gestão da sua
                  <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"> clínica de HOF</span>
                </h2>

                <p className="text-xl text-gray-400 leading-relaxed">
                  Sistema completo de agendamento e gestão desenvolvido especialmente para profissionais de Harmonização Orofacial.
                  Controle completo da sua clínica em um só lugar.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={openRegisterModal}
                    className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                  >
                    Começar Agora
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                  <button
                    onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 bg-gray-800 border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all"
                  >
                    Ver Benefícios
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 pt-8 border-t border-gray-800">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Pricing Card */}
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-3xl rounded-3xl"></div>

                <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-sm font-semibold shadow-lg">
                      <Star className="fill-white" size={16} />
                      MAIS POPULAR
                    </div>
                  </div>

                  <div className="text-orange-500 font-semibold text-sm uppercase tracking-wide mb-6 mt-4">
                    Plano Profissional
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">R$109</span>
                      <span className="text-gray-400 text-xl">,90</span>
                    </div>
                    <div className="text-gray-400 text-lg">
                      por mês
                    </div>
                    <div className="text-orange-400/80 text-sm mt-1 flex items-center gap-1">
                      <Check size={16} />
                      Mensalidade fixa sem surpresas
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Ideal para profissionais que desejam modernizar a gestão da clínica de Harmonização Orofacial com tecnologia de ponta.
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 group">
                        <div className="mt-0.5 p-1 bg-orange-500/10 rounded-full">
                          <Check className="text-orange-500" size={16} />
                        </div>
                        <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={openRegisterModal}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group"
                  >
                    Assinar Agora
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>

                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="fill-yellow-500" size={16} />
                      ))}
                    </div>
                    <div className="text-sm text-gray-400">
                      Avaliação 5.0 de +350 profissionais
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div id="benefits" className="py-16">
              <div className="text-center mb-16">
                <h3 className="text-4xl font-bold text-white mb-4">Por que escolher o Agenda+ HOF?</h3>
                <p className="text-xl text-gray-400">Benefícios que farão diferença no seu dia a dia</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="text-orange-500" size={24} />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{benefit.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="py-16 border-t border-gray-800">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Calendar className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Agenda Inteligente</h4>
                  <p className="text-gray-400">Sistema completo de agendamento com lembretes automáticos e gestão de fila de espera</p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <BarChart3 className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Analytics Avançado</h4>
                  <p className="text-gray-400">Dashboard com métricas em tempo real para tomar decisões estratégicas</p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Gestão Completa</h4>
                  <p className="text-gray-400">Controle de estoque, vendas e comissionamento tudo em um só lugar</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 blur-2xl rounded-3xl"></div>

              <div className="relative">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <span className="text-white font-bold text-2xl">H</span>
                  </div>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500 disabled:opacity-50"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                  >
                    ← Voltar para planos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 blur-2xl rounded-3xl"></div>

              {/* Close button */}
              <button
                onClick={closeRegisterModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Após o pagamento, você receberá o acesso no e-mail abaixo
                  </h2>
                  <p className="text-gray-400">Por favor, preencha seus dados para continuar</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Nome Completo */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500 disabled:opacity-50"
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500 disabled:opacity-50"
                        placeholder="seu@email.com"
                      />
                    </div>

                    {/* Senha */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Senha *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500 disabled:opacity-50"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    {/* Nome da Clínica */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Clínica/Consultório
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-500"
                        placeholder="Nome do seu estabelecimento (opcional)"
                      />
                    </div>
                  </div>

                  {/* Termos */}
                  <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <input
                      type="checkbox"
                      required
                      id="terms"
                      className="mt-1 w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-300">
                      Aceito os <span className="text-orange-500 hover:text-orange-400 cursor-pointer">termos de uso</span> e a <span className="text-orange-500 hover:text-orange-400 cursor-pointer">política de privacidade</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      )}

      {/* Footer */}
      <footer className="relative bg-gray-800/50 border-t border-gray-700/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <div className="font-bold text-white">Agenda+ HOF</div>
                <div className="text-sm text-gray-400">Sistema de Gestão HOF</div>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>© 2025 Agenda+ HOF - Todos os direitos reservados</p>
              <p className="mt-1">Desenvolvido para profissionais de Harmonização Orofacial</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
