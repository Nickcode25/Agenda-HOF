interface PageLoadingProps {
  message?: string
}

export default function PageLoading({ message = 'Carregando informações...' }: PageLoadingProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}
