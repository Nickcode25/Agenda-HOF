import { useState, useCallback } from 'react'

/**
 * Reusable modal state management hook
 * Eliminates duplicated modal patterns across the codebase
 *
 * @returns {object} Modal state and control functions
 * @property {boolean} isOpen - Current modal open state
 * @property {function} open - Opens the modal
 * @property {function} close - Closes the modal
 * @property {function} toggle - Toggles modal state
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle
  }
}
