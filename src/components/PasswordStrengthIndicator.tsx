import { useMemo } from 'react'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  showRequirements?: boolean
}

export default function PasswordStrengthIndicator({
  password,
  showRequirements = true
}: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const metRequirements = Object.values(requirements).filter(Boolean).length

    let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak'
    let strengthText = 'Muito fraca'
    let strengthColor = 'bg-red-500'
    let strengthTextColor = 'text-red-500'

    if (metRequirements >= 5) {
      strength = 'very-strong'
      strengthText = 'Muito forte'
      strengthColor = 'bg-green-500'
      strengthTextColor = 'text-green-600'
    } else if (metRequirements >= 4) {
      strength = 'strong'
      strengthText = 'Forte'
      strengthColor = 'bg-green-500'
      strengthTextColor = 'text-green-600'
    } else if (metRequirements >= 3) {
      strength = 'medium'
      strengthText = 'Média'
      strengthColor = 'bg-yellow-500'
      strengthTextColor = 'text-yellow-600'
    }

    return {
      requirements,
      metRequirements,
      strength,
      strengthText,
      strengthColor,
      strengthTextColor,
      percentage: (metRequirements / 5) * 100
    }
  }, [password])

  if (!password) return null

  return (
    <div className="space-y-2">
      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Força da senha</span>
          <span className={`text-xs font-medium ${analysis.strengthTextColor}`}>
            {analysis.strengthText}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${analysis.strengthColor} transition-all duration-300`}
            style={{ width: `${analysis.percentage}%` }}
          />
        </div>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="space-y-1 pt-2">
          <p className="text-xs text-gray-500 mb-2">Requisitos:</p>
          <div className="grid grid-cols-1 gap-1">
            <RequirementItem
              met={analysis.requirements.minLength}
              text="Mínimo 8 caracteres"
            />
            <RequirementItem
              met={analysis.requirements.hasUpperCase}
              text="Letra maiúscula (A-Z)"
            />
            <RequirementItem
              met={analysis.requirements.hasLowerCase}
              text="Letra minúscula (a-z)"
            />
            <RequirementItem
              met={analysis.requirements.hasNumber}
              text="Número (0-9)"
            />
            <RequirementItem
              met={analysis.requirements.hasSpecialChar}
              text="Caractere especial (!@#$...)"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <X className="w-3.5 h-3.5 text-gray-400" />
      )}
      <span className={`text-xs ${met ? 'text-gray-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  )
}
