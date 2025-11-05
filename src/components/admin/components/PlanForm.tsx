import { Save, X } from 'lucide-react'

interface PlanFormData {
  name: string
  description: string
  price: string
  features: string
  duration_months: string
  has_trial: boolean
  trial_days: string
  billing_day: string
  retry_failed_payments: boolean
  max_retry_attempts: string
  retry_interval_days: string
}

interface PlanFormProps {
  formData: PlanFormData
  isEditing: boolean
  onFormDataChange: (data: Partial<PlanFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function PlanForm({ formData, isEditing, onFormDataChange, onSubmit, onCancel }: PlanFormProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <h4 className="text-xl font-bold text-white mb-4">
        {isEditing ? 'Editar Plano' : 'Novo Plano'}
      </h4>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Plano *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Plano Premium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preço Mensal (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => onFormDataChange({ price: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="99.90"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duração (meses) *</label>
            <input
              type="number"
              value={formData.duration_months}
              onChange={(e) => onFormDataChange({ duration_months: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="Descrição do plano..."
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Features (uma por linha) *</label>
          <textarea
            value={formData.features}
            onChange={(e) => onFormDataChange({ features: e.target.value })}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="Agendamentos ilimitados&#10;Gestão de pacientes&#10;Relatórios financeiros"
            rows={5}
            required
          />
        </div>

        {/* Trial Configuration */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-blue-400 mb-3">Período de Trial</h5>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="has_trial"
              checked={formData.has_trial}
              onChange={(e) => onFormDataChange({ has_trial: e.target.checked })}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="has_trial" className="text-gray-300 font-medium">
              Este plano tem período de trial gratuito
            </label>
          </div>

          {formData.has_trial && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dias de Trial Gratuito *</label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.trial_days}
                onChange={(e) => onFormDataChange({ trial_days: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="7"
                required={formData.has_trial}
              />
              <p className="text-xs text-gray-500 mt-1">
                Primeira cobrança ocorrerá após {formData.trial_days || 0} dias
              </p>
            </div>
          )}
        </div>

        {/* Billing Configuration */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-purple-400 mb-3">Configuração de Cobrança</h5>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dia de Cobrança (opcional)</label>
            <input
              type="number"
              min="1"
              max="28"
              value={formData.billing_day}
              onChange={(e) => onFormDataChange({ billing_day: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Deixe vazio para cobrar 30 dias após assinatura"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.billing_day
                ? `Cobrança no dia ${formData.billing_day} de cada mês`
                : 'Cobrança 30 dias após a data de assinatura (ou após trial)'}
            </p>
          </div>
        </div>

        {/* Retry Configuration */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-orange-400 mb-3">Reprocessamento de Pagamentos Falhados</h5>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="retry_failed_payments"
              checked={formData.retry_failed_payments}
              onChange={(e) => onFormDataChange({ retry_failed_payments: e.target.checked })}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="retry_failed_payments" className="text-gray-300 font-medium">
              Tentar reprocessar pagamentos falhados automaticamente
            </label>
          </div>

          {formData.retry_failed_payments && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Máximo de Tentativas *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_retry_attempts}
                  onChange={(e) => onFormDataChange({ max_retry_attempts: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="3"
                  required={formData.retry_failed_payments}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Intervalo entre Tentativas (dias) *</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.retry_interval_days}
                  onChange={(e) => onFormDataChange({ retry_interval_days: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="3"
                  required={formData.retry_failed_payments}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-3">
            {formData.retry_failed_payments
              ? `Sistema tentará ${formData.max_retry_attempts}x a cada ${formData.retry_interval_days} dias. Após todas as tentativas falharem, a assinatura será cancelada.`
              : 'Assinatura será cancelada imediatamente após primeira falha de pagamento.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
          >
            <Save className="w-5 h-5" />
            <span>Salvar</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
            <span>Cancelar</span>
          </button>
        </div>
      </form>
    </div>
  )
}
