import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Patient, PlannedProcedure } from '@/types/patient'

export type PatientsState = {
  patients: Patient[]
  loading: boolean
  error: string | null
  // Actions
  fetchAll: () => void
  search: (query: string) => void
  add: (p: Omit<Patient, 'id' | 'createdAt'>) => string
  update: (id: string, patch: Partial<Patient>) => void
  remove: (id: string) => void
  clearError: () => void
}

export const usePatients = create<PatientsState>()(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,
      error: null,

      fetchAll: () => {
        // Dados já estão no state (persistidos)
        set({ loading: false, error: null })
      },

      search: (query: string) => {
        if (!query.trim()) {
          return
        }
        
        const allPatients = get().patients
        const filtered = allPatients.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.cpf.includes(query)
        )
        
        set({ patients: filtered })
      },

      add: (p) => {
        const newPatient: Patient = {
          ...p,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        }
        
        set({ 
          patients: [newPatient, ...get().patients]
        })
        
        return newPatient.id
      },

      update: (id, patch) => {
        set({ 
          patients: get().patients.map(p => 
            p.id === id ? { ...p, ...patch } : p
          )
        })
      },

      remove: (id) => {
        set({ 
          patients: get().patients.filter(p => p.id !== id)
        })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'patients-storage'
    }
  )
)
