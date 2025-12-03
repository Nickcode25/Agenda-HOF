import { create } from 'zustand'
import type { Appointment, WaitlistItem } from '@/types/schedule'
import { supabase, getCachedUser } from '@/lib/supabase'
import { useStock } from './stock'
import { getErrorMessage } from '@/types/errors'

export type ScheduleState = {
  appointments: Appointment[]
  waitlist: WaitlistItem[]
  loading: boolean
  error: string | null
  
  // Appointments Actions
  fetchAppointments: () => Promise<void>
  fetchAppointmentsByDateRange: (startDate: string, endDate: string) => Promise<void>
  addAppointment: (a: Omit<Appointment, 'id'>) => Promise<string | null>
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<void>
  removeAppointment: (id: string) => Promise<void>
  updateAppointmentStatus: (id: string, status: 'scheduled' | 'confirmed' | 'done' | 'cancelled') => Promise<void>
  
  // Waitlist Actions
  fetchWaitlist: () => Promise<void>
  addWait: (w: Omit<WaitlistItem, 'id' | 'createdAt'>) => Promise<string | null>
  removeWait: (id: string) => Promise<void>
  markWaitlistAsContacted: (id: string) => Promise<void>
  markWaitlistAsScheduled: (id: string) => Promise<void>
  
  clearError: () => void
}

