import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { Save, ArrowLeft, Upload, X, User, Phone as PhoneIcon, Home, Camera } from 'lucide-react'

export default function ProfessionalEdit() {
  const { id } = useParams()
  const { professionals, update, fetchAll } = useProfessionals(s => ({
    professionals: s.professionals,
    update: s.update,
    fetchAll: s.fetchAll
  }))
  const navigate = useNavigate()
  const professional = professionals.find(p => p.id === id)

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (professional) {
      setPhotoUrl(professional.photoUrl)
      setName(professional.name || '')
      setSpecialty(professional.specialty || '')
      setRegistrationNumber(professional.registrationNumber || '')
      setCpf(professional.cpf || '')
      setPhone(professional.phone || '')
      setEmail(professional.email || '')
      setCep(professional.cep || '')
      setStreet(professional.street || '')
      setNeighborhood(professional.neighborhood || '')
      setCity(professional.city || '')
      setState(professional.state || '')
      setNumber(professional.number || '')
      setComplement(professional.complement || '')
    }
  }, [professional])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate(`/app/profissionais/${id}`)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate, id])

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Profissional não encontrado.</p>
          <Link to="/app/profissionais" className="text-orange-500 hover:text-orange-600 hover:underline">Voltar para lista</Link>
        </div>
      </div>
    )
  }

  function formatCPF(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return cpf
  }

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2')
      } else {
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2')
      }
    }
    return phone
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function handleCepBlur() {
    const cepNumbers = cep.replace(/\D/g, '')
    if (cepNumbers.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setLoadingCep(false)
    }
  }

  function formatCep(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return cep
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCep(e.target.value)
    setCep(formatted)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await update(id!, {
      name,
      specialty,
      registrationNumber,
      cpf,
      phone,
      email,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      photoUrl,
    })
    navigate(`/app/profissionais/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/app/profissionais/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Profissional</h1>
            <p className="text-sm text-gray-500">Atualize os dados do profissional</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-orange-50 rounded-lg">
                <User size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
                <p className="text-xs text-gray-500">Informações principais do profissional</p>
              </div>
            </div>

            <div className="p-6">
              {/* Photo Section */}
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={name}
                        className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">{getInitials(name)}</span>
                      </div>
                    )}
                    <label
                      htmlFor="photo-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={24} className="text-white" />
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto}
                      className="hidden"
                    />
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(undefined)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Clique para alterar</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Dr(a). Nome Completo"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade *</label>
                    <input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      placeholder="Ex: Harmonização Orofacial"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registro Profissional *</label>
                    <input
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                      placeholder="Ex: CRO-MG 12345"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    value={cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <PhoneIcon size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contato</h3>
                <p className="text-xs text-gray-500">Formas de comunicação</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Endereço</h3>
                <p className="text-xs text-gray-500">Informações de localização</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    value={cep}
                    onChange={handleCepChange}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  {loadingCep && <p className="text-xs text-orange-500 mt-1">Buscando endereço...</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, Sala..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua, Avenida..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
            <Link
              to={`/app/profissionais/${id}`}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
