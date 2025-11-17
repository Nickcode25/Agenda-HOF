import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { Save, User, Phone as PhoneIcon, FileText } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

// Mask functions
function maskCPF(value: string) {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return value
}

function maskPhone(value: string) {
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
  return value
}

export default function StudentForm() {
  const navigate = useNavigate()
  const { add, loading, students } = useStudents()
  const { show: showToast } = useToast()

  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [profession, setProfession] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [useWhatsApp, setUseWhatsApp] = useState(true)
  const [notes, setNotes] = useState('')

  // Verificação de duplicação
  const duplicateNameWarning = name.trim().length > 0 && students.some(
    s => s.name.toLowerCase().trim() === name.toLowerCase().trim()
  )

  const duplicateCpfWarning = cpf.replace(/\D/g, '').length > 0 && students.some(
    s => s.cpf?.replace(/\D/g, '') === cpf.replace(/\D/g, '')
  )

  const duplicateEmailWarning = email.trim().length > 0 && students.some(
    s => s.email?.toLowerCase().trim() === email.toLowerCase().trim()
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const cleanCpf = cpf.replace(/\D/g, '')

    // Validações
    if (duplicateNameWarning) {
      showToast(`Já existe um aluno cadastrado com o nome "${trimmedName}"`, 'error')
      return
    }

    if (cleanCpf.length > 0 && duplicateCpfWarning) {
      showToast(`Já existe um aluno cadastrado com o CPF ${cpf}`, 'error')
      return
    }

    if (email.trim() && duplicateEmailWarning) {
      showToast(`Já existe um aluno cadastrado com o email ${email}`, 'error')
      return
    }

    const id = await add({
      name: trimmedName,
      cpf,
      birth_date: birthDate,
      phone,
      email,
      gender,
      profession,
      notes,
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    })

    if (id) {
      showToast('Aluno cadastrado com sucesso!', 'success')
      navigate(`/app/alunos/${id}`)
    } else {
      showToast('Erro ao cadastrar aluno. Tente novamente.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Aluno</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastre um novo aluno de mentoria</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/alunos"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="student-form"
              disabled={loading || !name.trim() || duplicateNameWarning || duplicateCpfWarning || duplicateEmailWarning}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                loading || !name.trim() || duplicateNameWarning || duplicateCpfWarning || duplicateEmailWarning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <User size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
                <p className="text-xs text-gray-500">Informações do aluno</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
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
                  <p className="text-xs text-red-500 mt-0.5">Já existe um aluno com este nome</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Ex: João Silva Santos</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
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
                  <p className="text-xs text-gray-500 mt-0.5">Opcional - apenas números</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profissão/Ocupação</label>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Estudante, Profissional"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`w-full bg-gray-50 border ${
                    duplicateEmailWarning
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                  } text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-sm`}
                />
                {duplicateEmailWarning ? (
                  <p className="text-xs text-red-500 mt-0.5">Email já cadastrado</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Opcional - para notificações</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional - celular ou fixo</p>
              </div>

              <div className="md:col-span-2">
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

          {/* Seção: Observações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileText size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Observações</h3>
                <p className="text-xs text-gray-500">Informações adicionais</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o aluno..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-0.5">Opcional - informações relevantes sobre o aluno</p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to="/app/alunos"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim() || duplicateNameWarning || duplicateCpfWarning || duplicateEmailWarning}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  loading || !name.trim() || duplicateNameWarning || duplicateCpfWarning || duplicateEmailWarning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                {loading ? 'Salvando...' : 'Salvar Aluno'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
