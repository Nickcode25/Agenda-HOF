import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProfessionalForm() {
  const add = useProfessionals(s => s.add)
  const navigate = useNavigate()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')

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

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const id = add({
      name: String(data.get('name')||''),
      specialty: String(data.get('specialty')||''),
      registrationNumber: String(data.get('registrationNumber')||''),
      cpf: cpf,
      phone: phone,
      email: String(data.get('email')||''),
      address: String(data.get('address')||''),
      photoUrl,
      active: true,
    })
    navigate(`/profissionais/${id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/profissionais" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Novo Profissional</h1>
          <p className="text-gray-400">Cadastre um profissional do consultório</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
            <input 
              name="name" 
              required 
              placeholder="Dr(a). Nome Completo"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Especialidade *</label>
            <input 
              name="specialty" 
              required 
              placeholder="Ex: Harmonização Orofacial"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Registro Profissional *</label>
            <input 
              name="registrationNumber" 
              required 
              placeholder="CRO, CRM, etc"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
            <input 
              name="cpf" 
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
            <input 
              name="email" 
              type="email"
              placeholder="email@exemplo.com"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Endereço</label>
            <input 
              name="address" 
              placeholder="Rua, número, bairro, cidade"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div className="md:col-span-2">
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
            Salvar Profissional
          </button>
          <Link to="/profissionais" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
