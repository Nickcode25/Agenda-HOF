import { useEffect } from 'react'
import { useAdmin } from '@/store/admin'
import SaasMetrics from '@/components/admin/SaasMetrics'

export default function MetricsPage() {
  const { purchases, customers, fetchPurchases, fetchCustomers, loading } = useAdmin()

  useEffect(() => {
    fetchPurchases()
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white text-lg">Carregando métricas...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <SaasMetrics purchases={purchases} customers={customers} />
    </div>
  )
}
