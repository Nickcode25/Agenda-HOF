import { create } from 'zustand'
import type { Appointment, WaitlistItem } from '@/types/schedule'
import { supabase } from '@/lib/supabase'
import { useStock } from './stock'

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
      const { data: { user } } = await supabase.auth.getUser()
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
      }))

      set({ appointments, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchAppointmentsByDateRange: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('start', startDate)
        .lte('start', endDate + 'T23:59:59')
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
      }))

      set({ appointments, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addAppointment: async (a) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          patient_id: a.patientId,
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
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchAppointments()
      set({ loading: false })
      return data.id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateAppointment: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (patch.patientId !== undefined) updateData.patient_id = patch.patientId
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

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAppointments()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  removeAppointment: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAppointments()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateAppointmentStatus: async (id, status) => {
    const appointment = get().appointments.find(ap => ap.id === id)

    // Se está marcando como concluído e tem produtos selecionados, subtrair do estoque
    if (status === 'done' && appointment?.selectedProducts && appointment.selectedProducts.length > 0) {
      const stock = useStock.getState()

      // Subtrair cada produto do estoque
      appointment.selectedProducts.forEach(product => {
        const stockItem = stock.items.find(s => s.id === product.stockItemId)
        if (stockItem) {
          const newQuantity = stockItem.quantity - product.quantity
          stock.updateQuantity(product.stockItemId, newQuantity >= 0 ? newQuantity : 0)
        }
      })
    }

    await get().updateAppointment(id, { status })
  },

  // ========== WAITLIST ==========

  fetchWaitlist: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addWait: async (w) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  removeWait: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchWaitlist()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
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
