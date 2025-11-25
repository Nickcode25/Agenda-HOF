import { format, getDay, parseISO, isSameDay } from 'date-fns'
import type { RecurringBlock } from '@/types/recurring'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime } from '@/utils/timezone'

// Tipo para um bloco virtual gerado a partir de uma regra recorrente
export type VirtualBlock = {
  id: string // Formato: recurringId_date
  title: string
  start: string // ISO
  end: string // ISO
  isRecurring: true
  recurringId: string // ID da regra original
}

// Normaliza o tempo para formato HH:mm (remove segundos se existirem)
function normalizeTime(time: string): string {
  // Se vier no formato HH:mm:ss, pegar apenas HH:mm
  return time.substring(0, 5)
}

// Gera blocos virtuais para uma data específica baseado nas regras recorrentes
export function generateVirtualBlocksForDate(
  date: Date,
  recurringBlocks: RecurringBlock[]
): VirtualBlock[] {
  const dayOfWeek = getDay(date) // 0 = Domingo, 1 = Segunda, ...
  const dateStr = format(date, 'yyyy-MM-dd')

  const virtualBlocks: VirtualBlock[] = []

  for (const block of recurringBlocks) {
    // Verificar se o bloqueio está ativo e se aplica a este dia da semana
    if (!block.active || !block.daysOfWeek.includes(dayOfWeek)) {
      continue
    }

    // Normalizar horários (remover segundos se existirem)
    const startTime = normalizeTime(block.startTime)
    const endTime = normalizeTime(block.endTime)

    // Criar timestamps ISO para este dia específico
    const startISO = `${dateStr}T${startTime}:00`
    const endISO = `${dateStr}T${endTime}:00`

    virtualBlocks.push({
      id: `${block.id}_${dateStr}`,
      title: block.title,
      start: startISO,
      end: endISO,
      isRecurring: true,
      recurringId: block.id,
    })
  }

  return virtualBlocks
}

// Converte minutos desde meia-noite para string HH:mm
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// Converte string HH:mm para minutos desde meia-noite
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

// Aplica a lógica de sobreposição: quando um agendamento real existe,
// o bloco recorrente é "cortado" naquele período
export function applyOverlapLogic(
  virtualBlocks: VirtualBlock[],
  appointments: Appointment[],
  date: Date
): VirtualBlock[] {
  // Filtrar agendamentos do dia (não pessoais, não cancelados)
  const dayAppointments = appointments.filter(apt => {
    const aptDate = toSaoPauloTime(parseISO(apt.start))
    return isSameDay(aptDate, date) && !apt.isPersonal && apt.status !== 'cancelled'
  })

  if (dayAppointments.length === 0) {
    return virtualBlocks
  }

  const result: VirtualBlock[] = []

  for (const block of virtualBlocks) {
    const blockStartMinutes = timeToMinutes(block.start.split('T')[1].substring(0, 5))
    const blockEndMinutes = timeToMinutes(block.end.split('T')[1].substring(0, 5))
    const dateStr = format(date, 'yyyy-MM-dd')

    // Coletar todos os "cortes" (períodos ocupados por agendamentos)
    const cuts: { start: number; end: number }[] = []

    for (const apt of dayAppointments) {
      // Usar timezone de São Paulo para obter o horário correto
      const aptStartSP = toSaoPauloTime(parseISO(apt.start))
      const aptEndSP = toSaoPauloTime(parseISO(apt.end))

      const aptStartMinutes = aptStartSP.getHours() * 60 + aptStartSP.getMinutes()
      const aptEndMinutes = aptEndSP.getHours() * 60 + aptEndSP.getMinutes()

      // Verificar se há sobreposição
      if (aptStartMinutes < blockEndMinutes && aptEndMinutes > blockStartMinutes) {
        cuts.push({
          start: Math.max(aptStartMinutes, blockStartMinutes),
          end: Math.min(aptEndMinutes, blockEndMinutes)
        })
      }
    }

    // Se não há cortes, manter o bloco original
    if (cuts.length === 0) {
      result.push(block)
      continue
    }

    // Ordenar cortes por início
    cuts.sort((a, b) => a.start - b.start)

    // Mesclar cortes sobrepostos
    const mergedCuts: { start: number; end: number }[] = []
    for (const cut of cuts) {
      if (mergedCuts.length === 0) {
        mergedCuts.push(cut)
      } else {
        const last = mergedCuts[mergedCuts.length - 1]
        if (cut.start <= last.end) {
          last.end = Math.max(last.end, cut.end)
        } else {
          mergedCuts.push(cut)
        }
      }
    }

    // Gerar os blocos restantes (partes não cortadas)
    let currentStart = blockStartMinutes
    let partIndex = 0

    for (const cut of mergedCuts) {
      // Se há espaço antes do corte, criar um bloco
      if (currentStart < cut.start) {
        result.push({
          ...block,
          id: `${block.id}_part${partIndex}`,
          start: `${dateStr}T${minutesToTime(currentStart)}:00`,
          end: `${dateStr}T${minutesToTime(cut.start)}:00`,
        })
        partIndex++
      }
      currentStart = cut.end
    }

    // Se sobrou espaço após o último corte
    if (currentStart < blockEndMinutes) {
      result.push({
        ...block,
        id: `${block.id}_part${partIndex}`,
        start: `${dateStr}T${minutesToTime(currentStart)}:00`,
        end: `${dateStr}T${minutesToTime(blockEndMinutes)}:00`,
      })
    }
  }

  return result
}

// Função principal: gera todos os blocos virtuais para um período, com sobreposição aplicada
export function generateRecurringBlocksForPeriod(
  dates: Date[],
  recurringBlocks: RecurringBlock[],
  appointments: Appointment[]
): VirtualBlock[] {
  const allBlocks: VirtualBlock[] = []

  for (const date of dates) {
    const virtualBlocks = generateVirtualBlocksForDate(date, recurringBlocks)
    const blocksWithOverlap = applyOverlapLogic(virtualBlocks, appointments, date)
    allBlocks.push(...blocksWithOverlap)
  }

  return allBlocks
}
