import { useRef, useEffect, useCallback, useMemo, useState } from 'react'

/**
 * Hook para memoizar callbacks de forma mais eficiente
 *
 * Diferente do useCallback, este hook sempre retorna a mesma referencia
 * enquanto mantém o callback atualizado internamente
 *
 * @example
 * const handleClick = useStableCallback((id: string) => {
 *   // Este callback nunca muda de referencia
 *   doSomething(id, someDependency)
 * })
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

/**
 * Hook para detectar se o componente foi montado
 *
 * Util para evitar setState em componentes desmontados
 *
 * @example
 * const isMounted = useIsMounted()
 *
 * const fetchData = async () => {
 *   const data = await api.get()
 *   if (isMounted()) {
 *     setData(data)
 *   }
 * }
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}

/**
 * Hook para executar callback apenas uma vez quando condicao e verdadeira
 *
 * @example
 * useOnceWhen(isLoggedIn, () => {
 *   trackUserLogin()
 * })
 */
export function useOnceWhen(condition: boolean, callback: () => void): void {
  const hasRun = useRef(false)

  useEffect(() => {
    if (condition && !hasRun.current) {
      hasRun.current = true
      callback()
    }
  }, [condition, callback])
}

/**
 * Hook para valor anterior
 *
 * Retorna o valor da renderizacao anterior
 *
 * @example
 * const prevCount = usePrevious(count)
 * // count = 5, prevCount = 4
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Hook para comparar valor atual com anterior
 *
 * @example
 * const { current, previous, hasChanged } = useValueChange(count)
 */
export function useValueChange<T>(value: T) {
  const previous = usePrevious(value)
  const hasChanged = previous !== undefined && previous !== value

  return { current: value, previous, hasChanged }
}

/**
 * Hook para paginacao virtualizada de listas grandes
 *
 * @example
 * const { visibleItems, loadMore, hasMore } = useVirtualList(allItems, 20)
 */
export function useVirtualList<T>(
  items: T[],
  pageSize: number = 20
) {
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  )

  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, items.length))
  }, [pageSize, items.length])

  const reset = useCallback(() => {
    setVisibleCount(pageSize)
  }, [pageSize])

  // Reset quando items mudam significativamente
  useEffect(() => {
    if (items.length < visibleCount) {
      setVisibleCount(Math.max(pageSize, items.length))
    }
  }, [items.length, visibleCount, pageSize])

  return {
    visibleItems,
    loadMore,
    hasMore,
    reset,
    totalCount: items.length,
    visibleCount: visibleItems.length
  }
}

/**
 * Hook para detectar scroll proximo ao fim (infinite scroll)
 *
 * @example
 * const { ref, isNearBottom } = useInfiniteScroll({
 *   onReachBottom: () => loadMore(),
 *   threshold: 100
 * })
 *
 * return <div ref={ref}>...</div>
 */
export function useInfiniteScroll({
  onReachBottom,
  threshold = 100,
  enabled = true
}: {
  onReachBottom: () => void
  threshold?: number
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(false)
  const onReachBottomRef = useRef(onReachBottom)

  useEffect(() => {
    onReachBottomRef.current = onReachBottom
  }, [onReachBottom])

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      const nearBottom = distanceFromBottom < threshold
      setIsNearBottom(nearBottom)

      if (nearBottom) {
        onReachBottomRef.current()
      }
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [threshold, enabled])

  return { ref, isNearBottom }
}

/**
 * Hook para medir performance de renders
 *
 * Apenas em desenvolvimento
 *
 * @example
 * useRenderCount('MyComponent')
 * // Console: [MyComponent] Render count: 5
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0)

  useEffect(() => {
    if (import.meta.env.DEV) {
      renderCount.current += 1
      console.log(`[${componentName}] Render count:`, renderCount.current)
    }
  })
}

/**
 * Hook para medir tempo de execucao de efeitos
 *
 * Apenas em desenvolvimento
 *
 * @example
 * useEffectTiming('fetchData', () => {
 *   fetchData()
 * }, [dependencies])
 */
export function useEffectTiming(
  name: string,
  effect: () => void | (() => void),
  deps: unknown[]
): void {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return effect()
    }

    const start = performance.now()
    const cleanup = effect()
    const duration = performance.now() - start

    if (duration > 16) { // Mais que um frame (60fps)
      console.warn(`[${name}] Effect took ${duration.toFixed(2)}ms`)
    }

    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Hook para agrupar multiplas atualizacoes de estado
 *
 * Util para evitar multiplos re-renders
 *
 * @example
 * const { batchUpdate, isPending } = useBatchedUpdates()
 *
 * batchUpdate(() => {
 *   setName('John')
 *   setAge(30)
 *   setEmail('john@example.com')
 * })
 */
export function useBatchedUpdates() {
  const [isPending, setIsPending] = useState(false)
  const isMounted = useIsMounted()

  const batchUpdate = useCallback((callback: () => void) => {
    setIsPending(true)

    // React 18+ automaticamente agrupa atualizacoes
    // mas isso garante que funciona em qualquer contexto
    queueMicrotask(() => {
      callback()
      if (isMounted()) {
        setIsPending(false)
      }
    })
  }, [isMounted])

  return { batchUpdate, isPending }
}
