import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Upload, X, Save, User, Phone as PhoneIcon, Home, FileText } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function PatientForm() {
  const add = usePatients(s => s.add)
  const patients = usePatients(s => s.patients)
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [profession, setProfession] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [reference, setReference] = useState('')
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [useWhatsApp, setUseWhatsApp] = useState(true)

  // Verificação de duplicação
  const duplicateNameWarning = name.trim().length > 0 && patients.some(
    p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
  )

  const duplicateCpfWarning = cpf.replace(/\D/g, '').length > 0 && patients.some(
    p => p.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
  )

  // Máscara de CPF: 000.000.000-00
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

  // Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
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

  // Máscara de CEP: 00000-000
  function formatCEP(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return cep
  }

  // Busca endereço pelo CEP
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

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
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
    const cleanCpf = cpf.replace(/\D/g, '')

    // Validação: verificar se já existe paciente com mesmo nome
    const existingByName = patients.find(
      p => p.name.toLowerCase().trim() === trimmedName.toLowerCase()
    )

    if (existingByName) {
      showToast(`Já existe um paciente cadastrado com o nome "${trimmedName}"`, 'error')
      return
    }

    // Validação: verificar se já existe paciente com mesmo CPF (se CPF foi preenchido)
    if (cleanCpf.length > 0) {
      const existingByCpf = patients.find(
        p => p.cpf.replace(/\D/g, '') === cleanCpf
      )

      if (existingByCpf) {
        showToast(`Já existe um paciente cadastrado com o CPF ${cpf}`, 'error')
        return
      }
    }

    try {
      const id = await add({
        name: trimmedName,
        cpf: cpf,
        phone: phone,
        birth_date: birthDate,
        cep: cep,
        street: street,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state,
        clinicalInfo: reference,
        notes: '',
        photoUrl,
      })

      if (id) {
        showToast('Paciente cadastrado com sucesso!', 'success')
        navigate(`/app/pacientes/${id}`)
      } else {
        showToast('Erro ao salvar paciente', 'error')
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error)
      showToast('Erro ao salvar paciente: ' + (error as Error).message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Paciente</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha as informações do paciente</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/pacientes"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="patient-form"
              disabled={duplicateNameWarning || duplicateCpfWarning}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                duplicateNameWarning || duplicateCpfWarning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              Salvar Paciente
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="patient-form" onSubmit={onSubmit} className="space-y-4">
          {/* Seção: Informações Básicas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-xs text-gray-500">Dados principais do paciente</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                  className={`w-full bg-gray-50 border ${
                    duplicateNameWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateNameWarning ? (
                  <p className="text-xs text-red-500 mt-0.5">Já existe um paciente com este nome</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Ex: João Silva Santos</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  value={cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full bg-gray-50 border ${
                    duplicateCpfWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateCpfWarning ? (
                  <p className="text-xs text-red-500 mt-0.5">CPF já cadastrado</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Apenas números</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Celular ou fixo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional</p>
              </div>

              <div className="flex items-end pb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWhatsApp}
                    onChange={(e) => setUseWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-gray-50 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">Usar mesmo telefone para WhatsApp</span>
                </label>
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
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                {isLoadingCep ? (
                  <p className="text-xs text-orange-500 mt-0.5">Buscando...</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Auto-preenchido</p>
                )}
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua <span className="text-red-500">*</span>
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Será preenchida automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, Bloco..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro <span className="text-red-500">*</span>
                </label>
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Será preenchido automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Será preenchida automaticamente"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ponto de referência"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Paciente</label>
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
                    id="patient-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                  <label
                    htmlFor="patient-photo-upload"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 cursor-pointer transition-all font-medium text-sm"
                  >
                    <Upload size={14} />
                    {photoUrl ? 'Alterar' : 'Escolher Foto'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (máx. 5MB)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to="/app/pacientes"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={duplicateNameWarning || duplicateCpfWarning}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  duplicateNameWarning || duplicateCpfWarning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                Salvar Paciente
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
