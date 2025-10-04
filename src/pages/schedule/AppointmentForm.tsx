import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import type { ProcedureType } from '@/types/schedule'
import type { PlannedProcedure } from '@/types/patient'
import { Save, ArrowLeft, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/currency'

const procedures: ProcedureType[] = ['Avaliação','Botox','Preenchimento','Bioestimulador']

export default function AppointmentForm() {
  const patients = usePatients(s => s.patients)
  const updatePatient = usePatients(s => s.update)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const { procedures: registeredProcedures } = useProcedures()
  const { items: stockItems } = useStock()
  const { selectedProfessional } = useProfessionalContext()
  const add = useSchedule(s => s.addAppointment)
  const navigate = useNavigate()
  const [selectedProcedureId, setSelectedProcedureId] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    category: string
    stockItemId: string
    quantity: number
  }>>([])

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  const selectedProcedure = registeredProcedures.find(p => p.id === selectedProcedureId)

  // Quando o procedimento mudar, inicializar os produtos selecionados
  const handleProcedureChange = (procId: string) => {
    setSelectedProcedureId(procId)
    const proc = registeredProcedures.find(p => p.id === procId)

    if (proc?.stockCategories && proc.stockCategories.length > 0) {
      setSelectedProducts(proc.stockCategories.map(cat => ({
        category: cat.category,
        stockItemId: '',
        quantity: cat.quantityUsed
      })))
    } else {
      setSelectedProducts([])
    }
  }

  const updateSelectedProduct = (index: number, field: 'stockItemId' | 'quantity', value: string | number) => {
    const updated = [...selectedProducts]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedProducts(updated)
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)

    const patientId = String(data.get('patientId')||'')
    const patient = patients.find(p => p.id === patientId)

    // Filtrar apenas produtos que têm stockItemId selecionado
    const validProducts = selectedProducts.filter(p => p.stockItemId)

    // Adicionar agendamento
    add({
      patientId,
      patientName: patient?.name || '',
      procedure: data.get('procedure') as ProcedureType,
      procedureId: selectedProcedureId || undefined,
      selectedProducts: validProducts.length > 0 ? validProducts : undefined,
      professional: String(data.get('professional')||''),
      room: String(data.get('room')||''),
      start: String(data.get('start')||''),
      end: String(data.get('end')||''),
      notes: String(data.get('notes')||''),
      status: 'scheduled'
    })

    // Adicionar procedimento ao planejamento do paciente
    if (patient && selectedProcedure) {
      const newPlannedProcedure: PlannedProcedure = {
        id: crypto.randomUUID(),
        procedureName: selectedProcedure.name,
        quantity: 1,
        unitValue: selectedProcedure.cashValue || selectedProcedure.value,
        totalValue: selectedProcedure.cashValue || selectedProcedure.value,
        paymentType: 'default',
        status: 'pending',
        notes: String(data.get('notes')||''),
        createdAt: new Date().toISOString()
      }

      const currentPlanned = patient.plannedProcedures || []
      updatePatient(patient.id, {
        plannedProcedures: [...currentPlanned, newPlannedProcedure]
      })
    }

    navigate('/app/agenda')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/agenda" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Novo Agendamento</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-400">Preencha os dados do agendamento</p>
            {selectedProfessionalName && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                <span>Agenda: {selectedProfessionalName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
            <select name="patientId" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              <option value="">Selecione um paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
            <select
              name="procedure"
              required
              value={selectedProcedureId}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione um procedimento</option>
              {registeredProcedures.filter(p => p.active).map(proc => (
                <option key={proc.id} value={proc.id}>
                  {proc.name} - {formatCurrency(proc.cashValue || proc.value)}
                </option>
              ))}
            </select>
            {registeredProcedures.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum procedimento cadastrado. <Link to="/app/procedimentos/novo" className="underline">Cadastre aqui</Link>
              </p>
            )}
          </div>

          {/* Produtos utilizados no procedimento */}
          {selectedProducts.length > 0 && (
            <div className="md:col-span-2">
              <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-orange-400" />
                  <h4 className="text-sm font-medium text-gray-300">Selecione os produtos que serão utilizados:</h4>
                </div>
                <div className="space-y-3">
                  {selectedProducts.map((product, index) => {
                    // Filtrar produtos da categoria
                    const productsInCategory = stockItems.filter(item => item.category === product.category)

                    return (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-orange-400 mb-2">
                              {product.category}
                            </label>
                            <select
                              value={product.stockItemId}
                              onChange={(e) => updateSelectedProduct(index, 'stockItemId', e.target.value)}
                              className="w-full bg-gray-600 border border-gray-500 text-white rounded px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                            >
                              <option value="">Selecione marca/produto</option>
                              {productsInCategory.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.brand} - {item.name} (Estoque: {item.quantity} {item.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-28">
                            <label className="block text-xs font-medium text-gray-400 mb-2">Quantidade</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={product.quantity}
                              onChange={(e) => updateSelectedProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full bg-gray-600 border border-gray-500 text-white rounded px-3 py-2 text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional *</label>
            <select 
              name="professional" 
              required 
              defaultValue={selectedProfessionalName}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione um profissional</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.name}>{prof.name} - {prof.specialty}</option>
              ))}
            </select>
            {professionals.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum profissional cadastrado. <Link to="/app/profissionais/novo" className="underline">Cadastre aqui</Link>
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sala</label>
            <input name="room" placeholder="Número da sala" className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data e Hora de Início *</label>
            <input type="datetime-local" name="start" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data e Hora de Término *</label>
            <input type="datetime-local" name="end" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea name="notes" placeholder="Adicione observações sobre o agendamento..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" rows={4}></textarea>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Agendamento
          </button>
          <Link to="/app/agenda" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
