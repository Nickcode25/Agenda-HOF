import { create } from 'zustand'
import { supabase, getCachedUser } from '@/lib/supabase'
import { createISOFromDateTimeBR, getTodayInSaoPaulo, getCurrentTimeInSaoPaulo } from '@/utils/timezone'

export interface Course {
  id: string
  name: string
  description?: string
  duration_hours?: number
  price?: number
  max_students?: number
  start_date?: string
  end_date?: string
  status: 'active' | 'upcoming' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

interface CourseInput {
  name: string
  description?: string
  duration_hours?: number
  price?: number
  max_students?: number
  start_date?: string
  end_date?: string
  status?: 'active' | 'upcoming' | 'completed' | 'cancelled'
  notes?: string
}

interface CoursesState {
  courses: Course[]
  loading: boolean
  fetched: boolean
  fetchAll: () => Promise<void>
  add: (course: CourseInput) => Promise<string | null>
  update: (id: string, course: Partial<CourseInput>) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  getById: (id: string) => Course | undefined
}

export const useCourses = create<CoursesState>((set, get) => ({
  courses: [],
  loading: false,
  fetched: false,

  fetchAll: async () => {
    set({ loading: true })
    try {
      const user = await getCachedUser()
      if (!user) {
        set({ loading: false })
        return
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ courses: data || [], fetched: true })
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      set({ loading: false })
    }
  },

  add: async (courseInput) => {
    set({ loading: true })
    try {
      const user = await getCachedUser()
      if (!user) {
        set({ loading: false })
        return null
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseInput,
          status: courseInput.status || 'upcoming',
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        courses: [data, ...state.courses]
      }))

      return data.id
    } catch (error) {
      console.error('Error adding course:', error)
      return null
    } finally {
      set({ loading: false })
    }
  },

  update: async (id, courseInput) => {
    set({ loading: true })
    try {
      const nowISO = createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo())
      const { error } = await supabase
        .from('courses')
        .update({
          ...courseInput,
          updated_at: nowISO
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        courses: state.courses.map(c =>
          c.id === id ? { ...c, ...courseInput, updated_at: nowISO } : c
        )
      }))

      return true
    } catch (error) {
      console.error('Error updating course:', error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  remove: async (id) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        courses: state.courses.filter(c => c.id !== id)
      }))

      return true
    } catch (error) {
      console.error('Error removing course:', error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  getById: (id) => {
    return get().courses.find(c => c.id === id)
  }
}))
