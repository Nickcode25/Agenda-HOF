interface LifestyleSectionProps {
  smoking: boolean
  alcoholConsumption: boolean
  sunExposure: string
  loading: boolean
  onSmokingChange: (value: boolean) => void
  onAlcoholConsumptionChange: (value: boolean) => void
  onSunExposureChange: (value: string) => void
}

export default function LifestyleSection({
  smoking,
  alcoholConsumption,
  sunExposure,
  loading,
  onSmokingChange,
  onAlcoholConsumptionChange,
  onSunExposureChange
}: LifestyleSectionProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">6</span>
        Hábitos e Estilo de Vida
      </h2>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smoking"
              checked={smoking}
              onChange={(e) => onSmokingChange(e.target.checked)}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2 text-orange-500"
              disabled={loading}
            />
            <label htmlFor="smoking" className="text-sm font-medium text-gray-300 cursor-pointer">
              Fumante
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="alcohol"
              checked={alcoholConsumption}
              onChange={(e) => onAlcoholConsumptionChange(e.target.checked)}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2 text-orange-500"
              disabled={loading}
            />
            <label htmlFor="alcohol" className="text-sm font-medium text-gray-300 cursor-pointer">
              Consome Álcool
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Exposição Solar</label>
          <select
            value={sunExposure}
            onChange={(e) => onSunExposureChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            disabled={loading}
          >
            <option value="frequente">Frequente (diariamente)</option>
            <option value="moderada">Moderada (às vezes)</option>
            <option value="minima">Mínima (raramente)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