export const useSchedule = create<ScheduleState>((set, get) => ({
  appointments: [],
  waitlist: [],
  loading: false,
  error: null,

  // ========== APPOINTMENTS ==========
  
  fetchAppointments: async () => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('start', { ascending: true })

      if (error) throw error

      const appointments: Appointment[] = (data || []).map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        procedure: row.procedure,
        procedureId: row.procedure_id || undefined,
        selectedProducts: row.selected_products || undefined,
        professional: row.professional,
        room: row.room || undefined,
        start: row.start,
        end: row.end,
        notes: row.notes || undefined,
        status: row.status || 'scheduled',
        isPersonal: row.is_personal || false,
        title: row.title || undefined,
      }))

      set({ appointments, loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  fetchAppointmentsByDateRange: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Validar parâmetros antes de usar
      if (!startDate || !endDate) {
        throw new Error('Datas de início e fim são obrigatórias')
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('start', startDate)
        .lte('start', `${endDate}T23:59:59`)
        .order('start', { ascending: true })

      if (error) throw error

      const appointments: Appointment[] = (data || []).map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        procedure: row.procedure,
        procedureId: row.procedure_id || undefined,
        selectedProducts: row.selected_products || undefined,
        professional: row.professional,
        room: row.room || undefined,
        start: row.start,
        end: row.end,
        notes: row.notes || undefined,
        status: row.status || 'scheduled',
        isPersonal: row.is_personal || false,
        title: row.title || undefined,
      }))

      set({ appointments, loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  addAppointment: async (a) => {
    set({ loading: true, error: null })
    try {
      console.log('📅 [SCHEDULE] addAppointment chamado')
      const user = await getCachedUser()
      if (!user) {
        console.error('❌ [SCHEDULE] Usuário não autenticado')
        throw new Error('Usuário não autenticado')
      }
      console.log('📅 [SCHEDULE] User ID:', user.id)

      const insertData = {
        user_id: user.id,
        patient_id: a.patientId || null,
        patient_name: a.patientName,
        procedure: a.procedure,
        procedure_id: a.procedureId || null,
        selected_products: a.selectedProducts || null,
        professional: a.professional,
        room: a.room || null,
        start: a.start,
        end: a.end,
        notes: a.notes || null,
        status: a.status || 'scheduled',
        is_personal: a.isPersonal || false,
        title: a.title || null,
      }

      console.log('📅 [SCHEDULE] Dados a inserir:', insertData)

      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ [SCHEDULE] Erro do Supabase:', error)
        throw error
      }

      console.log('✅ [SCHEDULE] Agendamento criado com sucesso:', data.id)
      await get().fetchAppointments()
      set({ loading: false })
      return data.id
    } catch (error) {
      console.error('❌ [SCHEDULE] Erro ao criar agendamento:', error)
      set({ error: getErrorMessage(error), loading: false })
      return null
    }
  },

  updateAppointment: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (patch.patientId !== undefined) updateData.patient_id = patch.patientId || null
      if (patch.patientName !== undefined) updateData.patient_name = patch.patientName
      if (patch.procedure !== undefined) updateData.procedure = patch.procedure
      if (patch.procedureId !== undefined) updateData.procedure_id = patch.procedureId || null
      if (patch.selectedProducts !== undefined) updateData.selected_products = patch.selectedProducts || null
      if (patch.professional !== undefined) updateData.professional = patch.professional
      if (patch.room !== undefined) updateData.room = patch.room || null
      if (patch.start !== undefined) updateData.start = patch.start
      if (patch.end !== undefined) updateData.end = patch.end
      if (patch.notes !== undefined) updateData.notes = patch.notes || null
      if (patch.status !== undefined) updateData.status = patch.status
      if (patch.isPersonal !== undefined) updateData.is_personal = patch.isPersonal
      if (patch.title !== undefined) updateData.title = patch.title || null

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAppointments()
      set({ loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  removeAppointment: async (id) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAppointments()
      set({ loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  updateAppointmentStatus: async (id, status) => {
    const appointment = get().appointments.find(ap => ap.id === id)

    // Se está marcando como concluído, subtrair produtos do estoque
    if (status === 'done' && appointment) {
      const stock = useStock.getState()

      let productsToSubtract = appointment.selectedProducts || []

      // Se não tem selectedProducts, tentar buscar os produtos do procedimento
      if (productsToSubtract.length === 0) {
        const { useProcedures } = await import('./procedures')

        // Tentar buscar procedimento por ID ou por nome
        let procedure = appointment.procedureId
          ? useProcedures.getState().procedures.find(p => p.id === appointment.procedureId)
          : useProcedures.getState().procedures.find(p => p.name === appointment.procedure)

        if (procedure && procedure.stockCategories && procedure.stockCategories.length > 0) {
          // Mapear categorias para produtos reais
          productsToSubtract = []
          procedure.stockCategories.forEach(stockCat => {
            const categoryItems = stock.items.filter(item => item.category === stockCat.category)

            if (categoryItems.length > 0) {
              productsToSubtract.push({
                category: stockCat.category,
                stockItemId: categoryItems[0].id,
                quantity: stockCat.quantityUsed
              })
            }
          })

          // Atualizar o appointment com os produtos para futuras referências
          if (productsToSubtract.length > 0) {
            await get().updateAppointment(id, { selectedProducts: productsToSubtract })
          }
        }
      }

      // Subtrair cada produto do estoque
      if (productsToSubtract.length > 0) {
        for (const product of productsToSubtract) {
          const stockItem = stock.items.find(s => s.id === product.stockItemId)
          if (stockItem) {
            const newQuantity = stockItem.quantity - product.quantity
            await stock.updateQuantity(product.stockItemId, newQuantity >= 0 ? newQuantity : 0)
          }
        }
      }
    }

    await get().updateAppointment(id, { status })
  },

  // ========== WAITLIST ==========

  fetchWaitlist: async () => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const waitlist: WaitlistItem[] = (data || []).map(row => ({
        id: row.id,
        patientName: row.patient_name,
        phone: row.phone || undefined,
        desiredProcedure: row.desired_procedure || undefined,
        createdAt: row.created_at,
      }))

      set({ waitlist, loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  addWait: async (w) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          user_id: user.id,
          patient_name: w.patientName,
          phone: w.phone || null,
          desired_procedure: w.desiredProcedure || null,
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchWaitlist()
      set({ loading: false })
      return data.id
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
      return null
    }
  },

  removeWait: async (id) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchWaitlist()
      set({ loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  markWaitlistAsContacted: async (id) => {
    await get().removeWait(id)
  },

  markWaitlistAsScheduled: async (id) => {
    await get().removeWait(id)
  },

  clearError: () => set({ error: null }),
}))
