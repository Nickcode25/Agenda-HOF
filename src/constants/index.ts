/**
 * Constantes globais da aplicacao
 * Centraliza "magic numbers" e valores de configuracao
 */

// ============================================
// TRIAL E ASSINATURA
// ============================================

/** Dias de trial gratuito para novos usuarios */
export const TRIAL_DAYS = 7

/** Dias padrao para renovacao de assinatura */
export const SUBSCRIPTION_RENEWAL_DAYS = 30

/** Dias antes do vencimento para notificar */
export const SUBSCRIPTION_EXPIRY_WARNING_DAYS = 3

// ============================================
// LIMITES E PAGINACAO
// ============================================

/** Itens por pagina em listagens */
export const DEFAULT_PAGE_SIZE = 20

/** Maximo de itens para busca */
export const MAX_SEARCH_RESULTS = 100

/** Maximo de arquivos para upload simultaneo */
export const MAX_UPLOAD_FILES = 10

/** Tamanho maximo de upload em MB */
export const MAX_UPLOAD_SIZE_MB = 5

/** Tamanho maximo de upload em bytes */
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

// ============================================
// TIMEOUTS E DELAYS
// ============================================

/** Timeout para requisicoes API em ms */
export const API_TIMEOUT_MS = 30000

/** Delay para debounce de busca em ms */
export const SEARCH_DEBOUNCE_MS = 300

/** Delay para auto-save em ms */
export const AUTO_SAVE_DELAY_MS = 1000

/** Duracao do toast em ms */
export const TOAST_DURATION_MS = 5000

/** Timeout para sessao inativa em ms (30 min) */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

// ============================================
// NOTIFICACOES
// ============================================

/** Dias para considerar procedimento pendente */
export const PROCEDURE_PENDING_DAYS = 7

/** Horas antes do agendamento para lembrete */
export const APPOINTMENT_REMINDER_HOURS = 24

/** Maximo de notificacoes para exibir */
export const MAX_NOTIFICATIONS_DISPLAY = 50

// ============================================
// CALENDARIO E AGENDA
// ============================================

/** Hora de inicio padrao da agenda */
export const CALENDAR_START_HOUR = 7

/** Hora de fim padrao da agenda */
export const CALENDAR_END_HOUR = 21

/** Intervalo padrao de agendamento em minutos */
export const DEFAULT_APPOINTMENT_INTERVAL_MINUTES = 30

/** Duracao padrao de agendamento em minutos */
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60

// ============================================
// VALIDACAO
// ============================================

/** Tamanho minimo de senha */
export const MIN_PASSWORD_LENGTH = 6

/** Tamanho maximo de nome */
export const MAX_NAME_LENGTH = 100

/** Tamanho maximo de descricao */
export const MAX_DESCRIPTION_LENGTH = 500

/** Tamanho do codigo de verificacao */
export const VERIFICATION_CODE_LENGTH = 6

/** Minutos de validade do codigo de verificacao */
export const VERIFICATION_CODE_EXPIRY_MINUTES = 15

// ============================================
// FINANCEIRO
// ============================================

/** Valor minimo para pagamento em BRL */
export const MIN_PAYMENT_AMOUNT_BRL = 1.00

/** Valor maximo para pagamento em BRL */
export const MAX_PAYMENT_AMOUNT_BRL = 999999.99

/** Casas decimais para valores monetarios */
export const CURRENCY_DECIMAL_PLACES = 2

// ============================================
// CACHE
// ============================================

/** Tempo de cache para dados estaticos em ms (1 hora) */
export const STATIC_CACHE_TTL_MS = 60 * 60 * 1000

/** Tempo de cache para dados dinamicos em ms (5 min) */
export const DYNAMIC_CACHE_TTL_MS = 5 * 60 * 1000

// ============================================
// RATE LIMITING (frontend)
// ============================================

/** Maximo de tentativas de login */
export const MAX_LOGIN_ATTEMPTS = 5

/** Tempo de bloqueio apos tentativas excedidas em ms (15 min) */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000

/** Intervalo minimo entre envio de emails em ms (1 min) */
export const EMAIL_COOLDOWN_MS = 60 * 1000

// ============================================
// UI/UX
// ============================================

/** Largura minima para desktop em px */
export const DESKTOP_BREAKPOINT_PX = 1024

/** Largura minima para tablet em px */
export const TABLET_BREAKPOINT_PX = 768

/** Duracao padrao de animacao em ms */
export const ANIMATION_DURATION_MS = 300

/** Z-index para modais */
export const MODAL_Z_INDEX = 50

/** Z-index para toasts */
export const TOAST_Z_INDEX = 60

/** Z-index para overlays */
export const OVERLAY_Z_INDEX = 40
