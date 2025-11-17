/**
 * Utilitários para busca de texto com suporte a acentos
 * Remove acentos e caracteres especiais para permitir buscas flexíveis
 */

/**
 * Remove acentos e caracteres especiais de uma string
 * Exemplo: "Luísa" -> "luisa", "João" -> "joao"
 * @param str - String a ser normalizada
 * @returns String sem acentos
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Normaliza uma string para busca (remove acentos e converte para minúsculas)
 * @param str - String a ser normalizada
 * @returns String normalizada para busca
 */
export function normalizeForSearch(str: string): string {
  return removeAccents(str.toLowerCase().trim())
}

/**
 * Verifica se uma string contém outra, ignorando acentos e maiúsculas/minúsculas
 * @param text - Texto onde buscar
 * @param search - Termo de busca
 * @returns true se o texto contém o termo de busca
 */
export function containsIgnoringAccents(text: string, search: string): boolean {
  if (!text || !search) return false
  return normalizeForSearch(text).includes(normalizeForSearch(search))
}

/**
 * Verifica se uma string começa com outra, ignorando acentos e maiúsculas/minúsculas
 * @param text - Texto onde buscar
 * @param search - Termo de busca
 * @returns true se o texto começa com o termo de busca
 */
export function startsWithIgnoringAccents(text: string, search: string): boolean {
  if (!text || !search) return false
  return normalizeForSearch(text).startsWith(normalizeForSearch(search))
}

/**
 * Verifica se alguma palavra do texto começa com o termo de busca
 * Útil para buscar nomes: "maria" encontra "Ana Maria Silva"
 * @param text - Texto onde buscar (ex: nome completo)
 * @param search - Termo de busca
 * @returns true se alguma palavra começa com o termo
 */
export function anyWordStartsWithIgnoringAccents(text: string, search: string): boolean {
  if (!text || !search) return false
  const normalizedText = normalizeForSearch(text)
  const normalizedSearch = normalizeForSearch(search)
  const words = normalizedText.split(' ')
  return words.some(word => word.startsWith(normalizedSearch)) || normalizedText.startsWith(normalizedSearch)
}
