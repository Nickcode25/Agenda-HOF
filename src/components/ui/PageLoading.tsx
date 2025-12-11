interface PageLoadingProps {
  message?: string
  fullScreen?: boolean
}

export default function PageLoading({ message = 'Carregando informações...', fullScreen = false }: PageLoadingProps) {
  const containerClass = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'min-h-[60vh] bg-gray-50 flex items-center justify-center'

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}
