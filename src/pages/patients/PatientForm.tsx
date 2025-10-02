import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'

export default function PatientForm() {
  const add = usePatients(s => s.add)
  const navigate = useNavigate()

  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')

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

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
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
      cpf: cpf,
      phone: phone,
      address: String(data.get('address')||''),
      medicalHistory: String(data.get('medicalHistory')||''),
      allergies: String(data.get('allergies')||''),
      notes: String(data.get('notes')||''),
      photoUrl,
    })
    navigate(`/pacientes/${id}`)
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
          <label className="block text-sm font-medium text-gray-300">Endereço</label>
          <input name="address" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Histórico Médico</label>
          <textarea name="medicalHistory" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" rows={3}></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Alergias</label>
          <textarea name="allergies" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" rows={2}></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Observações</label>
          <textarea name="notes" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500" rows={2}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Foto</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="mt-1 w-full text-gray-300" />
          {photoUrl && <img src={photoUrl} alt="Prévia" className="mt-2 h-24 w-24 object-cover rounded border-2 border-orange-500" />}
        </div>
        <div className="md:col-span-2 flex gap-2 mt-2">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors">Salvar</button>
        </div>
      </form>
    </div>
  )
}
