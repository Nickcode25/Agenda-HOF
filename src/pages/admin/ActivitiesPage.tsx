import ActivityLogs from '@/components/admin/ActivityLogs'

export default function ActivitiesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Atividades</h1>
        <p className="text-gray-400">Histórico de ações dos clientes</p>
      </div>

      {/* Activity Logs */}
      <ActivityLogs />
    </div>
  )
}
