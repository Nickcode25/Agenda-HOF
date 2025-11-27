import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { Save, Upload, X, User, Phone as PhoneIcon, Home, FileText, Briefcase } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import SearchableSelect from '@/components/SearchableSelect'

export default function ProfessionalForm() {
  const add = useProfessionals(s => s.add)
  const professionals = useProfessionals(s => s.professionals)
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [clinic, setClinic] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  // Verificação de duplicação
  const duplicateNameWarning = name.trim().length > 0 && professionals.some(
    p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
  )

  const duplicateCpfWarning = cpf.replace(/\D/g, '').length > 0 && professionals.some(
    p => p.cpf?.replace(/\D/g, '') === cpf.replace(/\D/g, '')
  )

  const duplicateRegWarning = registrationNumber.trim().length > 0 && professionals.some(
    p => p.registrationNumber?.toLowerCase().trim() === registrationNumber.toLowerCase().trim()
  )

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

  function formatCEP(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return cep
  }

  async function fetchAddressByCEP(cepValue: string) {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      } else {
        showToast('CEP não encontrado', 'warning')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      showToast('Erro ao buscar CEP', 'error')
    } finally {
      setIsLoadingCep(false)
    }
  }

  function handleCEPChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCEP(e.target.value)
    setCep(formatted)

    const cleanCep = formatted.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      fetchAddressByCEP(formatted)
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()

    // Validações
    if (duplicateNameWarning) {
      showToast(`Já existe um profissional cadastrado com o nome "${trimmedName}"`, 'error')
      return
    }

    if (cpf.replace(/\D/g, '').length > 0 && duplicateCpfWarning) {
      showToast(`Já existe um profissional cadastrado com o CPF ${cpf}`, 'error')
      return
    }

    if (registrationNumber.trim() && duplicateRegWarning) {
      showToast(`Já existe um profissional cadastrado com o registro ${registrationNumber}`, 'error')
      return
    }

    try {
      const id = await add({
        name: trimmedName,
        specialty,
        birthDate: birthDate || undefined,
        registrationNumber,
        cpf,
        phone,
        email,
        clinic: clinic || undefined,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        notes: notes || undefined,
        photoUrl,
        active: true,
      })

      if (id) {
        showToast('Profissional cadastrado com sucesso!', 'success')
        navigate(`/app/profissionais/${id}`)
      } else {
        showToast('Erro ao salvar profissional', 'error')
      }
    } catch (error) {
      console.error('Erro ao criar profissional:', error)
      showToast('Erro ao salvar profissional: ' + (error as Error).message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Profissional</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastre um novo profissional de saúde</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/profissionais"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="professional-form"
              disabled={duplicateNameWarning || duplicateCpfWarning || duplicateRegWarning}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                duplicateNameWarning || duplicateCpfWarning || duplicateRegWarning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              Salvar Profissional
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="professional-form" onSubmit={onSubmit} className="space-y-4">
          {/* Seção: Informações Básicas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-xs text-gray-500">Dados principais do profissional</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr(a). Nome Completo"
                  required
                  className={`w-full bg-gray-50 border ${
                    duplicateNameWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateNameWarning && (
                  <p className="text-xs text-red-500 mt-0.5">Já existe um profissional com este nome</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full bg-gray-50 border ${
                    duplicateCpfWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateCpfWarning && (
                  <p className="text-xs text-red-500 mt-0.5">CPF já cadastrado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade
                </label>
                <SearchableSelect
                  options={[
                    { value: 'Biomédico(a)', label: 'Biomédico(a)' },
                    { value: 'Biólogo(a)', label: 'Biólogo(a)' },
                    { value: 'Dentista', label: 'Dentista' },
                    { value: 'Enfermeiro(a)', label: 'Enfermeiro(a)' },
                    { value: 'Esteticista', label: 'Esteticista' },
                    { value: 'Farmacêutico(a)', label: 'Farmacêutico(a)' },
                    { value: 'Fisioterapeuta', label: 'Fisioterapeuta' },
                    { value: 'Médico(a)', label: 'Médico(a)' },
                    { value: 'Harmonização Orofacial', label: 'Harmonização Orofacial' }
                  ]}
                  value={specialty}
                  onChange={setSpecialty}
                  placeholder="Selecione a especialidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registro Profissional
                </label>
                <input
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="CRO, CRM, COREN, etc"
                  className={`w-full bg-gray-50 border ${
                    duplicateRegWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateRegWarning && (
                  <p className="text-xs text-red-500 mt-0.5">Registro já cadastrado</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Contato */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <PhoneIcon size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contato</h3>
                <p className="text-xs text-gray-500">Formas de comunicação</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clínica/Consultório</label>
                <input
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="Nome da clínica"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Home size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Endereço</h3>
                <p className="text-xs text-gray-500">Informações de localização</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                  value={cep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                {isLoadingCep ? (
                  <p className="text-xs text-blue-500 mt-0.5">Buscando...</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Auto-preenchido</p>
                )}
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Será preenchida automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, Sala..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Será preenchido automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Será preenchida automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Observações</h3>
                <p className="text-xs text-gray-500">Informações adicionais</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Profissional</label>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="relative">
                      <img src={photoUrl} alt="Prévia" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(undefined)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      id="professional-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto}
                      className="hidden"
                    />
                    <label
                      htmlFor="professional-photo-upload"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 cursor-pointer transition-all font-medium text-sm"
                    >
                      <Upload size={14} />
                      {photoUrl ? 'Alterar' : 'Escolher Foto'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (máx. 5MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o profissional..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to="/app/profissionais"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={duplicateNameWarning || duplicateCpfWarning || duplicateRegWarning}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  duplicateNameWarning || duplicateCpfWarning || duplicateRegWarning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                Salvar Profissional
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
