import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StockItem, StockMovement, StockAlert } from '@/types/stock'
import { supabase, getCachedUser } from '@/lib/supabase'

interface StockStore {
  items: StockItem[]
  movements: StockMovement[]
  alerts: StockAlert[]
  loading: boolean
  error: string | null
  fetched: boolean

  // Fetch data
  fetchItems: (force?: boolean) => Promise<void>
  
  // Stock Items
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateItem: (id: string, updates: Partial<StockItem>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  getItem: (id: string) => StockItem | undefined
  updateQuantity: (id: string, newQuantity: number) => Promise<void>
  
  // Stock Movements (local apenas)
  addMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void
  getMovementsByItem: (stockItemId: string) => StockMovement[]
  
  // Stock Operations  
  addStock: (itemId: string, quantity: number, reason: string, cost?: number) => Promise<void>
  removeStock: (itemId: string, quantity: number, reason: string, procedureId?: string, patientId?: string) => Promise<boolean>
  
  // Alerts (local apenas)
  generateAlerts: () => void
  markAlertAsRead: (alertId: string) => void
  getUnreadAlerts: () => StockAlert[]
}

export const useStock = create<StockStore>()(
  persist(
    (set, get) => ({
      items: [],
      movements: [],
      alerts: [],
      loading: false,
      error: null,
      fetched: false,

      fetchItems: async (force = false) => {
        // Se já carregou e não é forçado, não carrega novamente
        if (get().fetched && !force) {
          console.log('⚡ [STOCK] Usando cache - dados já carregados')
          return
        }

        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) {
            console.error('❌ [STOCK] Usuário não autenticado')
            throw new Error('Usuário não autenticado')
          }

          console.log('👤 [STOCK] Buscando para user:', user.id)

          const { data, error } = await supabase
            .from('stock')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('❌ [STOCK] Erro do Supabase:', error)
            throw error
          }

          const items: StockItem[] = (data || []).map(row => ({
            id: row.id,
            name: row.name,
            category: row.category || '',
            quantity: row.quantity || 0,
            minQuantity: row.min_quantity || 0,
            unit: row.unit || 'un',
            dosesPerUnit: row.doses_per_unit || undefined,
            supplier: row.supplier || undefined,
            costPrice: row.cost_price || 0,
            salePrice: row.sale_price || undefined,
            barcode: row.barcode || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))

          set({ items, loading: false, fetched: true })
          get().generateAlerts()
        } catch (error: any) {
          console.error('❌ [STOCK] Erro ao buscar:', error)
          set({ error: error.message, loading: false, fetched: false })
        }
      },

      addItem: async (itemData) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('stock')
            .insert({
              user_id: user.id,
              name: itemData.name,
              category: itemData.category || null,
              quantity: itemData.quantity || 0,
              min_quantity: itemData.minQuantity || 0,
              unit: itemData.unit || 'un',
              doses_per_unit: itemData.dosesPerUnit || null,
              supplier: itemData.supplier || null,
              cost_price: itemData.costPrice || 0,
              sale_price: itemData.salePrice || null,
              barcode: itemData.barcode || null,
              notes: itemData.notes || null,
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchItems()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateItem: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = {}
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.category !== undefined) updateData.category = updates.category || null
          if (updates.quantity !== undefined) {
            // Garantir que quantity é um número válido
            const qty = Number(updates.quantity)
            if (isNaN(qty)) {
              console.error('❌ [STOCK] Quantidade inválida:', updates.quantity)
              throw new Error('Quantidade inválida')
            }
            // Arredondar para 2 casas decimais para evitar problemas de precisão
            updateData.quantity = Math.round(qty * 100) / 100
          }
          if (updates.minQuantity !== undefined) updateData.min_quantity = updates.minQuantity
          if (updates.unit !== undefined) updateData.unit = updates.unit
          if (updates.dosesPerUnit !== undefined) updateData.doses_per_unit = updates.dosesPerUnit || null
          if (updates.supplier !== undefined) updateData.supplier = updates.supplier || null
          if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice
          if (updates.salePrice !== undefined) updateData.sale_price = updates.salePrice || null
          if (updates.barcode !== undefined) updateData.barcode = updates.barcode || null
          if (updates.notes !== undefined) updateData.notes = updates.notes || null

          console.log('🔄 [STOCK] Atualizando item:', id, 'com dados:', JSON.stringify(updateData, null, 2))

          const { error } = await supabase
            .from('stock')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) {
            console.error('❌ [STOCK] Erro do Supabase:', JSON.stringify(error, null, 2))
            throw error
          }

          await get().fetchItems(true) // Forçar reload
          set({ loading: false })
        } catch (error: any) {
          console.error('❌ [STOCK] Erro ao atualizar item:', error)
          set({ error: error.message, loading: false })
        }
      },

