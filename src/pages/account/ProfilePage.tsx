import { useState, useEffect, useRef } from 'react'
import {
  UserCircle,
  Camera,
  MapPin,
  Phone,
  Save,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import { useUserProfile } from '@/store/userProfile'
import { useAuth } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import type { UserAddress, UserPhone } from '@/types/user'

// Lista de estados brasileiros
const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

interface FormData {
  // Personal info
  profilePhoto: string
  socialName: string
  fullName: string
  email: string
  username: string
  // Address
  address: UserAddress
  // Phone
  phone: UserPhone
}

const defaultAddress: UserAddress = {
  country: 'Brasil',
  zipCode: '',
  state: '',
  city: '',
  neighborhood: '',
  street: '',
  number: '',
  complement: ''
}

const defaultPhone: UserPhone = {
  countryCode: '+55',
  areaCode: '',
  number: ''
}

export default function ProfilePage() {
  const { currentProfile, fetchCurrentProfile } = useUserProfile()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    profilePhoto: '',
    socialName: '',
    fullName: '',
    email: '',
    username: '',
    address: { ...defaultAddress },
    phone: { ...defaultPhone }
  })
  const [fetchingCep, setFetchingCep] = useState(false)

  // Carregar dados do perfil
  useEffect(() => {
    loadProfileData()
  }, [currentProfile])

  const loadProfileData = async () => {
    try {
      setLoading(true)

      if (currentProfile) {
        setFormData({
          profilePhoto: currentProfile.profilePhoto || '',
          socialName: currentProfile.socialName || currentProfile.displayName || '',
          fullName: currentProfile.fullName || '',
          email: currentProfile.email || user?.email || '',
          username: currentProfile.username || '',
          address: currentProfile.address || { ...defaultAddress },
          phone: currentProfile.phone || { ...defaultPhone }
        })
      } else if (user) {
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  const handleAddressChange = (field: keyof UserAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }))
    setSaveSuccess(false)
  }

  const handlePhoneChange = (phoneType: 'phone', field: keyof UserPhone, value: string) => {
    setFormData(prev => ({
      ...prev,
      [phoneType]: {
        countryCode: prev[phoneType]?.countryCode || '+55',
        areaCode: prev[phoneType]?.areaCode || '',
        number: prev[phoneType]?.number || '',
        [field]: value
      }
    }))
    setSaveSuccess(false)
  }

  // Buscar endereço pelo CEP automaticamente
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    try {
      setFetchingCep(true)
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }
        }))
      }
    } catch {
      // CEP não encontrado ou erro de rede
    } finally {
      setFetchingCep(false)
    }
  }

  // Handler para mudança de CEP
  const handleCepChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    handleAddressChange('zipCode', cleanValue)

    // Buscar automaticamente quando o CEP tiver 8 dígitos
    if (cleanValue.length === 8) {
      fetchAddressByCep(cleanValue)
    }
  }

  // Upload de foto
  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Verificar tamanho do arquivo (máximo 2MB para base64)
    if (file.size > 2 * 1024 * 1024) {
      setError('A foto deve ter no máximo 2MB')
      return
    }

    try {
      setUploadingPhoto(true)
      setError(null)

      // Converter para base64 diretamente (mais confiável)
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setFormData(prev => ({ ...prev, profilePhoto: base64 }))
        setSaveSuccess(false)
        setUploadingPhoto(false)
      }
      reader.onerror = () => {
        setError('Erro ao processar a foto. Tente novamente.')
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Erro ao fazer upload da foto')
      setUploadingPhoto(false)
    }
  }

  // Salvar perfil
  const handleSave = async () => {
    if (!currentProfile) return

    try {
      setSaving(true)
      setError(null)

      const updateData = {
        display_name: formData.socialName || formData.fullName,
        profile_photo: formData.profilePhoto,
        social_name: formData.socialName,
        full_name: formData.fullName,
        username: formData.username,
        address: formData.address,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', currentProfile.id)

      if (updateError) throw updateError

      // Recarregar perfil
      await fetchCurrentProfile()
      setSaveSuccess(true)

      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserCircle className="w-6 h-6 text-orange-600" />
              </div>
              Meu Perfil
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie suas informações pessoais
            </p>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar
              </>
            )}
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Seção: Informações Pessoais */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <UserCircle className="w-5 h-5 text-orange-500" />
            </div>
            Informações Pessoais
          </h2>

          <div className="grid md:grid-cols-[auto_1fr] gap-8">
            {/* Foto do perfil */}
            <div className="flex flex-col items-center">
              <div
                onClick={handlePhotoClick}
                className="relative w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-orange-400 cursor-pointer transition-colors overflow-hidden group"
              >
                {formData.profilePhoto ? (
                  <img
                    src={formData.profilePhoto}
                    alt="Foto do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">Clique para alterar</p>
            </div>

            {/* Campos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.socialName}
                  onChange={(e) => handleInputChange('socialName', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome de usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Como você quer aparecer no sistema"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            Endereço
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                País
              </label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatCep(formData.address.zipCode)}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                {fetchingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estado
              </label>
              <select
                value={formData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="Sua cidade"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bairro
              </label>
              <input
                type="text"
                value={formData.address.neighborhood}
                onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                placeholder="Seu bairro"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="md:col-span-3 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rua
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Nome da rua"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.address.number}
                  onChange={(e) => handleAddressChange('number', e.target.value)}
                  placeholder="Nº"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Complemento
              </label>
              <input
                type="text"
                value={formData.address.complement || ''}
                onChange={(e) => handleAddressChange('complement', e.target.value)}
                placeholder="Apartamento, sala, etc. (opcional)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Seção: Telefone */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            Telefone
          </h2>

          <div className="grid grid-cols-[100px_80px_1fr] gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">País</label>
              <input
                type="text"
                value={formData.phone?.countryCode || '+55'}
                onChange={(e) => handlePhoneChange('phone', 'countryCode', e.target.value)}
                placeholder="+55"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">DDD</label>
              <input
                type="text"
                value={formData.phone?.areaCode || ''}
                onChange={(e) => handlePhoneChange('phone', 'areaCode', e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="11"
                maxLength={2}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input
                type="text"
                value={formatPhone(formData.phone?.number || '')}
                onChange={(e) => handlePhoneChange('phone', 'number', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="99999-9999"
                maxLength={10}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar (mobile) */}
        <div className="md:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
