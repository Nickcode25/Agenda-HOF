import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isToday, parseISO, getDay, addMinutes, subMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/schedule'
import type { VirtualBlock } from '@/utils/recurringBlocks'
import { toSaoPauloTime, formatInSaoPaulo } from '@/utils/timezone'

type ViewMode = 'day' | 'week' | 'month'

interface WeekGridProps {
  currentDate: Date
  appointments: Appointment[]
  recurringBlocks?: VirtualBlock[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onTimeSlotSelect?: (date: Date, startHour: number, startMinutes: number, endHour: number, endMinutes: number) => void
  onAppointmentResize?: (appointmentId: string, newStart: Date, newEnd: Date) => void
  viewMode: ViewMode
}

export default function WeekGrid({
  currentDate,
  appointments,
  recurringBlocks = [],
  onAppointmentClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onAppointmentResize,
  viewMode
}: WeekGridProps) {
  // Altura de cada slot de hora em pixels
  // 60px por hora = estilo Google Agenda, mais compacto
  const HOUR_HEIGHT = 60

  // Estado para resize - agora com preview local para fluidez
  const [resizing, setResizing] = useState<{
    appointmentId: string
    edge: 'top' | 'bottom'
    initialY: number
    initialStart: Date
    initialEnd: Date
    currentStart: Date
    currentEnd: Date
  } | null>(null)

  // Estado para mostrar cursor de resize quando hover na borda
  const [hoverResizeId, setHoverResizeId] = useState<string | null>(null)

  // Estado para manter a posição visual enquanto salva no banco
  const [pendingSave, setPendingSave] = useState<{
    appointmentId: string
    newStart: Date
    newEnd: Date
  } | null>(null)

  // Flag para evitar que o click abra o modal após resize
  const justResizedRef = useRef(false)

  // Ref para o container de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Estado para seleção de arrasto (criar agendamento)
  const [dragging, setDragging] = useState<{
    day: Date
    startY: number
    startHour: number
    startMinutes: number
    currentHour: number
    currentMinutes: number
  } | null>(null)

  // Ref para o container principal para calcular posição do mouse
  const gridContainerRef = useRef<HTMLDivElement>(null)

  // Funções de resize - detecta se clicou na borda inferior
  // A área de resize é proporcional à altura do card para funcionar bem em agendamentos curtos
  const handleCardMouseDown = useCallback((
    e: React.MouseEvent<HTMLButtonElement>,
    apt: Appointment
  ) => {
    if (!onAppointmentResize) return

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY
    const distanceFromBottom = rect.bottom - mouseY
    const cardHeight = rect.height

    // Área de resize: 8px ou 30% da altura do card (o que for maior), limitado a 15px max
    const resizeAreaSize = Math.min(15, Math.max(8, cardHeight * 0.3))

    if (distanceFromBottom <= resizeAreaSize && distanceFromBottom >= 0) {
      e.stopPropagation()
      e.preventDefault()

      const start = parseISO(apt.start)
      const end = parseISO(apt.end)

      setResizing({
        appointmentId: apt.id,
        edge: 'bottom',
        initialY: e.clientY,
        initialStart: start,
        initialEnd: end,
        currentStart: start,
        currentEnd: end
      })
    }
    // Se não for na borda, deixa o clique normal acontecer (abre o modal)
  }, [onAppointmentResize])

  // Detecta se o mouse está na borda inferior para mostrar cursor de resize
  const handleCardMouseMove = useCallback((
    e: React.MouseEvent<HTMLButtonElement>,
    aptId: string
  ) => {
    if (!onAppointmentResize || resizing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY
    const distanceFromBottom = rect.bottom - mouseY
    const cardHeight = rect.height

    // Área de hover: 8px ou 30% da altura do card (o que for maior), limitado a 15px max
    const resizeAreaSize = Math.min(15, Math.max(8, cardHeight * 0.3))

    if (distanceFromBottom <= resizeAreaSize && distanceFromBottom >= 0) {
      setHoverResizeId(aptId)
    } else {
      if (hoverResizeId === aptId) {
        setHoverResizeId(null)
      }
    }
  }, [onAppointmentResize, resizing, hoverResizeId])

  const handleCardMouseLeave = useCallback((aptId: string) => {
    if (hoverResizeId === aptId) {
      setHoverResizeId(null)
    }
  }, [hoverResizeId])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return

    // Prevenir comportamento padrão para evitar seleção de texto e scroll
    e.preventDefault()

    const deltaY = e.clientY - resizing.initialY
    // Converter pixels para minutos (HOUR_HEIGHT px = 60 min)
    const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15 // Arredondar para 15 min

    let newStart = resizing.initialStart
    let newEnd = resizing.initialEnd

    if (resizing.edge === 'top') {
      newStart = addMinutes(resizing.initialStart, deltaMinutes)
      // Garantir que não ultrapasse o fim e tenha pelo menos 15 min
      if (newStart >= resizing.initialEnd) {
        newStart = subMinutes(resizing.initialEnd, 15)
      }
    } else {
      newEnd = addMinutes(resizing.initialEnd, deltaMinutes)
      // Garantir que não seja antes do início e tenha pelo menos 15 min
      if (newEnd <= resizing.initialStart) {
        newEnd = addMinutes(resizing.initialStart, 15)
      }
    }

    // Atualiza apenas o estado local (preview visual fluido)
    setResizing(prev => prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null)
  }, [resizing, HOUR_HEIGHT])

