import { Outlet, NavLink } from 'react-router-dom'
import { Calendar, Users, PlusCircle, ListChecks, Menu, X, Stethoscope } from 'lucide-react'
import { useState } from 'react'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              {sidebarOpen && <h1 className="font-bold text-white text-lg">Agenda+ HOF</h1>}
            </NavLink>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-2">
            <NavLink to="/" end className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Calendar size={22}/>
              {sidebarOpen && <span className="font-medium">Agenda</span>}
            </NavLink>
            <NavLink to="/agenda/nova" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <PlusCircle size={22}/>
              {sidebarOpen && <span className="font-medium">Novo Agendamento</span>}
            </NavLink>
            <NavLink to="/agenda/fila" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <ListChecks size={22}/>
              {sidebarOpen && <span className="font-medium">Fila de Espera</span>}
            </NavLink>
            <NavLink to="/profissionais" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Stethoscope size={22}/>
              {sidebarOpen && <span className="font-medium">Profissionais</span>}
            </NavLink>
            <NavLink to="/pacientes" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              <Users size={22}/>
              {sidebarOpen && <span className="font-medium">Pacientes</span>}
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
