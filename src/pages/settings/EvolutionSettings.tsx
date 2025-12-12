import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Save, AlertCircle, CheckCircle, ExternalLink, QrCode, Smartphone, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import PageLoading from '@/components/ui/PageLoading'
import { createISOFromDateTimeBR, getTodayInSaoPaulo, getCurrentTimeInSaoPaulo } from '@/utils/timezone'

interface EvolutionConfig {
  api_url: string
  api_key: string
  instance_name: string
  enabled: boolean
}

export default function EvolutionSettings() {
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [config, setConfig] = useState<EvolutionConfig>({
    api_url: 'http://localhost:8080',
    api_key: '',
    instance_name: 'agendahof',
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
        .from('evolution_settings')
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
        .from('evolution_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const settingsData = {
        user_id: user.id,
        api_url: config.api_url,
        api_key: config.api_key,
        instance_name: config.instance_name,
        enabled: config.enabled,
        updated_at: createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo()),
      }

      if (existing) {
        const { error } = await supabase
          .from('evolution_settings')
          .update(settingsData)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('evolution_settings')
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

  if (loading) {
    return <PageLoading message="Carregando configurações..." />
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
              <h1 className="text-3xl font-bold text-white">WhatsApp - Evolution API</h1>
              <p className="text-gray-400">Configure lembretes automáticos com seu próprio número</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box - Vantagens */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
        <div className="flex gap-3">
          <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-green-100">
            <p className="font-medium">Vantagens da Evolution API:</p>
            <ul className="list-disc list-inside space-y-1 text-green-200">
              <li>✅ 100% Gratuito - sem custos por mensagem</li>
              <li>✅ Usa seu próprio número WhatsApp (+55 31 99723-5435)</li>
              <li>✅ Solução open-source brasileira</li>
              <li>✅ Mais estável que Baileys</li>
              <li>✅ Mensagens ilimitadas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box - Como configurar */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex gap-3">
          <AlertCircle size={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-blue-100">
            <p className="font-medium">Como configurar (passos rápidos):</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-200">
              <li>Inicie a Evolution API localmente (veja EVOLUTION_SETUP.md)</li>
              <li>Execute: <code className="bg-blue-900/30 px-2 py-0.5 rounded">cd evolution-api && ./start.sh</code></li>
              <li>Acesse: <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">http://localhost:8080 <ExternalLink size={12} /></a></li>
              <li>Copie sua API Key e nome da instância</li>
              <li>Conecte seu WhatsApp escaneando o QR Code</li>
              <li>Preencha os campos abaixo e salve</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-6">
        {/* API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL da Evolution API *
          </label>
          <input
            type="text"
            value={config.api_url}
            onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
            placeholder="http://localhost:8080"
            required
            className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            URL onde a Evolution API está rodando (local ou servidor)
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key *
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Digite sua API Key"
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Definida no arquivo docker-compose.yml (AUTHENTICATION_API_KEY)
          </p>
        </div>

        {/* Instance Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome da Instância *
          </label>
          <input
            type="text"
            value={config.instance_name}
            onChange={(e) => setConfig({ ...config, instance_name: e.target.value })}
            placeholder="agendahof"
            required
            className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nome usado ao criar a instância na Evolution API
          </p>
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div>
            <p className="font-medium text-white">Envio automático ativo</p>
            <p className="text-sm text-gray-400">Lembretes serão enviados diariamente às 07h do seu WhatsApp</p>
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

        {/* Button */}
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

      {/* Success Message */}
      {config.api_url && config.api_key && config.instance_name && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex gap-3">
            <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
            <div className="text-sm text-green-100">
              <p className="font-medium mb-1">Configuração completa! ✅</p>
              <p className="text-green-200">
                Os lembretes automáticos estão {config.enabled ? 'ativos' : 'desativados'}.
                As mensagens serão enviadas do seu WhatsApp (+55 31 99723-5435) automaticamente
                1 dia antes de cada agendamento, às 07h da manhã.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href="http://localhost:8080"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/50 border border-gray-700/50 rounded-xl hover:border-green-500/50 transition-all group"
        >
          <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
            <QrCode size={24} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Acessar Evolution API</p>
            <p className="text-xs text-gray-400">Gerenciar instâncias e conexões</p>
          </div>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-green-400 transition-colors" />
        </a>

        <a
          href="/EVOLUTION_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/50 border border-gray-700/50 rounded-xl hover:border-blue-500/50 transition-all group"
        >
          <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
            <Smartphone size={24} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Documentação Completa</p>
            <p className="text-xs text-gray-400">Guia de instalação e configuração</p>
          </div>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
        </a>
      </div>
    </div>
  )
}
