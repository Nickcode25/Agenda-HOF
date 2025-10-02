import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Professional } from '@/types/professional'

export type ProfessionalsState = {
  professionals: Professional[]
  add: (p: Omit<Professional, 'id' | 'createdAt'>) => string
  update: (id: string, patch: Partial<Professional>) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
}

export const useProfessionals = create<ProfessionalsState>()(persist((set, get) => ({
  professionals: [],
  add: (p) => {
    const id = crypto.randomUUID()
    const newP: Professional = { id, createdAt: new Date().toISOString(), ...p }
    set({ professionals: [newP, ...get().professionals] })
    return id
  },
  update: (id, patch) => set({ professionals: get().professionals.map(p => p.id === id ? { ...p, ...patch } : p) }),
  remove: (id) => set({ professionals: get().professionals.filter(p => p.id !== id) }),
  toggleActive: (id) => set({ professionals: get().professionals.map(p => p.id === id ? { ...p, active: !p.active } : p) }),
}), { name: 'hof-professionals' }))
