import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProfessionalForm() {
  const { addProfessional } = useSales()
  const navigate = useNavigate()

  const [cep, setCep] = useState('')
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  // Função para formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) {
      return numbers
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  // Função para buscar endereço por CEP
  const fetchAddressByCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        // Preencher campos automaticamente
        const form = document.querySelector('form') as HTMLFormElement
        if (form) {
          (form.querySelector('[name="street"]') as HTMLInputElement).value = data.logradouro || ''
          ;(form.querySelector('[name="neighborhood"]') as HTMLInputElement).value = data.bairro || ''
          ;(form.querySelector('[name="city"]') as HTMLInputElement).value = data.localidade || ''
          ;(form.querySelector('[name="state"]') as HTMLInputElement).value = data.uf || ''
        }
      } else {
        alert('CEP não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      alert('Erro ao buscar endereço')
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setCep(formatted)
    
    // Buscar automaticamente quando CEP estiver completo
    if (formatted.length === 9) {
      fetchAddressByCep(formatted)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    
    const id = addProfessional({
      name: String(data.get('name') || ''),
      cpf: String(data.get('cpf') || '') || undefined,
      phone: String(data.get('phone') || '') || undefined,
      email: String(data.get('email') || '') || undefined,
      specialty: String(data.get('specialty') || '') || undefined,
      clinic: String(data.get('clinic') || '') || undefined,
      cep: cep || undefined,
      street: String(data.get('street') || '') || undefined,
      number: String(data.get('number') || '') || undefined,
      complement: String(data.get('complement') || '') || undefined,
      neighborhood: String(data.get('neighborhood') || '') || undefined,
      city: String(data.get('city') || '') || undefined,
      state: String(data.get('state') || '') || undefined,
      notes: String(data.get('notes') || '') || undefined,
    })
    
    navigate('/vendas')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/vendas" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Cadastrar Profissional</h1>
          <p className="text-gray-400">Adicione um novo profissional comprador</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
              <input 
                name="name" 
                required 
                placeholder="Ex: Dr. João Silva"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
              <input 
                name="cpf" 
                placeholder="000.000.000-00"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
              <input 
                name="phone" 
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input 
                name="email" 
                type="email"
                placeholder="joao@exemplo.com"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Especialidade</label>
              <select 
                name="specialty"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione a especialidade</option>
                <option value="Dermatologista">Dermatologista</option>
                <option value="Cirurgião Plástico">Cirurgião Plástico</option>
                <option value="Esteticista">Esteticista</option>
                <option value="Fisioterapeuta Dermato-Funcional">Fisioterapeuta Dermato-Funcional</option>
                <option value="Biomédico Esteta">Biomédico Esteta</option>
                <option value="Enfermeiro Esteta">Enfermeiro Esteta</option>
                <option value="Dentista">Dentista</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Clínica/Consultório</label>
              <input 
                name="clinic" 
                placeholder="Nome da clínica ou consultório"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Endereço</h3>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
              <div className="relative">
                <input 
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
                />
                {isLoadingCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 text-sm">
                    Buscando...
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Logradouro</label>
              <input 
                name="street" 
                placeholder="Rua, Avenida, etc."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Número</label>
              <input 
                name="number" 
                placeholder="123"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Complemento</label>
              <input 
                name="complement" 
                placeholder="Apto, Sala, etc."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bairro</label>
              <input 
                name="neighborhood" 
                placeholder="Centro, Jardins, etc."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
              <input 
                name="city" 
                placeholder="São Paulo"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
              <input 
                name="state" 
                placeholder="SP"
                maxLength={2}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Observações</h3>
          
          <textarea 
            name="notes" 
            placeholder="Informações adicionais sobre o profissional..."
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            rows={4}
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Save size={18} />
            Cadastrar Profissional
          </button>
          <Link
            to="/vendas"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
