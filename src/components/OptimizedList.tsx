import { memo, useCallback, useMemo, useRef, useEffect, useState, ReactNode } from 'react'
import { useVirtualList, useInfiniteScroll } from '@/hooks/usePerformance'
import { useDebounce } from '@/hooks/useDebounce'
import { Loader2 } from 'lucide-react'

// ============================================
// TIPOS
// ============================================

export interface OptimizedListProps<T> {
  /** Array de itens para renderizar */
  items: T[]
  /** Funcao para renderizar cada item */
  renderItem: (item: T, index: number) => ReactNode
  /** Funcao para extrair chave unica de cada item */
  keyExtractor: (item: T, index: number) => string
  /** Termo de busca para filtrar itens */
  searchTerm?: string
  /** Funcao de filtro customizada */
  filterFn?: (item: T, searchTerm: string) => boolean
  /** Tamanho da pagina para virtualizacao */
  pageSize?: number
  /** Se deve usar infinite scroll */
  enableInfiniteScroll?: boolean
  /** Componente para lista vazia */
  emptyComponent?: ReactNode
  /** Componente de loading */
  loadingComponent?: ReactNode
  /** Se esta carregando dados */
  isLoading?: boolean
  /** Classes CSS adicionais */
  className?: string
  /** Altura maxima da lista (para scroll) */
  maxHeight?: string | number
}

// ============================================
// COMPONENTES INTERNOS MEMOIZADOS
// ============================================

interface MemoizedItemProps {
  item: unknown
  index: number
  renderItem: (item: unknown, index: number) => ReactNode
}

/**
 * Item memoizado - so re-renderiza se o item mudar
 */
const MemoizedItem = memo(function MemoizedItem({
  item,
  index,
  renderItem
}: MemoizedItemProps) {
  return <>{renderItem(item, index)}</>
}, (prevProps, nextProps) => {
  // Comparacao customizada para evitar re-renders desnecessarios
  return (
    prevProps.index === nextProps.index &&
    JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item)
  )
})

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * Lista otimizada com virtualizacao, memoizacao e infinite scroll
 *
 * @example
 * <OptimizedList
 *   items={patients}
 *   renderItem={(patient) => <PatientCard patient={patient} />}
 *   keyExtractor={(patient) => patient.id}
 *   searchTerm={searchTerm}
 *   filterFn={(patient, term) => patient.name.includes(term)}
 *   enableInfiniteScroll
 *   pageSize={20}
 * />
 */
function OptimizedListInner<T>({
  items,
  renderItem,
  keyExtractor,
  searchTerm = '',
  filterFn,
  pageSize = 20,
  enableInfiniteScroll = true,
  emptyComponent,
  loadingComponent,
  isLoading = false,
  className = '',
  maxHeight
}: OptimizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim() || !filterFn) {
      return items
    }
    return items.filter(item => filterFn(item, debouncedSearchTerm))
  }, [items, debouncedSearchTerm, filterFn])

  // Virtualizacao
  const {
    visibleItems,
    loadMore,
    hasMore
  } = useVirtualList(filteredItems, pageSize)

  // Infinite scroll
  const handleReachBottom = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore()
      setHasScrolledToBottom(true)
    }
  }, [hasMore, isLoading, loadMore])

  const { ref: scrollRef, isNearBottom } = useInfiniteScroll({
    onReachBottom: handleReachBottom,
    threshold: 200,
    enabled: enableInfiniteScroll
  })

  // Memoizar funcao de render (cast para unknown para compatibilidade com MemoizedItem)
  const memoizedRenderItem = useCallback(
    (item: unknown, index: number) => renderItem(item as T, index),
    [renderItem]
  )

  // Reset scroll position quando busca muda
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
    setHasScrolledToBottom(false)
  }, [debouncedSearchTerm])

  // Loading state
  if (isLoading && filteredItems.length === 0) {
    return loadingComponent || (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Empty state
  if (filteredItems.length === 0) {
    return emptyComponent || (
      <div className="text-center py-12 text-gray-500">
        {debouncedSearchTerm
          ? 'Nenhum resultado encontrado para sua busca'
          : 'Nenhum item para exibir'
        }
      </div>
    )
  }

  const containerStyle = maxHeight
    ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
    : undefined

  // Callback para combinar refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (scrollRef && typeof scrollRef === 'object') {
      (scrollRef as { current: HTMLDivElement | null }).current = node
    }
  }, [scrollRef])

  return (
    <div
      ref={setRefs}
      className={`overflow-auto ${className}`}
      style={containerStyle}
    >
      {visibleItems.map((item, index) => (
        <MemoizedItem
          key={keyExtractor(item, index)}
          item={item}
          index={index}
          renderItem={memoizedRenderItem}
        />
      ))}

      {/* Loading indicator para infinite scroll */}
      {enableInfiniteScroll && hasMore && (
        <div className="flex items-center justify-center py-4">
          {isNearBottom || hasScrolledToBottom ? (
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          ) : (
            <button
              onClick={loadMore}
              className="text-sm text-orange-500 hover:text-orange-600"
            >
              Carregar mais ({filteredItems.length - visibleItems.length} restantes)
            </button>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      {debouncedSearchTerm && (
        <div className="text-xs text-gray-400 text-center py-2">
          {filteredItems.length} resultado(s) encontrado(s)
        </div>
      )}
    </div>
  )
}

// Memoizar o componente principal
export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner

// ============================================
// COMPONENTE DE BUSCA OTIMIZADO
// ============================================

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isSearching?: boolean
}

/**
 * Input de busca otimizado com indicador de loading
 */
export const OptimizedSearchInput = memo(function OptimizedSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  isSearching = false
}: SearchInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      )}
    </div>
  )
})

// ============================================
// HOC PARA MEMOIZACAO DE COMPONENTES
// ============================================

/**
 * HOC para adicionar memoizacao profunda a um componente
 *
 * @example
 * const MemoizedCard = withDeepMemo(PatientCard)
 */
export function withDeepMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, propsAreEqual || ((prev, next) => {
    return JSON.stringify(prev) === JSON.stringify(next)
  }))

  MemoizedComponent.displayName = `DeepMemo(${Component.displayName || Component.name || 'Component'})`

  return MemoizedComponent
}

export default OptimizedList
