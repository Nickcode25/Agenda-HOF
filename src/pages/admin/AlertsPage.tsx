import { useEffect } from 'react'
import { useAdmin } from '@/store/admin'
import AlertsPanel from '@/components/admin/AlertsPanel'

export default function AlertsPage() {
  const { purchases, customers, fetchPurchases, fetchCustomers, loading } = useAdmin()

  useEffect(() => {
    fetchPurchases()
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white text-lg">Carregando alertas...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Alertas e Notificações</h1>
        <p className="text-gray-400">Situações que precisam de atenção</p>
      </div>

      {/* Alerts */}
      <AlertsPanel purchases={purchases} customers={customers} />
    </div>
  )
}
