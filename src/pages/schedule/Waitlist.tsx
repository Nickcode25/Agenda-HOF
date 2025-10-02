import { FormEvent } from 'react'
import { useSchedule } from '@/store/schedule'
import { UserPlus, Phone, Trash2, Clock } from 'lucide-react'

export default function Waitlist() {
  const { waitlist, addWait, removeWait } = useSchedule()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    addWait({
      patientName: String(data.get('patientName')||''),
      phone: String(data.get('phone')||''),
      desiredProcedure: data.get('desiredProcedure') as any,
    })
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Fila de Espera</h1>
        <p className="text-gray-400">Gerencie pacientes aguardando agendamento</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Waitlist */}
        <div className="lg:col-span-2 space-y-4">
          {waitlist.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={40} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Fila vazia</h3>
              <p className="text-gray-400">Nenhum paciente aguardando no momento</p>
            </div>
          ) : (
            waitlist.map(w => (
              <div key={w.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{w.patientName}</h3>
                    <div className="space-y-1">
                      {w.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Phone size={14} className="text-orange-500" />
                          <span>{w.phone}</span>
                        </div>
                      )}
                      {w.desiredProcedure && (
                        <div className="inline-block px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium mt-2">
                          {w.desiredProcedure}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeWait(w.id)} 
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remover da fila"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Form */}
        <div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus size={24} className="text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Adicionar à Fila</h3>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                <input 
                  name="patientName" 
                  required 
                  placeholder="Nome do paciente"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                <input 
                  name="phone" 
                  placeholder="(00) 00000-0000"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento desejado</label>
                <input 
                  name="desiredProcedure" 
                  placeholder="Ex: Botox, Preenchimento..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
                />
              </div>
              <button className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
                <UserPlus size={20} />
                Adicionar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
