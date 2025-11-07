// =============================================
// TIPOS PARA EVOLUÇÃO CLÍNICA E FOTOS
// Sistema simplificado focado em evolução e documentação fotográfica
// =============================================

export type EvolutionType = 'consultation' | 'procedure' | 'follow_up' | 'complication' | 'other'

export interface ClinicalEvolution {
  id: string
  user_id: string
  patient_id: string

  // Dados da evolução
  date: string
  professional_name: string
  evolution_type: EvolutionType

  // Conteúdo - Método SOAP
  subjective?: string // S - Subjetivo (o que o paciente relata)
  objective?: string // O - Objetivo (o que o profissional observa)
  assessment?: string // A - Avaliação/Diagnóstico
  plan?: string // P - Plano de tratamento

  // Procedimento realizado (se aplicável)
  procedure_performed?: string
  products_used?: string
  dosage?: string
  application_areas?: string

  // Observações
  observations?: string
  complications?: string
  next_appointment_date?: string

  // Metadados
  created_at: string
  updated_at: string
  created_by?: string
}

export type PhotoType = 'before' | 'after' | 'during' | 'complication'

export interface MedicalPhoto {
  id: string
  user_id: string
  patient_id: string

  // Dados da foto
  photo_url: string
  photo_type: PhotoType
  procedure_name?: string
  body_area?: string

  // Associação com evolução clínica
  clinical_evolution_id?: string

  // Descrição
  description?: string
  taken_at: string

  created_at: string
  created_by?: string
}

// =============================================
// TIPOS PARA FORMULÁRIOS
// =============================================

export interface ClinicalEvolutionFormData {
  date: string
  professional_name: string
  evolution_type: EvolutionType
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  procedure_performed?: string
  products_used?: string
  dosage?: string
  application_areas?: string
  observations?: string
  complications?: string
  next_appointment_date?: string
}

export interface MedicalPhotoFormData {
  photo_type: PhotoType
  procedure_name?: string
  body_area?: string
  clinical_evolution_id?: string
  description?: string
  taken_at?: string
}

// =============================================
// TIPOS AUXILIARES
// =============================================

// Agrupamento de fotos para exibição
export interface PhotoGroup {
  procedure_name?: string
  body_area?: string
  date: string
  before_photos: MedicalPhoto[]
  after_photos: MedicalPhoto[]
  during_photos: MedicalPhoto[]
}
