import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Appointment, WaitlistItem } from '@/types/schedule'

export type ScheduleState = {
  appointments: Appointment[]
  waitlist: WaitlistItem[]
  addAppointment: (a: Omit<Appointment, 'id'>) => string
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  removeAppointment: (id: string) => void
  addWait: (w: Omit<WaitlistItem, 'id' | 'createdAt'>) => string
  removeWait: (id: string) => void
}

export const useSchedule = create<ScheduleState>()(persist((set, get) => ({
  appointments: [],
  waitlist: [],
  addAppointment: (a) => {
    const id = crypto.randomUUID()
    set({ appointments: [...get().appointments, { ...a, id }] })
    return id
  },
  updateAppointment: (id, patch) => set({ appointments: get().appointments.map(ap => ap.id === id ? { ...ap, ...patch } : ap) }),
  removeAppointment: (id) => set({ appointments: get().appointments.filter(ap => ap.id !== id) }),
  addWait: (w) => {
    const id = crypto.randomUUID()
    set({ waitlist: [{ ...w, id, createdAt: new Date().toISOString() }, ...get().waitlist] })
    return id
  },
  removeWait: (id) => set({ waitlist: get().waitlist.filter(w => w.id !== id) }),
}), { name: 'hof-schedule' }))
