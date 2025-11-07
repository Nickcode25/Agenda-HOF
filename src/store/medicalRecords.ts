import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type {
  ClinicalEvolution,
  MedicalPhoto,
  ClinicalEvolutionFormData,
  MedicalPhotoFormData,
} from '@/types/medicalRecords'

interface MedicalRecordsState {
  // State - apenas evolução e fotos
  clinicalEvolutions: ClinicalEvolution[]
  medicalPhotos: MedicalPhoto[]
  loading: boolean

  // Clinical Evolution Actions
  fetchClinicalEvolutionsByPatient: (patientId: string) => Promise<void>
  createClinicalEvolution: (patientId: string, data: ClinicalEvolutionFormData) => Promise<void>
  updateClinicalEvolution: (id: string, data: Partial<ClinicalEvolutionFormData>) => Promise<void>
  deleteClinicalEvolution: (id: string) => Promise<void>

  // Medical Photos Actions
  fetchMedicalPhotosByPatient: (patientId: string) => Promise<void>
  uploadMedicalPhoto: (patientId: string, file: File, data: MedicalPhotoFormData) => Promise<void>
  updateMedicalPhoto: (id: string, data: Partial<MedicalPhotoFormData>) => Promise<void>
  deleteMedicalPhoto: (id: string, photoUrl: string) => Promise<void>
}

export const useMedicalRecords = create<MedicalRecordsState>((set, get) => ({
  clinicalEvolutions: [],
  medicalPhotos: [],
  loading: false,

  // ============================================
  // CLINICAL EVOLUTIONS
  // ============================================

  fetchClinicalEvolutionsByPatient: async (patientId: string) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('date', { ascending: false })

      if (error) throw error

      set({ clinicalEvolutions: data || [] })
    } catch (error) {
      console.error('Erro ao buscar evoluções clínicas:', error)
    } finally {
      set({ loading: false })
    }
  },

  createClinicalEvolution: async (patientId: string, formData: ClinicalEvolutionFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('clinical_evolutions')
        .insert({
          user_id: user.id,
          patient_id: patientId,
          ...formData,
          created_by: user.id,
        })

      if (error) throw error

      // Recarregar
      await get().fetchClinicalEvolutionsByPatient(patientId)
    } catch (error) {
      console.error('Erro ao criar evolução clínica:', error)
      throw error
    }
  },

  updateClinicalEvolution: async (id: string, updates: Partial<ClinicalEvolutionFormData>) => {
    try {
      const { error } = await supabase
        .from('clinical_evolutions')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Atualizar estado local
      set(state => ({
        clinicalEvolutions: state.clinicalEvolutions.map(ev =>
          ev.id === id ? { ...ev, ...updates } : ev
        )
      }))
    } catch (error) {
      console.error('Erro ao atualizar evolução clínica:', error)
      throw error
    }
  },

  deleteClinicalEvolution: async (id: string) => {
    try {
      const { error } = await supabase
        .from('clinical_evolutions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remover do estado local
      set(state => ({
        clinicalEvolutions: state.clinicalEvolutions.filter(ev => ev.id !== id)
      }))
    } catch (error) {
      console.error('Erro ao deletar evolução clínica:', error)
      throw error
    }
  },

  // ============================================
  // MEDICAL PHOTOS
  // ============================================

  fetchMedicalPhotosByPatient: async (patientId: string) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data, error } = await supabase
        .from('medical_photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('taken_at', { ascending: false })

      if (error) throw error

      set({ medicalPhotos: data || [] })
    } catch (error) {
      console.error('Erro ao buscar fotos médicas:', error)
    } finally {
      set({ loading: false })
    }
  },

  uploadMedicalPhoto: async (patientId: string, file: File, formData: MedicalPhotoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Upload da foto para o Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${patientId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('medical-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('medical-photos')
        .getPublicUrl(fileName)

      // Salvar registro no banco
      const { error: dbError } = await supabase
        .from('medical_photos')
        .insert({
          user_id: user.id,
          patient_id: patientId,
          photo_url: publicUrl,
          ...formData,
          taken_at: formData.taken_at || new Date().toISOString(),
          created_by: user.id,
        })

      if (dbError) throw dbError

      // Recarregar
      await get().fetchMedicalPhotosByPatient(patientId)
    } catch (error) {
      console.error('Erro ao fazer upload de foto médica:', error)
      throw error
    }
  },

  updateMedicalPhoto: async (id: string, formData: Partial<MedicalPhotoFormData>) => {
    try {
      const { error } = await supabase
        .from('medical_photos')
        .update({
          photo_type: formData.photo_type,
          procedure_name: formData.procedure_name,
          body_area: formData.body_area,
          description: formData.description,
          taken_at: formData.taken_at,
        })
        .eq('id', id)

      if (error) throw error

      // Atualizar no estado local
      set(state => ({
        medicalPhotos: state.medicalPhotos.map(photo =>
          photo.id === id ? { ...photo, ...formData } : photo
        )
      }))
    } catch (error) {
      console.error('Erro ao atualizar foto médica:', error)
      throw error
    }
  },

  deleteMedicalPhoto: async (id: string, photoUrl: string) => {
    try {
      // Extrair o path do arquivo da URL
      const url = new URL(photoUrl)
      const path = url.pathname.split('/medical-photos/')[1]

      // Deletar do Storage
      if (path) {
        await supabase.storage
          .from('medical-photos')
          .remove([path])
      }

      // Deletar do banco
      const { error } = await supabase
        .from('medical_photos')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remover do estado local
      set(state => ({
        medicalPhotos: state.medicalPhotos.filter(photo => photo.id !== id)
      }))
    } catch (error) {
      console.error('Erro ao deletar foto médica:', error)
      throw error
    }
  },
}))
