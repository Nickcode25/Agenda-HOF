/**
 * Retorna as cores específicas para cada tipo de procedimento
 *
 * Código de Cores:
 * 🟣 Roxo - Botox/Toxina Botulínica
 * 🩷 Rosa - Preenchimento/Ácido Hialurônico
 * 🩵 Ciano - Bioestimulador/Sculptra
 * 🟢 Verde - Limpeza/Peeling
 * 🔵 Azul - Avaliação/Consulta
 * 🟠 Laranja - Outros procedimentos
 */

export interface ProcedureColors {
  bg: string
  border: string
  text: string
  icon: string
  solid?: string
}

export function getProcedureColor(procedure: string): ProcedureColors {
  const procedureLower = procedure.toLowerCase()

  // Botox/Toxina
  if (procedureLower.includes('botox') || procedureLower.includes('toxina')) {
    return {
      bg: 'bg-purple-500/20 hover:bg-purple-500/30',
      border: 'border-purple-500/30 hover:border-purple-500/50',
      text: 'text-purple-300',
      icon: 'text-purple-400',
      solid: 'bg-purple-500'
    }
  }

  // Preenchimento
  if (procedureLower.includes('preenchimento') || procedureLower.includes('ácido') || procedureLower.includes('acido')) {
    return {
      bg: 'bg-pink-500/20 hover:bg-pink-500/30',
      border: 'border-pink-500/30 hover:border-pink-500/50',
      text: 'text-pink-300',
      icon: 'text-pink-400',
      solid: 'bg-pink-500'
    }
  }

  // Bioestimulador
  if (procedureLower.includes('bioestimulador') || procedureLower.includes('sculptra') || procedureLower.includes('radiesse')) {
    return {
      bg: 'bg-cyan-500/20 hover:bg-cyan-500/30',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      text: 'text-cyan-300',
      icon: 'text-cyan-400',
      solid: 'bg-cyan-500'
    }
  }

  // Limpeza/Peeling
  if (procedureLower.includes('limpeza') || procedureLower.includes('peeling') || procedureLower.includes('hidratação') || procedureLower.includes('hidratacao')) {
    return {
      bg: 'bg-green-500/20 hover:bg-green-500/30',
      border: 'border-green-500/30 hover:border-green-500/50',
      text: 'text-green-300',
      icon: 'text-green-400',
      solid: 'bg-green-500'
    }
  }

  // Avaliação/Consulta
  if (procedureLower.includes('avaliação') || procedureLower.includes('avaliacao') || procedureLower.includes('consulta')) {
    return {
      bg: 'bg-blue-500/20 hover:bg-blue-500/30',
      border: 'border-blue-500/30 hover:border-blue-500/50',
      text: 'text-blue-300',
      icon: 'text-blue-400',
      solid: 'bg-blue-500'
    }
  }

  // Outros procedimentos
  return {
    bg: 'bg-orange-500/20 hover:bg-orange-500/30',
    border: 'border-orange-500/30 hover:border-orange-500/50',
    text: 'text-orange-300',
    icon: 'text-orange-400',
    solid: 'bg-orange-500'
  }
}
