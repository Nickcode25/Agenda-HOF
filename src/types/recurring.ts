// Bloqueio recorrente na agenda (ex: Almoço de segunda a sexta)
export type RecurringBlock = {
  id: string
  title: string // Ex: "Almoço", "Reunião semanal"
  startTime: string // Horário de início (HH:mm) - Ex: "12:00"
  endTime: string // Horário de término (HH:mm) - Ex: "13:30"
  daysOfWeek: number[] // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  active: boolean
  createdAt: string
}

// Dias da semana para seleção
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
]
