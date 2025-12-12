/**
 * Componente de status de conexao Realtime
 *
 * Mostra indicador visual de conexao em tempo real
 */

import { memo } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimeStatusProps {
  isConnected: boolean
  lastUpdate?: Date | null
  className?: string
  showLabel?: boolean
}

function RealtimeStatusComponent({
  isConnected,
  lastUpdate,
  className = '',
  showLabel = false,
}: RealtimeStatusProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={
        isConnected
          ? lastUpdate
            ? `Conectado - Ultima atualizacao: ${formatTime(lastUpdate)}`
            : 'Conectado em tempo real'
          : 'Desconectado do servidor'
      }
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {showLabel && (
            <span className="text-xs text-green-600">Ao vivo</span>
          )}
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
          </span>
          {showLabel && (
            <span className="text-xs text-gray-500">Offline</span>
          )}
        </>
      )}
    </div>
  )
}

export const RealtimeStatus = memo(RealtimeStatusComponent)

/**
 * Componente de badge com status realtime
 */
interface RealtimeBadgeProps {
  isConnected: boolean
  label: string
  className?: string
}

function RealtimeBadgeComponent({
  isConnected,
  label,
  className = '',
}: RealtimeBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium
        ${isConnected
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
        }
        ${className}
      `}
    >
      {isConnected ? (
        <Wifi size={12} className="text-green-500" />
      ) : (
        <WifiOff size={12} className="text-gray-400" />
      )}
      {label}
    </div>
  )
}

export const RealtimeBadge = memo(RealtimeBadgeComponent)

export default RealtimeStatus
