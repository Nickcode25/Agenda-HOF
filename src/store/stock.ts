import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StockItem, StockMovement, StockAlert } from '@/types/stock'

interface StockStore {
  items: StockItem[]
  movements: StockMovement[]
  alerts: StockAlert[]
  
  // Stock Items
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateItem: (id: string, updates: Partial<StockItem>) => void
  removeItem: (id: string) => void
  getItem: (id: string) => StockItem | undefined
  
  // Stock Movements
  addMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void
  getMovementsByItem: (stockItemId: string) => StockMovement[]
  
  // Stock Operations
  addStock: (itemId: string, quantity: number, reason: string, cost?: number) => void
  removeStock: (itemId: string, quantity: number, reason: string, procedureId?: string, patientId?: string) => boolean
  
  // Alerts
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

      addItem: (itemData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const newItem: StockItem = {
          ...itemData,
          id,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          items: [...state.items, newItem]
        }))

        // Gerar alertas após adicionar item
        get().generateAlerts()
        
        return id
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          )
        }))
        
        get().generateAlerts()
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
          movements: state.movements.filter(movement => movement.stockItemId !== id),
          alerts: state.alerts.filter(alert => alert.stockItemId !== id)
        }))
      },

      getItem: (id) => {
        return get().items.find(item => item.id === id)
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

      addStock: (itemId, quantity, reason, cost) => {
        const item = get().getItem(itemId)
        if (!item) return

        // Atualizar quantidade do item
        get().updateItem(itemId, {
          quantity: item.quantity + quantity
        })

        // Registrar movimento
        get().addMovement({
          stockItemId: itemId,
          type: 'in',
          quantity,
          reason,
          cost
        })
      },

      removeStock: (itemId, quantity, reason, procedureId, patientId) => {
        const item = get().getItem(itemId)
        if (!item || item.quantity < quantity) {
          return false // Estoque insuficiente
        }

        // Atualizar quantidade do item
        get().updateItem(itemId, {
          quantity: item.quantity - quantity
        })

        // Registrar movimento
        get().addMovement({
          stockItemId: itemId,
          type: 'out',
          quantity,
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
          // Alerta de estoque baixo
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

          // Alerta de vencimento
          if (item.expirationDate) {
            const expirationDate = new Date(item.expirationDate)
            const today = new Date()
            const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilExpiration <= 0) {
              const existingAlert = existingAlerts.find(
                alert => alert.stockItemId === item.id && alert.type === 'expired'
              )
              
              if (!existingAlert) {
                newAlerts.push({
                  id: crypto.randomUUID(),
                  stockItemId: item.id,
                  type: 'expired',
                  message: `Produto vencido: ${item.name}`,
                  isRead: false,
                  createdAt: new Date().toISOString()
                })
              }
            } else if (daysUntilExpiration <= 30) {
              const existingAlert = existingAlerts.find(
                alert => alert.stockItemId === item.id && alert.type === 'expiring_soon'
              )
              
              if (!existingAlert) {
                newAlerts.push({
                  id: crypto.randomUUID(),
                  stockItemId: item.id,
                  type: 'expiring_soon',
                  message: `Produto vencendo em ${daysUntilExpiration} dias: ${item.name}`,
                  isRead: false,
                  createdAt: new Date().toISOString()
                })
              }
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
    }
  )
)
