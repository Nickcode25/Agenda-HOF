// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export interface SendVerificationCodeParams {
  to: string
  code: string
  userName: string
}

export interface SendSubscriptionConfirmationParams {
  to: string
  userName: string
  planName: string
  planPrice: string
  startDate: string
}

export interface SendPasswordResetParams {
  to: string
  userName: string
  resetLink: string
}

/**
 * Envia código de verificação para confirmação de cadastro
 */
export async function sendVerificationCode({ to, code, userName }: SendVerificationCodeParams) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, code, userName })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao enviar email:', data)
      return { success: false, error: data.error }
    }

    console.log('✅ Email de verificação enviado com sucesso')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return { success: false, error }
  }
}

/**
 * Envia confirmação de assinatura de plano
 */
export async function sendSubscriptionConfirmation({
  to,
  userName,
  planName,
  planPrice,
  startDate
}: SendSubscriptionConfirmationParams) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/email/send-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, userName, planName, planPrice, startDate })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao enviar email:', data)
      return { success: false, error: data.error }
    }

    console.log('✅ Email de confirmação de assinatura enviado com sucesso')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return { success: false, error }
  }
}

/**
 * Envia link para redefinição de senha
 */
export async function sendPasswordReset({
  to,
  userName,
  resetLink
}: SendPasswordResetParams) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/email/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, userName, resetLink })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao enviar email:', data)
      return { success: false, error: data.error }
    }

    console.log('✅ Email de reset de senha enviado com sucesso')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return { success: false, error }
  }
}
