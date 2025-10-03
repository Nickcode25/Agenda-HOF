import { createContext, useContext, useState, ReactNode } from 'react'

interface ProfessionalContextType {
  selectedProfessional: string
  setSelectedProfessional: (id: string) => void
}

const ProfessionalContext = createContext<ProfessionalContextType | undefined>(undefined)

export function ProfessionalProvider({ children }: { children: ReactNode }) {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')

  return (
    <ProfessionalContext.Provider value={{ selectedProfessional, setSelectedProfessional }}>
      {children}
    </ProfessionalContext.Provider>
  )
}

export function useProfessionalContext() {
  const context = useContext(ProfessionalContext)
  if (context === undefined) {
    throw new Error('useProfessionalContext must be used within a ProfessionalProvider')
  }
  return context
}
