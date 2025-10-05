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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Métricas SaaS</h1>
        <p className="text-gray-400">MRR, Churn Rate, LTV e Growth</p>
      </div>

      {/* Metrics */}
      <SaasMetrics purchases={purchases} customers={customers} />
    </div>
  )
}
