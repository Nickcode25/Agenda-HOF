import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { getTodayInSaoPaulo } from '@/utils/timezone'

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  course_name?: string
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  enrollment_date: string
  completion_date?: string
  payment_status: 'pending' | 'paid' | 'partial'
  amount_paid?: number
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

interface EnrollmentInput {
  student_id: string
  course_id: string
  status?: 'active' | 'completed' | 'cancelled' | 'pending'
  enrollment_date?: string
  payment_status?: 'pending' | 'paid' | 'partial'
  amount_paid?: number
  notes?: string
}

interface EnrollmentsState {
  enrollments: Enrollment[]
  loading: boolean
  fetched: boolean
  fetchAll: () => Promise<void>
  fetchByStudent: (studentId: string) => Promise<Enrollment[]>
  fetchByCourse: (courseId: string) => Promise<Enrollment[]>
  add: (enrollment: EnrollmentInput) => Promise<string | null>
  update: (id: string, enrollment: Partial<EnrollmentInput>) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  getByStudent: (studentId: string) => Enrollment[]
  getByCourse: (courseId: string) => Enrollment[]
}

export const useEnrollments = create<EnrollmentsState>((set, get) => ({
  enrollments: [],
  loading: false,
  fetched: false,

  fetchAll: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses:course_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const enrollmentsWithCourseName = (data || []).map(e => ({
        ...e,
        course_name: e.courses?.name
      }))

      set({ enrollments: enrollmentsWithCourseName, fetched: true })
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchByStudent: async (studentId: string) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return []
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses:course_id (name, price, duration_hours, status)
        `)
        .eq('user_id', user.id)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const enrollmentsWithCourseName = (data || []).map(e => ({
        ...e,
        course_name: e.courses?.name,
        course_price: e.courses?.price,
        course_duration: e.courses?.duration_hours,
        course_status: e.courses?.status
      }))

      // Atualizar o estado global também
      set(state => {
        const otherEnrollments = state.enrollments.filter(e => e.student_id !== studentId)
        return { enrollments: [...otherEnrollments, ...enrollmentsWithCourseName] }
      })

      return enrollmentsWithCourseName
    } catch (error) {
      console.error('Error fetching student enrollments:', error)
      return []
    } finally {
      set({ loading: false })
    }
  },

  fetchByCourse: async (courseId: string) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return []
      }

      // Primeiro buscar as matrículas do curso
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      if (!enrollmentsData || enrollmentsData.length === 0) {
        return []
      }

      // Buscar os dados dos alunos
      const studentIds = [...new Set(enrollmentsData.map(e => e.student_id))]
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, phone')
        .in('id', studentIds)

      if (studentsError) throw studentsError

      // Criar um mapa de alunos para acesso rápido
      const studentsMap = new Map((studentsData || []).map(s => [s.id, s]))

      // Mapear para incluir dados do aluno no nível principal
      const enrollmentsWithStudentData = enrollmentsData.map(e => {
        const student = studentsMap.get(e.student_id)
        return {
          ...e,
          student_name: student?.name || 'Aluno não encontrado',
          student_phone: student?.phone
        }
      })

      return enrollmentsWithStudentData
    } catch (error) {
      console.error('Error fetching course enrollments:', error)
      return []
    } finally {
      set({ loading: false })
    }
  },

  add: async (enrollmentInput) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return null
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          ...enrollmentInput,
          status: enrollmentInput.status || 'active',
          payment_status: enrollmentInput.payment_status || 'pending',
          enrollment_date: enrollmentInput.enrollment_date || getTodayInSaoPaulo(),
          user_id: user.id
        })
        .select(`
          *,
          courses:course_id (name)
        `)
        .single()

      if (error) throw error

      const enrollmentWithName = {
        ...data,
        course_name: data.courses?.name
      }

      set(state => ({
        enrollments: [enrollmentWithName, ...state.enrollments]
      }))

      return data.id
    } catch (error) {
      console.error('Error adding enrollment:', error)
      return null
    } finally {
      set({ loading: false })
    }
  },

  update: async (id, enrollmentInput) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          ...enrollmentInput,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        enrollments: state.enrollments.map(e =>
          e.id === id ? { ...e, ...enrollmentInput, updated_at: new Date().toISOString() } : e
        )
      }))

      return true
    } catch (error) {
      console.error('Error updating enrollment:', error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  remove: async (id) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        enrollments: state.enrollments.filter(e => e.id !== id)
      }))

      return true
    } catch (error) {
      console.error('Error removing enrollment:', error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  getByStudent: (studentId) => {
    return get().enrollments.filter(e => e.student_id === studentId)
  },

  getByCourse: (courseId) => {
    return get().enrollments.filter(e => e.course_id === courseId)
  }
}))
