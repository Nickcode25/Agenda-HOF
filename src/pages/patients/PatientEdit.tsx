import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Save, ArrowLeft, User, MapPin, FileText, Camera, Phone, Calendar, CreditCard, Heart } from 'lucide-react'
import FileInput from '@/components/FileInput'
import { useToast } from '@/hooks/useToast'
import DateInput from '@/components/DateInput'

export default function PatientEdit() {
  const { id } = useParams()
  const { patients, update } = usePatients(s => ({ patients: s.patients, update: s.update }))
  const patient = patients.find(p => p.id === id)
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(patient?.photoUrl)
  const [name, setName] = useState(patient?.name || '')
  const [cpf, setCpf] = useState(patient?.cpf || '')
  const [phone, setPhone] = useState(patient?.phone || '')
  const [birthDate, setBirthDate] = useState(patient?.birth_date || '')
  const [cep, setCep] = useState(patient?.cep || '')
  const [street, setStreet] = useState(patient?.street || '')
  const [neighborhood, setNeighborhood] = useState(patient?.neighborhood || '')
  const [city, setCity] = useState(patient?.city || '')
  const [state, setState] = useState(patient?.state || '')
  const [number, setNumber] = useState(patient?.number || '')
  const [complement, setComplement] = useState(patient?.complement || '')
  const [clinicalInfo, setClinicalInfo] = useState(patient?.clinicalInfo || '')
  const [notes, setNotes] = useState(patient?.notes || '')
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  useEffect(() => {
    if (patient) {
      setName(patient.name || '')
      setCpf(patient.cpf || '')
      setPhone(patient.phone || '')
      setBirthDate(patient.birth_date || '')
      setCep(patient.cep || '')
      setStreet(patient.street || '')
      setNeighborhood(patient.neighborhood || '')
      setCity(patient.city || '')
      setState(patient.state || '')
      setNumber(patient.number || '')
      setComplement(patient.complement || '')
      setClinicalInfo(patient.clinicalInfo || '')
      setNotes(patient.notes || '')
      setPhotoUrl(patient.photoUrl)
    }
  }, [patient])

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

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
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

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id) return

    update(id, {
      name,
      cpf,
      phone,
      birth_date: birthDate,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      clinicalInfo,
      notes,
      photoUrl,
    })
    showToast('Paciente atualizado com sucesso!', 'success')
    navigate(`/app/pacientes/${id}`)
  }

  if (!patient) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Paciente não encontrado.</p>
        <Link to="/app/pacientes" className="text-orange-500 hover:text-orange-600 hover:underline">Voltar para lista</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/app/pacientes/${id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft size={20} className="text-gray-500" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
                <p className="text-sm text-gray-500">Atualize os dados do paciente</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/app/pacientes/${id}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </div>

          {/* Foto e Dados Básicos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <User size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Dados Pessoais</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Foto */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={name}
                        className="w-28 h-28 rounded-xl object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">{getInitials(name || 'P')}</span>
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                      <Camera size={16} className="text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">Clique para alterar</span>
                </div>

                {/* Campos */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="Nome do paciente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-gray-400" />
                        CPF
                      </span>
                    </label>
                    <input
                      value={cpf}
                      onChange={handleCPFChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        Data de Nascimento
                      </span>
                    </label>
                    <DateInput
                      value={birthDate}
                      onChange={setBirthDate}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-gray-400" />
                        Telefone / WhatsApp
                      </span>
                    </label>
                    <input
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Endereço</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                  <div className="relative">
                    <input
                      value={cep}
                      onChange={handleCEPChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    {isLoadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rua</label>
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, Bloco..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Clínicas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Heart size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Informações Clínicas</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Histórico médico, alergias, medicamentos em uso
                </label>
                <textarea
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  placeholder="Ex: Alérgico a dipirona, hipertenso, usa losartana 50mg..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Observações</h2>
            </div>
            <div className="p-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações gerais sobre o paciente..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Footer com botões (mobile) */}
          <div className="md:hidden flex gap-3 pt-2">
            <Link
              to={`/app/pacientes/${id}`}
              className="flex-1 px-4 py-3 text-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-lg font-medium shadow-sm transition-all"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
