import { useRef } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

interface FileInputProps {
  accept?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  previewUrl?: string
  label?: string
  buttonText?: string
  disabled?: boolean
}

export default function FileInput({
  accept = 'image/*',
  onChange,
  previewUrl,
  label = 'Escolher arquivo',
  buttonText = 'Selecionar Foto',
  disabled = false
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Custom button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 hover:border-gray-500"
      >
        <Upload size={18} />
        {buttonText}
      </button>

      {/* Preview */}
      {previewUrl && (
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Prévia"
              className="h-24 w-24 object-cover rounded-xl border-2 border-gray-600 group-hover:border-orange-500 transition-all"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <ImageIcon size={24} className="text-white" />
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <p className="font-medium text-white">Imagem selecionada</p>
            <p>Clique para alterar</p>
          </div>
        </div>
      )}
    </div>
  )
}
