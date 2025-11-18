import { Sparkles, Users } from 'lucide-react'

interface TabsNavProps {
  activeTab: 'plans' | 'subscribers'
  onTabChange: (tab: 'plans' | 'subscribers') => void
}

export default function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange('plans')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'plans'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={18} />
            <span>Planos</span>
          </div>
        </button>
        <button
          onClick={() => onTabChange('subscribers')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'subscribers'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
