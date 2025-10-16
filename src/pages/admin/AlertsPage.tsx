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
      <AlertsPanel purchases={purchases} customers={customers} />
    </div>
  )
}
