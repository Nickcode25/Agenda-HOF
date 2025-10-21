import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Save, Eye, EyeOff, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface TwilioConfig {
  account_sid: string
  auth_token: string
  whatsapp_from: string
  enabled: boolean
}

export default function TwilioSettings() {
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAuthToken, setShowAuthToken] = useState(false)
  const [config, setConfig] = useState<TwilioConfig>({
    account_sid: '',
    auth_token: '',
    whatsapp_from: '',
    enabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('twilio_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      showToast('Erro ao carregar configurações', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from('twilio_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const settingsData = {
        user_id: user.id,
        account_sid: config.account_sid,
        auth_token: config.auth_token,
        whatsapp_from: config.whatsapp_from,
        enabled: config.enabled,
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('twilio_settings')
          .update(settingsData)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Inserir
        const { error } = await supabase
          .from('twilio_settings')
          .insert(settingsData)

        if (error) throw error
      }

      showToast('Configurações salvas com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast('Erro ao salvar configurações', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function testWhatsApp() {
    if (!config.account_sid || !config.auth_token || !config.whatsapp_from) {
      showToast('Preencha todas as configurações antes de testar', 'warning')
      return
    }

    showToast('Teste de envio não implementado nesta versão', 'info')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <MessageSquare size={32} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Configurações WhatsApp</h1>
              <p className="text-gray-400">Configure o Twilio para enviar lembretes automáticos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex gap-3">
          <AlertCircle size={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-blue-100">
            <p className="font-medium">Como configurar:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-200">
              <li>Crie uma conta no <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">Twilio <ExternalLink size={12} /></a></li>
              <li>Ative o WhatsApp Business no Twilio Console</li>
              <li>Copie seu Account SID e Auth Token</li>
              <li>Cole as informações abaixo</li>
              <li>Lembretes serão enviados automaticamente 1 dia antes às 07h</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-6">
        {/* Account SID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account SID *
          </label>
          <input
            type="text"
            value={config.account_sid}
            onChange={(e) => setConfig({ ...config, account_sid: e.target.value })}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            required
            className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Encontre em: Twilio Console → Account Info
          </p>
        </div>

        {/* Auth Token */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Auth Token *
          </label>
          <div className="relative">
            <input
              type={showAuthToken ? 'text' : 'password'}
              value={config.auth_token}
              onChange={(e) => setConfig({ ...config, auth_token: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowAuthToken(!showAuthToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showAuthToken ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Encontre em: Twilio Console → Account Info → Auth Token
          </p>
        </div>

        {/* WhatsApp From */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Número WhatsApp (From) *
          </label>
          <input
            type="text"
            value={config.whatsapp_from}
            onChange={(e) => setConfig({ ...config, whatsapp_from: e.target.value })}
            placeholder="whatsapp:+14155238886"
            required
            className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Formato: whatsapp:+[código do país][número]
          </p>
        </div>

        {/* Enabled */}
        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div>
            <p className="font-medium text-white">Envio automático ativo</p>
            <p className="text-sm text-gray-400">Lembretes serão enviados diariamente às 07h</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      {/* Success/Info Messages */}
      {config.account_sid && config.auth_token && config.whatsapp_from && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex gap-3">
            <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
            <div className="text-sm text-green-100">
              <p className="font-medium mb-1">Configuração completa!</p>
              <p className="text-green-200">
                Os lembretes automáticos via WhatsApp estão {config.enabled ? 'ativos' : 'desativados'}.
                As mensagens serão enviadas automaticamente 1 dia antes de cada agendamento, às 07h da manhã.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
