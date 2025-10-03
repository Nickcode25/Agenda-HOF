export interface ProcedureStockItem {
  id: string
  procedureId: string
  stockItemId: string
  quantityUsed: number // Quantidade usada por procedimento
  isOptional: boolean // Se o item é opcional ou obrigatório
  notes?: string
}

// Extensão do tipo Procedure para incluir itens de estoque
export interface ProcedureWithStock {
  stockItems?: ProcedureStockItem[]
}
