import { Sparkles, Users } from 'lucide-react'

interface TabsNavProps {
  activeTab: 'plans' | 'subscribers'
  onTabChange: (tab: 'plans' | 'subscribers') => void
}

export default function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange('plans')}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'plans'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={18} />
            <span>Planos</span>
          </div>
        </button>
        <button
          onClick={() => onTabChange('subscribers')}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'subscribers'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={18} />
            <span>Assinantes</span>
          </div>
        </button>
      </div>
    </div>
  )
}
