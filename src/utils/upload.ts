/**
 * Utilitário para validação de uploads de arquivos
 */

// Tipos de arquivo permitidos para imagens
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

// Tipos de arquivo permitidos para documentos
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

// Tamanho máximo de arquivo (em bytes)
export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  PHOTO: 2 * 1024 * 1024, // 2MB para fotos de pacientes
} as const

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida um arquivo de imagem
 */
export function validateImageFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}`,
    }
  }

  if (file.size > MAX_FILE_SIZE.IMAGE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE.IMAGE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Valida um arquivo de foto (para pacientes)
 */
export function validatePhotoFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}`,
    }
  }

  if (file.size > MAX_FILE_SIZE.PHOTO) {
    return {
      valid: false,
      error: `Foto muito grande. Tamanho máximo: ${MAX_FILE_SIZE.PHOTO / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Valida um arquivo de documento
 */
export function validateDocumentFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use: PDF, DOC ou DOCX',
    }
  }

  if (file.size > MAX_FILE_SIZE.DOCUMENT) {
    return {
      valid: false,
      error: `Documento muito grande. Tamanho máximo: ${MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Converte arquivo para base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}
