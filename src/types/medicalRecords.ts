// =============================================
// TIPOS DO SISTEMA DE PRONTUÁRIO ELETRÔNICO
// =============================================

export interface Anamnesis {
  id: string
  user_id: string
  patient_id: string

  // Dados da anamnese
  chief_complaint?: string // Queixa principal
  current_illness_history?: string // História da doença atual
  previous_illnesses?: string // Doenças anteriores
  medications?: string // Medicações em uso
  allergies?: string // Alergias
  family_history?: string // Histórico familiar

  // Estilo de vida
  smoking: boolean
  alcohol_consumption: boolean
  physical_activity?: string

  // Específico para estética
  previous_aesthetic_procedures?: string
  skin_type?: string
  skin_concerns?: string
  expectations?: string

  // Metadados
  created_at: string
  updated_at: string
  created_by?: string
}

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

  // Associação
  clinical_evolution_id?: string

  // Descrição
  description?: string
  taken_at: string

  created_at: string
  created_by?: string
}

export type ConsentStatus = 'pending' | 'signed' | 'declined'

export interface InformedConsent {
  id: string
  user_id: string
  patient_id: string

  // Dados do consentimento
  procedure_name: string
  consent_text: string
  risks_explained?: string

  // Assinatura digital
  patient_signature_url?: string
  signed_at?: string
  witness_name?: string
  witness_signature_url?: string

  // Status
  status: ConsentStatus

  created_at: string
  created_by?: string
}

// Tipos para formulários
export interface AnamnesisFormData {
  chief_complaint?: string
  current_illness_history?: string
  previous_illnesses?: string
  medications?: string
  allergies?: string
  family_history?: string
  smoking: boolean
  alcohol_consumption: boolean
  physical_activity?: string
  previous_aesthetic_procedures?: string
  skin_type?: string
  skin_concerns?: string
  expectations?: string
}

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

// Tipos para agrupamento de fotos
export interface PhotoGroup {
  procedure_name?: string
  body_area?: string
  date: string
  before_photos: MedicalPhoto[]
  after_photos: MedicalPhoto[]
  during_photos: MedicalPhoto[]
}
