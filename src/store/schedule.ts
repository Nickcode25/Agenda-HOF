import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Appointment, WaitlistItem } from '@/types/schedule'

export type ScheduleState = {
  appointments: Appointment[]
  waitlist: WaitlistItem[]
  loading: boolean
  error: string | null
  
  // Appointments Actions
  fetchAppointments: () => void
  fetchAppointmentsByDateRange: (startDate: string, endDate: string) => void
  addAppointment: (a: Omit<Appointment, 'id'>) => string
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  removeAppointment: (id: string) => void
  updateAppointmentStatus: (id: string, status: 'scheduled' | 'confirmed' | 'done' | 'cancelled') => void
  
  // Waitlist Actions
  fetchWaitlist: () => void
  addWait: (w: Omit<WaitlistItem, 'id' | 'createdAt'>) => string
  removeWait: (id: string) => void
  markWaitlistAsContacted: (id: string) => void
  markWaitlistAsScheduled: (id: string) => void
  
  clearError: () => void
}

export const useSchedule = create<ScheduleState>()(
  persist(
    (set, get) => ({
      appointments: [],
      waitlist: [],
      loading: false,
      error: null,

      // ========== APPOINTMENTS ==========
      
      fetchAppointments: () => {
        set({ loading: false, error: null })
      },

      fetchAppointmentsByDateRange: (startDate: string, endDate: string) => {
        const allAppointments = get().appointments
        const filtered = allAppointments.filter(ap => {
          const apDate = new Date(ap.start).toISOString().split('T')[0]
          return apDate >= startDate && apDate <= endDate
        })
        set({ appointments: filtered, loading: false })
      },

      addAppointment: (a) => {
        const newAppointment: Appointment = {
          ...a,
          id: crypto.randomUUID()
        }
        
        set({ 
          appointments: [...get().appointments, newAppointment]
        })
        
        return newAppointment.id
      },

      updateAppointment: (id, patch) => {
        set({ 
          appointments: get().appointments.map(ap => 
            ap.id === id ? { ...ap, ...patch } : ap
          )
        })
      },

      removeAppointment: (id) => {
        set({ 
          appointments: get().appointments.filter(ap => ap.id !== id)
        })
      },

      updateAppointmentStatus: (id, status) => {
        set({ 
          appointments: get().appointments.map(ap => 
            ap.id === id ? { ...ap, status } : ap
          )
        })
      },

      // ========== WAITLIST ==========

      fetchWaitlist: () => {
        set({ loading: false, error: null })
      },

      addWait: (w) => {
        const newItem: WaitlistItem = {
          ...w,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        }
        
        set({ 
          waitlist: [newItem, ...get().waitlist]
        })
        
        return newItem.id
      },

      removeWait: (id) => {
        set({ 
          waitlist: get().waitlist.filter(w => w.id !== id)
        })
      },

      markWaitlistAsContacted: (id) => {
        set({ 
          waitlist: get().waitlist.filter(w => w.id !== id)
        })
      },

      markWaitlistAsScheduled: (id) => {
        set({ 
          waitlist: get().waitlist.filter(w => w.id !== id)
        })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'schedule-storage'
    }
  )
)
