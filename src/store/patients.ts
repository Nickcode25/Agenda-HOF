import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Patient } from '@/types/patient'

export type PatientsState = {
  patients: Patient[]
  add: (p: Omit<Patient, 'id' | 'createdAt'>) => string
  update: (id: string, patch: Partial<Patient>) => void
  remove: (id: string) => void
}

export const usePatients = create<PatientsState>()(persist((set, get) => ({
  patients: [],
  add: (p) => {
    const id = crypto.randomUUID()
    const newP: Patient = { id, createdAt: new Date().toISOString(), ...p }
    set({ patients: [newP, ...get().patients] })
    return id
  },
  update: (id, patch) => set({ patients: get().patients.map(p => p.id === id ? { ...p, ...patch } : p) }),
  remove: (id) => set({ patients: get().patients.filter(p => p.id !== id) }),
}), { name: 'hof-patients' }))
