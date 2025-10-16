import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function PatientForm() {
  const add = usePatients(s => s.add)
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [isLoadingCep, setIsLoadingCep] = useState(false)

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
        // Formato: (00) 0000-0000
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2')
      } else {
        // Formato: (00) 00000-0000
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
    
    // Busca endereço quando CEP estiver completo
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
    const data = new FormData(e.currentTarget)

    try {
      const id = await add({
        name: String(data.get('name')||''),
        cpf: cpf,
        phone: phone,
        birth_date: String(data.get('birth_date')||''),
        cep: cep,
        street: street,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state,
        clinicalInfo: String(data.get('clinicalInfo')||''),
        notes: String(data.get('notes')||''),
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Novo Paciente</h2>
        <p className="text-gray-400 mt-1">Preencha as informações do paciente</p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
            <input
              name="name"
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">CPF *</label>
            <input
              name="cpf"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
            <input
              type="date"
              name="birth_date"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
            <input
              name="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
            <input
              value={cep}
              onChange={handleCEPChange}
              placeholder="00000-000"
              maxLength={9}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {isLoadingCep && <p className="text-xs text-orange-400 mt-1">Buscando endereço...</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Rua</label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Rua será preenchida automaticamente"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Número *</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="123"
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Complemento</label>
            <input
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto 101, Bloco A..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bairro</label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Bairro será preenchido automaticamente"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade será preenchida automaticamente"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="UF"
              maxLength={2}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Informações Clínicas</label>
            <textarea
              name="clinicalInfo"
              placeholder="Ex: Histórico médico, alergias, medicamentos em uso, condições especiais..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              rows={4}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
            <textarea
              name="notes"
              placeholder="Observações adicionais sobre o paciente..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Paciente</label>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <div className="relative">
                  <img src={photoUrl} alt="Prévia" className="h-32 w-32 object-cover rounded-xl border-2 border-orange-500" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="h-32 w-32 bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center">
                  <Upload size={32} className="text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <input
                  id="patient-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="hidden"
                />
                <label
                  htmlFor="patient-photo-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30 cursor-pointer transition-all font-medium"
                >
                  <Upload size={20} />
                  {photoUrl ? 'Alterar Foto' : 'Escolher Foto'}
                </label>
                <p className="text-xs text-gray-400 mt-2">Formatos aceitos: JPG, PNG, GIF (máx. 5MB)</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 mt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
            >
              Salvar Paciente
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
