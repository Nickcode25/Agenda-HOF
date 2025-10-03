import { useStock } from '@/store/stock'

// Mapeamento de procedimentos para produtos do estoque
// Cada procedimento pode usar múltiplos produtos
export const PROCEDURE_STOCK_MAP: Record<string, Array<{
  stockItemName: string
  quantityUsed: number
  unit: string
}>> = {
  // Toxina Botulínica / Botox
  'botox': [
    { stockItemName: 'Toxina Botulínica', quantityUsed: 50, unit: 'unidades' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 1, unit: 'unidade' }
  ],
  'toxina': [
    { stockItemName: 'Toxina Botulínica', quantityUsed: 50, unit: 'unidades' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 1, unit: 'unidade' }
  ],
  'botulínica': [
    { stockItemName: 'Toxina Botulínica', quantityUsed: 50, unit: 'unidades' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 1, unit: 'unidade' }
  ],

  // Preenchimento
  'preenchimento': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Anestésico Tópico', quantityUsed: 2, unit: 'g' }
  ],
  'ácido hialurônico': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 1, unit: 'unidade' }
  ],
  'hialuronico': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 1, unit: 'unidade' }
  ],

  // Rinomodelação
  'rino': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 2, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 2, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 2, unit: 'unidade' },
    { stockItemName: 'Anestésico Tópico', quantityUsed: 3, unit: 'g' }
  ],
  'nariz': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 2, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 2, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 2, unit: 'unidade' }
  ],

  // Procedimentos labiais
  'labial': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Anestésico Tópico', quantityUsed: 1, unit: 'g' }
  ],
  'lábio': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 1, unit: 'unidade' }
  ],

  // Harmonização facial (combinação)
  'harmonização': [
    { stockItemName: 'Toxina Botulínica', quantityUsed: 30, unit: 'unidades' },
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 2, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 3, unit: 'unidade' },
    { stockItemName: 'Agulha 30G', quantityUsed: 2, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 1, unit: 'unidade' },
    { stockItemName: 'Anestésico Tópico', quantityUsed: 3, unit: 'g' }
  ],
  'facial': [
    { stockItemName: 'Ácido Hialurônico', quantityUsed: 1.5, unit: 'ml' },
    { stockItemName: 'Seringa 1ml', quantityUsed: 2, unit: 'unidade' },
    { stockItemName: 'Agulha 27G', quantityUsed: 2, unit: 'unidade' }
  ]
}

// Função para encontrar produtos do estoque baseado no nome do procedimento
export function findStockItemsForProcedure(procedureName: string): Array<{
  stockItemName: string
  quantityUsed: number
  unit: string
}> {
  const name = procedureName.toLowerCase()
  
  // Procura por palavras-chave no nome do procedimento
  for (const [keyword, items] of Object.entries(PROCEDURE_STOCK_MAP)) {
    if (name.includes(keyword)) {
      return items
    }
  }
  
  return []
}

// Função para subtrair automaticamente do estoque quando procedimento for concluído
export function consumeStockForProcedure(
  procedureName: string, 
  quantity: number, 
  procedureId: string, 
  patientId: string
): { success: boolean; errors: string[] } {
  const stockItems = findStockItemsForProcedure(procedureName)
  const errors: string[] = []
  
  if (stockItems.length === 0) {
    // Se não há mapeamento, não é erro - apenas não consome estoque
    return { success: true, errors: [] }
  }

  // Usar o hook do estoque
  const { items, removeStock } = useStock.getState()
  
  for (const requiredItem of stockItems) {
    // Encontrar o item no estoque pelo nome
    const stockItem = items.find(item => 
      item.name.toLowerCase().includes(requiredItem.stockItemName.toLowerCase()) ||
      requiredItem.stockItemName.toLowerCase().includes(item.name.toLowerCase())
    )
    
    if (!stockItem) {
      errors.push(`Produto não encontrado no estoque: ${requiredItem.stockItemName}`)
      continue
    }
    
    const totalQuantityNeeded = requiredItem.quantityUsed * quantity
    
    // Verificar se há estoque suficiente
    if (stockItem.quantity < totalQuantityNeeded) {
      errors.push(
        `Estoque insuficiente de ${stockItem.name}. ` +
        `Necessário: ${totalQuantityNeeded} ${requiredItem.unit}, ` +
        `Disponível: ${stockItem.quantity} ${stockItem.unit}`
      )
      continue
    }
    
    // Consumir do estoque
    const success = removeStock(
      stockItem.id,
      totalQuantityNeeded,
      `Uso em procedimento: ${procedureName}`,
      procedureId,
      patientId
    )
    
    if (!success) {
      errors.push(`Falha ao consumir ${stockItem.name} do estoque`)
    }
  }
  
  return { 
    success: errors.length === 0, 
    errors 
  }
}

// Função para verificar se há estoque suficiente antes de realizar o procedimento
export function checkStockAvailability(
  procedureName: string, 
  quantity: number
): { available: boolean; missing: string[] } {
  const stockItems = findStockItemsForProcedure(procedureName)
  const missing: string[] = []
  
  if (stockItems.length === 0) {
    return { available: true, missing: [] }
  }

  const { items } = useStock.getState()
  
  for (const requiredItem of stockItems) {
    const stockItem = items.find(item => 
      item.name.toLowerCase().includes(requiredItem.stockItemName.toLowerCase()) ||
      requiredItem.stockItemName.toLowerCase().includes(item.name.toLowerCase())
    )
    
    if (!stockItem) {
      missing.push(`${requiredItem.stockItemName} (não cadastrado)`)
      continue
    }
    
    const totalQuantityNeeded = requiredItem.quantityUsed * quantity
    
    if (stockItem.quantity < totalQuantityNeeded) {
      missing.push(
        `${stockItem.name} (necessário: ${totalQuantityNeeded} ${requiredItem.unit}, ` +
        `disponível: ${stockItem.quantity} ${stockItem.unit})`
      )
    }
  }
  
  return { 
    available: missing.length === 0, 
    missing 
  }
}
