import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Tag, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

export default function CouponsManagement() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState(10)
  const [maxUses, setMaxUses] = useState<number | null>(null)
  const [validUntil, setValidUntil] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Verificar se é admin
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        navigate('/app/agenda')
        return
      }

      loadCoupons()
    }

    checkAdmin()
  }, [user, navigate])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error) {
      console.error('Erro ao carregar cupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setCode(coupon.code)
      setDiscountPercentage(coupon.discount_percentage)
      setMaxUses(coupon.max_uses)
      setValidUntil(coupon.valid_until ? coupon.valid_until.split('T')[0] : '')
      setIsActive(coupon.is_active)
    } else {
      setEditingCoupon(null)
      setCode('')
      setDiscountPercentage(10)
      setMaxUses(null)
      setValidUntil('')
      setIsActive(true)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCoupon(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const couponData = {
        code: code.toUpperCase(),
        discount_percentage: discountPercentage,
        max_uses: maxUses,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive,
        created_by: user?.id
      }

      if (editingCoupon) {
        // Atualizar
        const { error } = await supabase
          .from('discount_coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('discount_coupons')
          .insert([couponData])

        if (error) throw error
      }

      closeModal()
      loadCoupons()
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error)
      alert(error.message || 'Erro ao salvar cupom')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCoupons()
    } catch (error: any) {
      console.error('Erro ao excluir cupom:', error)
      alert('Erro ao excluir cupom')
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
    } catch (error: any) {
      console.error('Erro ao atualizar cupom:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-lg font-medium">Carregando cupons...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-purple-900/20 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <div className="mb-8 backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
                <Tag className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  Gerenciar Cupons
                </h1>
                <p className="text-gray-400 text-sm">
                  Crie e gerencie cupons de desconto para novas assinaturas
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-2xl hover:shadow-orange-500/50 hover:scale-105"
            >
              <Plus className="text-xl group-hover:rotate-90 transition-transform" />
              Novo Cupom
            </button>
          </div>
        </div>

        {/* Lista de cupons */}
        <div className="grid gap-6">
          {coupons.length === 0 ? (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-16 text-center border border-white/10">
              <div className="p-6 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl w-fit mx-auto mb-6">
                <Tag className="text-7xl text-orange-400" />
              </div>
              <p className="text-gray-300 text-lg font-medium mb-2">Nenhum cupom cadastrado</p>
              <p className="text-gray-500 text-sm">Crie seu primeiro cupom de desconto para começar</p>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="group backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-gradient-to-br from-orange-500 to-red-600 text-white p-5 rounded-2xl group-hover:scale-110 transition-transform">
                        <Tag className="text-3xl" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-2xl font-bold text-white tracking-wide font-mono">
                          {coupon.code}
                        </h3>
                        {coupon.is_active ? (
                          <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-500/30">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            ATIVO
                          </span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-500/30">
                            <X className="text-lg" />
                            INATIVO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-2xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                          {coupon.discount_percentage}% OFF
                        </span>
                        <div className="h-6 w-px bg-gray-700" />
                        <span className="text-gray-300 font-medium">
                          <span className="text-white font-bold">{coupon.current_uses}</span>
                          {coupon.max_uses ? (
                            <span className="text-gray-500"> / {coupon.max_uses} usos</span>
                          ) : (
                            <span className="text-gray-500"> usos (ilimitado)</span>
                          )}
                        </span>
                        {coupon.valid_until && (
                          <>
                            <div className="h-6 w-px bg-gray-700" />
                            <span className="text-gray-400">
                              Expira: <span className="text-white font-medium">{new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`p-3 rounded-xl transition-all ${
                        coupon.is_active
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                      } hover:scale-110`}
                      title={coupon.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {coupon.is_active ? <X className="text-xl" /> : <Check className="text-xl" />}
                    </button>
                    <button
                      onClick={() => openModal(coupon)}
                      className="bg-blue-500/20 text-blue-400 p-3 rounded-xl hover:bg-blue-500/30 transition-all border border-blue-500/30 hover:scale-110"
                      title="Editar"
                    >
                      <Edit2 className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="bg-red-500/20 text-red-400 p-3 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30 hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Premium */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-10 max-w-lg w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
                <Tag className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono text-lg font-bold backdrop-blur-xl"
                  placeholder="EX: PROMO10"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Desconto (%) *
                </label>
                <input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-lg font-bold backdrop-blur-xl"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Número Máximo de Usos
                </label>
                <input
                  type="number"
                  value={maxUses || ''}
                  onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all backdrop-blur-xl"
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Válido Até
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all backdrop-blur-xl"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-white/20 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                />
                <label htmlFor="is_active" className="text-white font-medium flex-1 cursor-pointer">
                  Cupom ativo
                </label>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
                >
                  {editingCoupon ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