  const handleResizeEnd = useCallback(async (e?: MouseEvent) => {
    // Prevenir comportamento padrão para evitar scroll
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (resizing && onAppointmentResize) {
      // Marca que acabou de fazer resize para evitar abrir o modal
      justResizedRef.current = true
      setTimeout(() => {
        justResizedRef.current = false
      }, 100)

      // Guarda os valores antes de limpar o estado de resize
      const { appointmentId, currentStart, currentEnd } = resizing

      // Mantém a posição visual enquanto salva
      setPendingSave({ appointmentId, newStart: currentStart, newEnd: currentEnd })

      // Limpa o estado de resize
      setResizing(null)

      // Salva no banco e aguarda
      await onAppointmentResize(appointmentId, currentStart, currentEnd)

      // Limpa o estado de pendingSave após salvar
      setPendingSave(null)
    } else {
      setResizing(null)
    }
  }, [resizing, onAppointmentResize])

  // Adicionar listeners globais para mouse move/up durante resize
  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'

      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizing, handleResizeMove, handleResizeEnd])

  // Calcular hora e minutos a partir da posição Y relativa ao grid
  const getTimeFromY = useCallback((clientY: number, dayColumnElement: HTMLElement): { hour: number, minutes: number } => {
    const rect = dayColumnElement.getBoundingClientRect()
    // A posição relativa é simplesmente a diferença entre o click e o topo da coluna
    // O getBoundingClientRect já retorna a posição visual na tela, então não precisamos adicionar scrollTop
    const relativeY = clientY - rect.top

    // Calcular minutos desde as 7h (início do grid)
    const totalMinutes = Math.floor((relativeY / HOUR_HEIGHT) * 60)

    // Arredondar para intervalos de 15 minutos
    const roundedMinutes = Math.round(totalMinutes / 15) * 15

    // Converter para hora e minutos
    const hour = Math.floor(roundedMinutes / 60) + 7 // +7 porque o grid começa às 7h
    const minutes = roundedMinutes % 60

    // Limitar entre 7h e 23h59
    const clampedHour = Math.max(7, Math.min(23, hour))
    const clampedMinutes = clampedHour === 23 ? Math.min(45, minutes) : minutes

    return { hour: clampedHour, minutes: clampedMinutes }
  }, [HOUR_HEIGHT])

  // Handler para início do drag de seleção
  const handleDragStart = useCallback((e: React.MouseEvent, day: Date, dayColumnElement: HTMLElement) => {
    if (!onTimeSlotSelect || resizing) return

    e.preventDefault()

    const { hour, minutes } = getTimeFromY(e.clientY, dayColumnElement)

    // Calcular horário final inicial (mínimo de 30 minutos)
    let endHour = hour
    let endMinutes = minutes + 30
    if (endMinutes >= 60) {
      endHour += 1
      endMinutes -= 60
    }

    setDragging({
      day,
      startY: e.clientY,
      startHour: hour,
      startMinutes: minutes,
      currentHour: endHour,
      currentMinutes: endMinutes
    })
  }, [onTimeSlotSelect, resizing, getTimeFromY])

  // Handler para movimento do drag de seleção
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragging || !gridContainerRef.current) return

    e.preventDefault()

    // Encontrar a coluna do dia
    const dayColumns = gridContainerRef.current.querySelectorAll('[data-day-column]')
    const dayColumn = Array.from(dayColumns).find(col => {
      const rect = col.getBoundingClientRect()
      return e.clientX >= rect.left && e.clientX <= rect.right
    }) as HTMLElement | undefined

    if (!dayColumn) return

    const { hour, minutes } = getTimeFromY(e.clientY, dayColumn)

    // Garantir mínimo de 15 minutos
    let endHour = hour
    let endMinutes = minutes

    const startTotal = dragging.startHour * 60 + dragging.startMinutes
    const endTotal = endHour * 60 + endMinutes

    if (endTotal <= startTotal) {
      // Se arrastou para cima, usar pelo menos 15 minutos após o início
      endHour = dragging.startHour
      endMinutes = dragging.startMinutes + 15
      if (endMinutes >= 60) {
        endHour += 1
        endMinutes -= 60
      }
    }

    setDragging(prev => prev ? {
      ...prev,
      currentHour: endHour,
      currentMinutes: endMinutes
    } : null)
  }, [dragging, getTimeFromY])

  // Handler para fim do drag de seleção
  const handleDragEnd = useCallback((e?: MouseEvent) => {
    if (!dragging || !onTimeSlotSelect) {
      setDragging(null)
      return
    }

    if (e) {
      e.preventDefault()
    }

    const { day, startHour, startMinutes, currentHour, currentMinutes } = dragging

    // Garantir que o horário final seja depois do inicial
    const startTotal = startHour * 60 + startMinutes
    const endTotal = currentHour * 60 + currentMinutes

    if (endTotal > startTotal) {
      onTimeSlotSelect(day, startHour, startMinutes, currentHour, currentMinutes)
    } else {
      // Se clicou sem arrastar, criar agendamento de 30 minutos
      let endH = startHour
      let endM = startMinutes + 30
      if (endM >= 60) {
        endH += 1
        endM -= 60
      }
      onTimeSlotSelect(day, startHour, startMinutes, endH, endM)
    }

    setDragging(null)
  }, [dragging, onTimeSlotSelect])

  // Adicionar listeners globais para mouse move/up durante drag de seleção
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = 'crosshair'
      document.body.style.userSelect = 'none'

      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [dragging, handleDragMove, handleDragEnd])

  // Gerar dias baseado no modo de visualização
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate]
    }
    if (viewMode === 'week') {
      // Começar na segunda-feira (weekStartsOn: 1)
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const daysArray = []
      for (let i = 0; i < 7; i++) {
        daysArray.push(addDays(start, i))
      }
      return daysArray
    }
    // month - retorna todos os dias do mês
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysArray = []
    let day = monthStart
    while (day <= monthEnd) {
      daysArray.push(day)
      day = addDays(day, 1)
    }
    return daysArray
  }, [currentDate, viewMode])

  // Gerar horários (7h às 24h)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 7; hour <= 23; hour++) {
      slots.push(hour)
    }
    return slots
  }, [])

  // Obter agendamentos para um dia específico
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Obter bloqueios recorrentes para um dia específico
  const getRecurringBlocksForDay = (date: Date) => {
    return recurringBlocks.filter(block => {
      const blockDate = parseISO(block.start)
      return isSameDay(blockDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Encontrar o primeiro agendamento de hoje para scroll automático
  const firstTodayAppointment = useMemo(() => {
    const today = new Date()
    const todayAppointments = appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, today)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return todayAppointments[0] || null
  }, [appointments])

  // Scroll automático para o primeiro agendamento do dia ao carregar
  useEffect(() => {
    if (viewMode === 'month' || !scrollContainerRef.current) return

    // Pequeno delay para garantir que o DOM está renderizado
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return

      let scrollPosition = 0

      if (firstTodayAppointment) {
        // Se tem agendamento hoje, scroll para o primeiro agendamento
        const aptStart = toSaoPauloTime(parseISO(firstTodayAppointment.start))
        const startHour = aptStart.getHours()
        const startMinutes = aptStart.getMinutes()

        // Calcular posição em pixels (horário - 7h de início - 1h de margem)
        const hoursFromStart = Math.max(0, startHour - 7 - 1) // -1h para dar margem visual
        scrollPosition = (hoursFromStart * 60 + startMinutes) / 60 * HOUR_HEIGHT
      } else {
        // Se não tem agendamento, scroll para 8h da manhã (1h após o início)
        scrollPosition = HOUR_HEIGHT // 1 hora após as 7h
      }

      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [firstTodayAppointment, viewMode, HOUR_HEIGHT])

  // Calcular duração do agendamento em minutos
  const getAppointmentDuration = (apt: Appointment) => {
    const aptStart = toSaoPauloTime(parseISO(apt.start))
    const aptEnd = toSaoPauloTime(parseISO(apt.end))
    return (aptEnd.getTime() - aptStart.getTime()) / (1000 * 60)
  }

  // Verificar se dois períodos de tempo se sobrepõem (usando timestamps)
  const doTimesOverlap = (s1: number, e1: number, s2: number, e2: number) => {
    return s1 < e2 && s2 < e1
  }

  // Obter timestamps de um agendamento (considerando resize em andamento)
  const getAppointmentTimes = (apt: Appointment) => {
    const isBeingResized = resizing?.appointmentId === apt.id
    const isPending = pendingSave?.appointmentId === apt.id

    if (isBeingResized) {
      return {
        start: resizing.currentStart.getTime(),
        end: resizing.currentEnd.getTime()
      }
    }
    if (isPending) {
      return {
        start: pendingSave.newStart.getTime(),
        end: pendingSave.newEnd.getTime()
      }
    }
    return {
      start: new Date(apt.start).getTime(),
      end: new Date(apt.end).getTime()
    }
  }

  // Verificar se dois agendamentos se sobrepõem
  const doAppointmentsOverlap = (apt1: Appointment, apt2: Appointment) => {
    const times1 = getAppointmentTimes(apt1)
    const times2 = getAppointmentTimes(apt2)
    return doTimesOverlap(times1.start, times1.end, times2.start, times2.end)
  }

  // Verificar se um agendamento se sobrepõe com um bloqueio
  const doesAppointmentOverlapBlock = (apt: Appointment, block: VirtualBlock) => {
    const aptTimes = getAppointmentTimes(apt)
    const blockStart = new Date(block.start).getTime()
    const blockEnd = new Date(block.end).getTime()
    return doTimesOverlap(aptTimes.start, aptTimes.end, blockStart, blockEnd)
  }

  // Calcular posição horizontal para agendamentos sobrepostos (incluindo bloqueios recorrentes)
  const getOverlappingPosition = (apt: Appointment, dayAppointments: Appointment[], dayBlocks: VirtualBlock[]) => {
    // Encontrar todos os agendamentos que se sobrepõem com este
    const overlappingAppointments = dayAppointments.filter(other =>
      other.id !== apt.id && doAppointmentsOverlap(apt, other)
    )

    // Encontrar todos os bloqueios recorrentes que se sobrepõem com este agendamento
    const overlappingBlocks = dayBlocks.filter(block =>
      doesAppointmentOverlapBlock(apt, block)
    )

    const totalOverlapping = overlappingAppointments.length + overlappingBlocks.length

    if (totalOverlapping === 0) {
      return { index: 0, total: 1 }
    }

    // Criar lista unificada de todos os itens sobrepostos (agendamentos + bloqueios)
    // Convertendo para um formato comum para ordenação
    const allItems = [
      ...overlappingAppointments.map(a => ({ id: a.id, start: a.start, type: 'appointment' as const })),
      ...overlappingBlocks.map(b => ({ id: b.id, start: b.start, type: 'block' as const })),
      { id: apt.id, start: apt.start, type: 'appointment' as const }
    ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    // Bloqueios sempre ficam à esquerda (índice 0), agendamentos à direita
    const blocksCount = overlappingBlocks.length
    const appointmentIndex = allItems.filter(item => item.type === 'appointment').findIndex(a => a.id === apt.id)

    // Se há bloqueios, o agendamento fica após os bloqueios
    const index = blocksCount > 0 ? blocksCount + appointmentIndex : appointmentIndex
    return { index, total: allItems.length }
  }

  // Calcular posição horizontal para bloqueios recorrentes (considerando agendamentos sobrepostos)
  const getBlockOverlappingPosition = (block: VirtualBlock, dayAppointments: Appointment[], dayBlocks: VirtualBlock[]) => {
    const blockStart = new Date(block.start).getTime()
    const blockEnd = new Date(block.end).getTime()

    // Encontrar todos os agendamentos que se sobrepõem com este bloqueio
    const overlappingAppointments = dayAppointments.filter(apt => {
      const aptTimes = getAppointmentTimes(apt)
      return doTimesOverlap(blockStart, blockEnd, aptTimes.start, aptTimes.end)
    })

    // Encontrar outros bloqueios que se sobrepõem
    const overlappingBlocks = dayBlocks.filter(other => {
      if (other.id === block.id) return false
      const otherStart = new Date(other.start).getTime()
      const otherEnd = new Date(other.end).getTime()
      return doTimesOverlap(blockStart, blockEnd, otherStart, otherEnd)
    })

    const totalOverlapping = overlappingAppointments.length + overlappingBlocks.length

    if (totalOverlapping === 0) {
      return { index: 0, total: 1 }
    }

    // Bloqueios sempre ficam à esquerda
    const allItems = [
      ...overlappingBlocks.map(b => ({ id: b.id, start: b.start, type: 'block' as const })),
      ...overlappingAppointments.map(a => ({ id: a.id, start: a.start, type: 'appointment' as const })),
      { id: block.id, start: block.start, type: 'block' as const }
    ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    const blockIndex = allItems.filter(item => item.type === 'block').findIndex(b => b.id === block.id)
    return { index: blockIndex, total: allItems.length }
  }

  // Calcular posição e altura do agendamento baseado no horário
  const getAppointmentStyle = (apt: Appointment, dayAppointments: Appointment[], dayBlocks: VirtualBlock[]) => {
    // Se este agendamento está sendo redimensionado ou aguardando salvar, usa os valores do preview
    const isBeingResized = resizing?.appointmentId === apt.id
    const isPendingSave = pendingSave?.appointmentId === apt.id

    const aptStart = isBeingResized
      ? resizing.currentStart
      : isPendingSave
        ? pendingSave.newStart
        : toSaoPauloTime(parseISO(apt.start))

    const aptEnd = isBeingResized
      ? resizing.currentEnd
      : isPendingSave
        ? pendingSave.newEnd
        : toSaoPauloTime(parseISO(apt.end))

    // Calcular minutos desde o início do dia (7h)
    const startMinutesFromDayStart = (aptStart.getHours() - 7) * 60 + aptStart.getMinutes()
    const endMinutesFromDayStart = (aptEnd.getHours() - 7) * 60 + aptEnd.getMinutes()

    // Converter minutos para pixels (HOUR_HEIGHT pixels por 60 minutos)
    const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
    const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

    // Altura mínima de 20px para agendamentos curtos
    // Com HOUR_HEIGHT=60: 15min=15px, 30min=30px, 1h=60px
    const minHeight = 20

    // Calcular posição horizontal para agendamentos sobrepostos (incluindo bloqueios)
    const { index, total } = getOverlappingPosition(apt, dayAppointments, dayBlocks)
    const width = 100 / total
    const leftPercent = index * width

    return {
      top: `${topPx + 1}px`,
      height: `${Math.max(heightPx - 2, minHeight)}px`,
      position: 'absolute' as const,
      left: `calc(${leftPercent}% + 2px)`,
      width: `calc(${width}% - 4px)`,
    }
  }

  // Calcular posição e altura de um bloqueio recorrente
  const getRecurringBlockStyle = (block: VirtualBlock, dayAppointments: Appointment[], dayBlocks: VirtualBlock[]) => {
    const blockStart = parseISO(block.start)
    const blockEnd = parseISO(block.end)

    const startMinutesFromDayStart = (blockStart.getHours() - 7) * 60 + blockStart.getMinutes()
    const endMinutesFromDayStart = (blockEnd.getHours() - 7) * 60 + blockEnd.getMinutes()

    const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
    const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

    const minHeight = 18

    // Calcular posição horizontal para bloqueios sobrepostos com agendamentos
    const { index, total } = getBlockOverlappingPosition(block, dayAppointments, dayBlocks)
    const width = 100 / total
    const leftPercent = index * width

    return {
      top: `${topPx + 1}px`,
      height: `${Math.max(heightPx - 2, minHeight)}px`,
      position: 'absolute' as const,
      left: `calc(${leftPercent}% + 2px)`,
      width: `calc(${width}% - 4px)`,
    }
  }

  // Calcular duração de um bloqueio recorrente em minutos
  const getRecurringBlockDuration = (block: VirtualBlock) => {
    const blockStart = parseISO(block.start)
    const blockEnd = parseISO(block.end)
    return (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60)
  }

  // Obter classes de cor baseado no status do agendamento
  const getAppointmentColors = (apt: Appointment) => {
    // Compromisso pessoal = azul médio #3B82F6 (blue-500)
    if (apt.isPersonal) {
      return 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600'
    }

    switch (apt.status) {
      case 'confirmed':
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
      case 'done':
        // Cinza neutro #9CA3AF (gray-400)
        return 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
      default: // scheduled
        return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    }
  }

  // Grid columns baseado no modo
  const gridCols = viewMode === 'day' ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'

  // Renderizar visualização de mês
  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate)
    const dayOfWeek = getDay(monthStart)
    const startDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const calendarDays: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null)
    }
    days.forEach(day => calendarDays.push(day))

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dayName, index) => (
            <div key={index} className="p-3 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <span className="text-xs font-medium text-gray-500 uppercase">{dayName}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[100px] p-2 border-r border-b border-gray-100 bg-gray-50/50" />
            }

            const isDayToday = isToday(day)
            const dayAppointments = getAppointmentsForDay(day)

            return (
              <div
                key={index}
                onClick={() => onTimeSlotClick?.(day, 9)}
                className={`min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-all ${
                  isDayToday ? 'bg-[#FFF7ED]' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isDayToday ? 'text-orange-500' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <button
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(apt)
                      }}
                      className={`w-full text-left p-1 rounded ${getAppointmentColors(apt)} text-white text-xs truncate transition-all`}
                    >
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {apt.isPersonal ? apt.title : apt.patientName}
                    </button>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Renderizar visualização de dia ou semana
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header com dias */}
      <div className={`grid ${gridCols} border-b border-gray-200 flex-shrink-0`}>
        {/* Coluna vazia para horários */}
        <div className="p-3 bg-gray-50 border-r border-gray-200" />

        {/* Dias */}
        {days.map((day, index) => {
          const isDayToday = isToday(day)
          return (
            <div
              key={index}
              className={`p-3 ${viewMode === 'day' ? 'text-left pl-6' : 'text-center'} border-r border-gray-200 last:border-r-0 ${
                isDayToday ? 'bg-[#FFF7ED]' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 uppercase">
                {viewMode === 'day'
                  ? format(day, "EEEE, d 'de' MMMM", { locale: ptBR })
                  : format(day, 'EEE', { locale: ptBR })
                }
              </div>
              {viewMode !== 'day' && (
                <>
                  <div className={`text-lg font-bold mt-1 ${
                    isDayToday ? 'text-orange-500' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {isDayToday && (
                    <div className="text-xs text-orange-500 font-medium">(Hoje)</div>
                  )}
                </>
              )}
              {viewMode === 'day' && isDayToday && (
                <span className="ml-2 text-xs text-orange-500 font-medium">(Hoje)</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid de horários e agendamentos */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div ref={gridContainerRef} className={`grid ${gridCols}`}>
          {/* Coluna de horários */}
          <div className="border-r border-gray-200 bg-gray-50">
            {timeSlots.map(hour => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 font-medium border-b border-gray-100"
              >
                {String(hour).padStart(2, '0')}h00
              </div>
            ))}
          </div>

          {/* Colunas dos dias com agendamentos */}
          {days.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDay(day)
            const dayRecurringBlocks = getRecurringBlocksForDay(day)
            const isDayToday = isToday(day)

            // Verificar se há seleção de drag para este dia
            const isDraggingThisDay = dragging && isSameDay(dragging.day, day)

            // Calcular estilo da seleção de drag
            const getDragSelectionStyle = () => {
              if (!isDraggingThisDay || !dragging) return null

              const startMinutesFromDayStart = (dragging.startHour - 7) * 60 + dragging.startMinutes
              const endMinutesFromDayStart = (dragging.currentHour - 7) * 60 + dragging.currentMinutes

              const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
              const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

              return {
                top: `${topPx}px`,
                height: `${Math.max(heightPx, 15)}px`,
                position: 'absolute' as const,
                left: '4px',
                right: '4px',
                zIndex: 20
              }
            }

            const dragSelectionStyle = getDragSelectionStyle()

            return (
              <div
                key={dayIndex}
                data-day-column
                onMouseDown={(e) => {
                  // Só inicia o drag se clicou diretamente na coluna (não em um agendamento)
                  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('hour-slot')) {
                    handleDragStart(e, day, e.currentTarget)
                  }
                }}
                className={`relative border-r border-gray-200 last:border-r-0 ${
                  isDayToday ? 'bg-[#FFF7ED]/50' : ''
                } ${onTimeSlotSelect ? 'cursor-crosshair' : ''}`}
                style={{ height: `${timeSlots.length * HOUR_HEIGHT}px` }}
              >
                {/* Linhas de hora */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    onClick={() => !dragging && onTimeSlotClick?.(day, hour)}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="hour-slot border-b border-gray-200 cursor-crosshair hover:bg-orange-50/50 transition-colors"
                  />
                ))}

                {/* Seleção de drag visual */}
                {dragSelectionStyle && (
                  <div
                    style={dragSelectionStyle}
                    className="bg-orange-500/30 border-2 border-orange-500 border-dashed rounded-lg pointer-events-none flex items-center justify-center"
                  >
                    <span className="text-orange-700 text-xs font-medium bg-white/80 px-2 py-0.5 rounded">
                      {String(dragging!.startHour).padStart(2, '0')}:{String(dragging!.startMinutes).padStart(2, '0')} - {String(dragging!.currentHour).padStart(2, '0')}:{String(dragging!.currentMinutes).padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* Bloqueios recorrentes (renderizados lado a lado com agendamentos) */}
                {dayRecurringBlocks.map(block => {
                  // Recalcular estilo considerando agendamentos que podem estar sendo redimensionados
                  const blockStyle = getRecurringBlockStyle(block, dayAppointments, dayRecurringBlocks)
                  // Key dinâmica para forçar re-render quando resize muda
                  const dynamicKey = `${block.id}-${resizing?.appointmentId || 'none'}-${resizing?.currentEnd?.getTime() || 0}`
                  return (
                  <div
                    key={dynamicKey}
                    style={blockStyle}
                    className="rounded bg-orange-100 border border-dashed border-gray-200 overflow-hidden z-10 flex flex-col justify-center px-1.5 py-0.5 text-left opacity-90"
                  >
                    <div className="text-[10px] font-medium text-orange-600 leading-tight">
                      {format(parseISO(block.start), 'HH:mm')} - {format(parseISO(block.end), 'HH:mm')}
                    </div>
                    <div className="text-[11px] font-medium text-orange-700 leading-tight truncate w-full">
                      {block.title}
                    </div>
                  </div>
                  )
                })}

                {/* Agendamentos posicionados absolutamente */}
                {dayAppointments.map(apt => {
                  const isBeingResized = resizing?.appointmentId === apt.id
                  const isPendingSave = pendingSave?.appointmentId === apt.id

                  // Usa os valores do resize em andamento, ou do pendingSave, ou do banco
                  const displayStart = isBeingResized
                    ? resizing.currentStart
                    : isPendingSave
                      ? pendingSave.newStart
                      : parseISO(apt.start)

                  const showResizeCursor = hoverResizeId === apt.id || isBeingResized

                  return (
                    <button
                      key={apt.id}
                      onMouseDown={(e) => handleCardMouseDown(e, apt)}
                      onMouseMove={(e) => handleCardMouseMove(e, apt.id)}
                      onMouseLeave={() => handleCardMouseLeave(apt.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Só abre o modal se não estiver em resize e não acabou de fazer resize
                        if (!resizing && !justResizedRef.current) onAppointmentClick(apt)
                      }}
                      style={getAppointmentStyle(apt, dayAppointments, dayRecurringBlocks)}
                      className={`rounded ${getAppointmentColors(apt)} text-white shadow-sm hover:shadow-md overflow-hidden z-10 flex items-center justify-center px-1 border border-white/20 relative ${isBeingResized ? 'ring-2 ring-white/50' : ''} ${showResizeCursor ? 'cursor-ns-resize' : 'cursor-pointer'}`}
                    >
                      {/* Conteúdo do card - centralizado */}
                      <span className="text-[10px] font-medium opacity-90 whitespace-nowrap">
                        {format(displayStart, 'HH:mm')}
                      </span>
                      <span className="text-[11px] font-semibold truncate ml-1">
                        {apt.isPersonal ? apt.title : apt.patientName}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
