import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '@/store/students'
import { GraduationCap, ArrowLeft, Save } from 'lucide-react'
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

function maskCEP(value: string) {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2')
  }
  return value
}

export default function StudentForm() {
  const navigate = useNavigate()
  const { add, loading } = useStudents()
  const { show: showToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: ''
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const id = await add(formData)
    if (id) {
      showToast('Aluno cadastrado com sucesso!', 'success')
      navigate(`/app/alunos/${id}`)
    } else {
      showToast('Erro ao cadastrar aluno. Tente novamente.', 'error')
    }
  }

  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => navigate('/app/alunos')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Alunos
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <GraduationCap size={32} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Novo Aluno</h1>
              <p className="text-gray-400">Cadastre um novo aluno de mentoria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-6">
        {/* Dados Pessoais */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-purple-400" />
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Digite o nome completo do aluno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                onBlur={handleCEPBlur}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Rua</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Nome da rua"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Nº"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Complemento</label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Apto, Bloco, etc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bairro</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Nome do bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Nome da cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            placeholder="Observações adicionais sobre o aluno..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/app/alunos')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar Aluno'}
          </button>
        </div>
      </form>
    </div>
  )
}
