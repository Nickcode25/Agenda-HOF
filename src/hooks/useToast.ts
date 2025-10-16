import { create } from 'zustand'
import { ToastType } from '../components/Toast'

interface ToastState {
  message: string
  type: ToastType
  isVisible: boolean
  show: (message: string, type: ToastType) => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  show: (message, type) => set({ message, type, isVisible: true }),
  hide: () => set({ isVisible: false })
}))
