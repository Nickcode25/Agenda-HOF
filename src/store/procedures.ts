import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Procedure } from '@/types/procedure'

export type ProceduresState = {
  procedures: Procedure[]
  add: (p: Omit<Procedure, 'id' | 'createdAt'>) => string
  update: (id: string, patch: Partial<Procedure>) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
}

export const useProcedures = create<ProceduresState>()(persist((set, get) => ({
  procedures: [],
  add: (p) => {
    const id = crypto.randomUUID()
    const newP: Procedure = { id, createdAt: new Date().toISOString(), ...p }
    set({ procedures: [newP, ...get().procedures] })
    return id
  },
  update: (id, patch) => set({ procedures: get().procedures.map(p => p.id === id ? { ...p, ...patch } : p) }),
  remove: (id) => set({ procedures: get().procedures.filter(p => p.id !== id) }),
  toggleActive: (id) => set({ procedures: get().procedures.map(p => p.id === id ? { ...p, active: !p.active } : p) }),
}), { name: 'hof-procedures' }))