      removeItem: async (id) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('stock')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          set((state) => ({
            movements: state.movements.filter(movement => movement.stockItemId !== id),
            alerts: state.alerts.filter(alert => alert.stockItemId !== id)
          }))

          await get().fetchItems()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getItem: (id) => {
        return get().items.find(item => item.id === id)
      },

      updateQuantity: async (id, newQuantity) => {
        await get().updateItem(id, { quantity: newQuantity })
      },

      addMovement: (movementData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const newMovement: StockMovement = {
          ...movementData,
          id,
          createdAt: now,
        }

        set((state) => ({
          movements: [...state.movements, newMovement]
        }))
      },

      getMovementsByItem: (stockItemId) => {
        return get().movements.filter(movement => movement.stockItemId === stockItemId)
      },

      addStock: async (itemId, quantity, reason, cost) => {
        const item = get().getItem(itemId)
        if (!item) return

        await get().updateItem(itemId, {
          quantity: item.quantity + quantity
        })

        get().addMovement({
          stockItemId: itemId,
          type: 'in',
          quantity,
          reason,
          cost
        })
      },

      removeStock: async (itemId, quantity, reason, procedureId, patientId) => {
        // Primeiro verificar localmente se tem estoque
        let item = get().getItem(itemId)

        // Calcular quantidade real a descontar baseado em dosesPerUnit
        // Se dosesPerUnit = 4, então cada aplicação desconta 1/4 = 0.25 unidades
        const actualQuantityToRemove = item?.dosesPerUnit && item.dosesPerUnit > 1
          ? quantity / item.dosesPerUnit
          : quantity

        // Se não encontrou localmente ou estoque insuficiente, buscar dados atualizados
        if (!item || item.quantity < actualQuantityToRemove) {
          await get().fetchItems(true)
          item = get().getItem(itemId)
        }

        if (!item) {
          console.error('❌ [STOCK] Item não encontrado:', itemId)
          return false
        }

        // Recalcular com dados atualizados
        const finalQuantityToRemove = item.dosesPerUnit && item.dosesPerUnit > 1
          ? quantity / item.dosesPerUnit
          : quantity

        if (item.quantity < finalQuantityToRemove) {
          console.error('❌ [STOCK] Estoque insuficiente:', item.name, 'Disponível:', item.quantity, 'Solicitado:', finalQuantityToRemove)
          return false
        }

        console.log('📦 [STOCK] Removendo', finalQuantityToRemove, 'de', item.name, '- Estoque atual:', item.quantity,
          item.dosesPerUnit ? `(${quantity} aplicações de ${item.dosesPerUnit} doses)` : '')

        await get().updateItem(itemId, {
          quantity: item.quantity - finalQuantityToRemove
        })

        get().addMovement({
          stockItemId: itemId,
          type: 'out',
          quantity: finalQuantityToRemove,
          reason,
          procedureId,
          patientId
        })

        return true
      },

      generateAlerts: () => {
        const items = get().items
        const existingAlerts = get().alerts
        const newAlerts: StockAlert[] = []

        items.forEach(item => {
          if (item.quantity <= item.minQuantity) {
            const existingAlert = existingAlerts.find(
              alert => alert.stockItemId === item.id && alert.type === 'low_stock'
            )
            
            if (!existingAlert) {
              newAlerts.push({
                id: crypto.randomUUID(),
                stockItemId: item.id,
                type: 'low_stock',
                message: `Estoque baixo: ${item.name} (${item.quantity} ${item.unit} restantes)`,
                isRead: false,
                createdAt: new Date().toISOString()
              })
            }
          }
        })

        if (newAlerts.length > 0) {
          set((state) => ({
            alerts: [...state.alerts, ...newAlerts]
          }))
        }
      },

      markAlertAsRead: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          )
        }))
      },

      getUnreadAlerts: () => {
        return get().alerts.filter(alert => !alert.isRead)
      }
    }),
    {
      name: 'stock-storage',
      partialize: (state) => ({
        movements: state.movements,
        alerts: state.alerts
      })
    }
  )
)
