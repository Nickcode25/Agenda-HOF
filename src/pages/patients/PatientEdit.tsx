import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Save, ArrowLeft } from 'lucide-react'

export default function PatientEdit() {
  const { id } = useParams()
  const { patients, update } = usePatients(s => ({ patients: s.patients, update: s.update }))
  const patient = patients.find(p => p.id === id)
  const navigate = useNavigate()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(patient?.photoUrl)
  const [cpf, setCpf] = useState(patient?.cpf || '')
  const [phone, setPhone] = useState(patient?.phone || '')
  const [cep, setCep] = useState(patient?.cep || '')
  const [street, setStreet] = useState(patient?.street || '')
  const [neighborhood, setNeighborhood] = useState(patient?.neighborhood || '')
  const [city, setCity] = useState(patient?.city || '')
  const [state, setState] = useState(patient?.state || '')
  const [number, setNumber] = useState(patient?.number || '')
  const [complement, setComplement] = useState(patient?.complement || '')
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  useEffect(() => {
    if (patient) {
      setCpf(patient.cpf || '')
      setPhone(patient.phone || '')
      setCep(patient.cep || '')
      setStreet(patient.street || '')
      setNeighborhood(patient.neighborhood || '')
      setCity(patient.city || '')
      setState(patient.state || '')
      setNumber(patient.number || '')
      setComplement(patient.complement || '')
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

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id) return
    
    const data = new FormData(e.currentTarget)
    update(id, {
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
    navigate(`/app/pacientes/${id}`)
  }

  if (!patient) return (
    <div>
      <p className="text-gray-400">Paciente não encontrado.</p>
      <Link to="/pacientes" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/pacientes/${id}`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Editar Paciente</h1>
          <p className="text-gray-400">Atualize os dados do paciente</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
            <input 
              name="name" 
              required 
              defaultValue={patient.name}
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
        </div>
        
        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Informações Clínicas</label>
            <textarea 
              name="clinicalInfo" 
              defaultValue={patient.clinicalInfo}
              placeholder="Ex: Histórico médico, alergias, medicamentos em uso, condições especiais..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              rows={4}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
            <textarea 
              name="notes" 
              defaultValue={patient.notes}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              rows={2}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhoto} 
              className="w-full text-gray-300" 
            />
            {photoUrl && <img src={photoUrl} alt="Prévia" className="mt-2 h-24 w-24 object-cover rounded-xl border-2 border-orange-500" />}
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Alterações
          </button>
          <Link to={`/pacientes/${id}`} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
