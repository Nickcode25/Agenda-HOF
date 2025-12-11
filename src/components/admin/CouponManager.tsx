import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit2, Check, X, Calendar, Percent, Users, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { useConfirm } from '@/hooks/useConfirm'
import DateInput from '@/components/DateInput'
import PageLoading from '@/components/ui/PageLoading'

interface Coupon {
  id: string
  code: string
  discount_percentage: number
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    max_uses: '',
    valid_until: '',
    is_active: true
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar cupons:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      // Validações
      if (!formData.code.trim()) {
        setError('Digite um código para o cupom')
        return
      }

      if (formData.discount_percentage < 1 || formData.discount_percentage > 100) {
        setError('Desconto deve ser entre 1% e 100%')
        return
      }

      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_percentage: formData.discount_percentage,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active
      }

      if (editingCoupon) {
        // Atualizar cupom existente
        const { error: updateError } = await supabase
          .from('discount_coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)

        if (updateError) throw updateError
        setSuccess('Cupom atualizado com sucesso!')
      } else {
        // Criar novo cupom
        const { error: insertError } = await supabase
          .from('discount_coupons')
          .insert([couponData])

        if (insertError) throw insertError
        setSuccess('Cupom criado com sucesso!')
      }

      // Reset form
      setFormData({
        code: '',
        discount_percentage: 10,
        max_uses: '',
        valid_until: '',
        is_active: true
      })
      setShowForm(false)
      setEditingCoupon(null)
      loadCoupons()
    } catch (err: any) {
      console.error('Erro ao salvar cupom:', err)
      setError(err.message || 'Erro ao salvar cupom')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      max_uses: coupon.max_uses?.toString() || '',
      valid_until: coupon.valid_until || '',
      is_active: coupon.is_active
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Cupom',
      message: 'Tem certeza que deseja excluir este cupom?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Cupom excluído com sucesso!')
      loadCoupons()
    } catch (err: any) {
      console.error('Erro ao excluir cupom:', err)
      setError(err.message)
    }
  }

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)

      if (error) throw error
      loadCoupons()
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      setError(err.message)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingCoupon(null)
    setFormData({
      code: '',
      discount_percentage: 10,
      max_uses: '',
      valid_until: '',
      is_active: true
    })
    setError('')
  }

  if (loading) {
    return <PageLoading message="Carregando cupons..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-orange-500" />
            Cupons de Desconto
          </h2>
          <p className="text-gray-500 mt-1">Gerencie cupons para o checkout</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Cupom
        </button>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Erro</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700">Sucesso</p>
              <p className="text-green-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO50"
                  maxLength={50}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 uppercase focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (%) *
                </label>
                <input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usos Máximos
                </label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                  min="1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">Deixe vazio para ilimitado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Até
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">Deixe vazio para sem expiração</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Cupom ativo (disponível para uso)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-5 h-5" />
                {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Cupons */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Desconto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Usos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Validade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum cupom cadastrado ainda
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-semibold">{coupon.discount_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700">
                          {coupon.current_uses} / {coupon.max_uses || '∞'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-700 text-sm">
                          {coupon.valid_until ? format(new Date(coupon.valid_until), 'dd/MM/yyyy') : 'Sem expiração'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
