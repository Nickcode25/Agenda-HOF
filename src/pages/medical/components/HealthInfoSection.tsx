interface HealthInfoSectionProps {
  healthConditions: string
  medications: string
  allergies: string
  familyHistory: string
  pregnancy: string
  loading: boolean
  onHealthConditionsChange: (value: string) => void
  onMedicationsChange: (value: string) => void
  onAllergiesChange: (value: string) => void
  onFamilyHistoryChange: (value: string) => void
  onPregnancyChange: (value: string) => void
}

export default function HealthInfoSection({
  healthConditions,
  medications,
  allergies,
  familyHistory,
  pregnancy,
  loading,
  onHealthConditionsChange,
  onMedicationsChange,
  onAllergiesChange,
  onFamilyHistoryChange,
  onPregnancyChange
}: HealthInfoSectionProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">4</span>
        Informações de Saúde
      </h2>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Condições de Saúde Relevantes
            </label>
            <textarea
              value={healthConditions}
              onChange={(e) => onHealthConditionsChange(e.target.value)}
              rows={3}
              placeholder="Ex: Diabetes, hipertensão, problemas de coagulação, herpes labial..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Medicamentos em Uso
            </label>
            <textarea
              value={medications}
              onChange={(e) => onMedicationsChange(e.target.value)}
              rows={3}
              placeholder="Liste medicamentos contínuos, suplementos, anticoagulantes..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Alergias</label>
            <textarea
              value={allergies}
              onChange={(e) => onAllergiesChange(e.target.value)}
              rows={2}
              placeholder="Alergias a medicamentos, produtos, substâncias..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Histórico Familiar</label>
            <textarea
              value={familyHistory}
              onChange={(e) => onFamilyHistoryChange(e.target.value)}
              rows={2}
              placeholder="Doenças relevantes na família..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gestação ou Amamentação
          </label>
          <select
            value={pregnancy}
            onChange={(e) => onPregnancyChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            disabled={loading}
          >
            <option value="nao">Não</option>
            <option value="gravida">Grávida</option>
            <option value="amamentando">Amamentando</option>
            <option value="planejando">Planejando gravidez</option>
          </select>
        </div>
      </div>
    </div>
  )
}
