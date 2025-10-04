import { Outlet, NavLink } from 'react-router-dom'
import { Calendar, Users, PlusCircle, ListChecks, Menu, X, Stethoscope, Scissors, Package, ShoppingCart, BarChart3, ChevronDown, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { professionals } = useProfessionals()
  const { selectedProfessional, setSelectedProfessional } = useProfessionalContext()

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            <NavLink to="/app" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              {sidebarOpen && <h1 className="font-bold text-white text-lg">Agenda+ HOF</h1>}
            </NavLink>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Professional Selector */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-700">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Profissional Ativo
                </label>
                <div className="relative">
                  <select
                    value={selectedProfessional}
                    onChange={(e) => setSelectedProfessional(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                  >
                    <option value="">Todos os Profissionais</option>
                    {professionals.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} - {prof.specialty}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {selectedProfessional && (
                  <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    Agenda filtrada por profissional
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-2">
            <NavLink to="/app/dashboard" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <BarChart3 size={22}/>
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </NavLink>
            <NavLink to="/app/agenda" end className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Calendar size={22}/>
              {sidebarOpen && <span className="font-medium">Agenda</span>}
            </NavLink>
            <NavLink to="/app/agenda/nova" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <PlusCircle size={22}/>
              {sidebarOpen && <span className="font-medium">Novo Agendamento</span>}
            </NavLink>
            <NavLink to="/app/agenda/fila" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <ListChecks size={22}/>
              {sidebarOpen && <span className="font-medium">Fila de Espera</span>}
            </NavLink>
            <NavLink to="/app/procedimentos" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Scissors size={22}/>
              {sidebarOpen && <span className="font-medium">Procedimentos</span>}
            </NavLink>
            <NavLink to="/app/profissionais" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Stethoscope size={22}/>
              {sidebarOpen && <span className="font-medium">Profissionais</span>}
            </NavLink>
            <NavLink to="/app/pacientes" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Users size={22}/>
              {sidebarOpen && <span className="font-medium">Pacientes</span>}
            </NavLink>
            <NavLink to="/app/estoque" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Package size={22}/>
              {sidebarOpen && <span className="font-medium">Estoque</span>}
            </NavLink>
            <NavLink to="/app/vendas" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <ShoppingCart size={22}/>
              {sidebarOpen && <span className="font-medium">Venda de Produtos</span>}
            </NavLink>
            <NavLink to="/app/mensalidades" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <CreditCard size={22}/>
              {sidebarOpen && <span className="font-medium">Mensalidades</span>}
            </NavLink>
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">© 2025 Agenda+ HOF</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <h1 className="font-bold text-white">Agenda+ HOF</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
