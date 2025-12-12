/**
 * Testes para hooks de debounce
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback, useThrottle } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve retornar valor inicial imediatamente', () => {
    const { result } = renderHook(() => useDebounce('teste', 500))
    expect(result.current).toBe('teste')
  })

  it('deve atualizar valor apos delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'inicial', delay: 500 } }
    )

    expect(result.current).toBe('inicial')

    // Atualizar valor
    rerender({ value: 'atualizado', delay: 500 })

    // Valor ainda nao deve ter mudado
    expect(result.current).toBe('inicial')

    // Avancar tempo
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Agora deve ter atualizado
    expect(result.current).toBe('atualizado')
  })

  it('deve cancelar atualizacao anterior se valor mudar', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'inicial', delay: 500 } }
    )

    // Primeira atualizacao
    rerender({ value: 'primeiro', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Segunda atualizacao antes do delay
    rerender({ value: 'segundo', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Ainda deve ser o valor inicial
    expect(result.current).toBe('inicial')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Deve pular para 'segundo', nao 'primeiro'
    expect(result.current).toBe('segundo')
  })

  it('deve funcionar com delay 0', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'inicial', delay: 0 } }
    )

    rerender({ value: 'atualizado', delay: 0 })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(result.current).toBe('atualizado')
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve chamar callback apos delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('argumento')
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledWith('argumento')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('deve cancelar chamadas anteriores', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('primeiro')
      result.current('segundo')
      result.current('terceiro')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Deve ter chamado apenas uma vez com o ultimo valor
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('terceiro')
  })

  it('deve permitir multiplas chamadas separadas por delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('primeiro')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('primeiro')

    act(() => {
      result.current('segundo')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('segundo')
  })
})

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve atualizar imediatamente na primeira chamada', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }) => useThrottle(value, limit),
      { initialProps: { value: 'inicial', limit: 500 } }
    )

    expect(result.current).toBe('inicial')
  })

  it('deve ignorar atualizacoes dentro do limite', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }) => useThrottle(value, limit),
      { initialProps: { value: 'inicial', limit: 500 } }
    )

    // Atualizar varias vezes rapidamente
    rerender({ value: 'atualizado1', limit: 500 })
    rerender({ value: 'atualizado2', limit: 500 })
    rerender({ value: 'atualizado3', limit: 500 })

    // Deve ter aceitado a primeira atualizacao
    expect(result.current).toBe('atualizado1')

    // Avancar tempo para permitir nova atualizacao
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Nova atualizacao apos o limite
    rerender({ value: 'final', limit: 500 })
    expect(result.current).toBe('final')
  })
})
