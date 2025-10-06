import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Upload, X } from 'lucide-react'

export default function PatientForm() {
  const add = usePatients(s => s.add)
  const navigate = useNavigate()

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
        alert('CEP não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      alert('Erro ao buscar CEP')
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
        navigate(`/app/pacientes/${id}`)
      } else {
        alert('Erro ao salvar paciente')
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error)
      alert('Erro ao salvar paciente: ' + (error as Error).message)
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4 text-white">Novo Paciente</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 p-4 rounded border border-gray-700">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-300">Nome</label>
          <input name="name" required className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-300">CPF</label>
          <input 
            name="cpf" 
            value={cpf}
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
            maxLength={14}
            required 
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Telefone</label>
          <input 
            name="phone" 
            value={phone}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">CEP</label>
          <input 
            value={cep}
            onChange={handleCEPChange}
            placeholder="00000-000"
            maxLength={9}
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
          {isLoadingCep && <p className="text-xs text-orange-400 mt-1">Buscando endereço...</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Rua</label>
          <input 
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua será preenchida automaticamente"
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Número *</label>
          <input 
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="123"
            required
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Complemento</label>
          <input 
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Apto 101, Bloco A..."
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Bairro</label>
          <input 
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Bairro será preenchido automaticamente"
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Cidade</label>
          <input 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade será preenchida automaticamente"
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Estado</label>
          <input 
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="UF"
            maxLength={2}
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Informações Clínicas</label>
          <textarea 
            name="clinicalInfo" 
            placeholder="Ex: Histórico médico, alergias, medicamentos em uso, condições especiais..."
            className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" 
            rows={4}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Observações</label>
          <textarea name="notes" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" rows={2}></textarea>
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
        <div className="md:col-span-2 flex gap-2 mt-2">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors">Salvar</button>
        </div>
      </form>
    </div>
  )
}
