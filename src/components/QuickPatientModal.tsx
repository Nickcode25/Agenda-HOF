import { FormEvent, useState } from 'react'
import { X, Save, User, Phone as PhoneIcon } from 'lucide-react'
import { usePatients } from '@/store/patients'
import { useToast } from '@/hooks/useToast'

type QuickPatientModalProps = {
  isOpen: boolean
  onClose: () => void
  onPatientCreated: (patient: { id: string; name: string; phone?: string }) => void
}

export default function QuickPatientModal({ isOpen, onClose, onPatientCreated }: QuickPatientModalProps) {
  const add = usePatients(s => s.add)
  const patients = usePatients(s => s.patients)
  const { show: showToast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  function resetForm() {
    setName('')
    setPhone('')
    setCpf('')
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

    setIsLoading(true)

    try {
      const id = await add({
        name: trimmedName,
        cpf: cpf,
        phone: phone,
        birth_date: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        clinicalInfo: '',
        notes: '',
        photoUrl: undefined,
      })

      if (id) {
        showToast('Paciente cadastrado com sucesso!', 'success')
        onPatientCreated({ id, name: trimmedName, phone })
        resetForm()
        onClose()
      } else {
        showToast('Erro ao salvar paciente', 'error')
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error)
      showToast('Erro ao salvar paciente: ' + (error as Error).message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const canSubmit = name.trim().length > 0 && !duplicateNameWarning && !duplicateCpfWarning && !isLoading

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Paciente</h2>
            <p className="text-sm text-gray-500 mt-1">Cadastro rápido de paciente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
                required
                autoFocus
                className={`w-full bg-gray-50 border ${
                  duplicateNameWarning
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                } text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
              />
            </div>
            {duplicateNameWarning && (
              <p className="text-xs text-red-500 mt-1">Já existe um paciente com este nome</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <div className="relative">
              <PhoneIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Opcional - usado para WhatsApp</p>
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
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
              } text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
            />
            {duplicateCpfWarning ? (
              <p className="text-xs text-red-500 mt-1">CPF já cadastrado</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Opcional</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                !canSubmit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              {isLoading ? 'Salvando...' : 'Salvar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
