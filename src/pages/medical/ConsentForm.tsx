import { useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Save, FileSignature, AlertTriangle } from 'lucide-react'

const CONSENT_TEMPLATES = {
  botox: {
    name: 'Toxina Botulínica (Botox)',
    text: `CONSENTIMENTO INFORMADO PARA APLICAÇÃO DE TOXINA BOTULÍNICA

Eu, paciente abaixo identificado, declaro estar ciente e concordar com os seguintes termos:

1. SOBRE O PROCEDIMENTO
A toxina botulínica é uma proteína purificada que, quando injetada, promove o relaxamento muscular temporário, reduzindo linhas de expressão e rugas dinâmicas.

2. INDICAÇÕES
- Suavização de rugas de expressão (testa, glabela, pés de galinha)
- Tratamento de hiperidrose (suor excessivo)
- Harmonização facial

3. RESULTADOS ESPERADOS
Os resultados começam a aparecer em 3-7 dias, com efeito máximo em 14 dias. A duração média é de 4-6 meses.

4. POSSÍVEIS EFEITOS ADVERSOS
- Hematomas e edema no local da aplicação
- Cefaleia temporária
- Assimetria facial temporária
- Ptose palpebral (queda da pálpebra) - raro
- Fraqueza muscular temporária

5. CONTRAINDICAÇÕES
- Gravidez e amamentação
- Alergia à toxina botulínica ou albumina
- Doenças neuromusculares (miastenia gravis)
- Infecção no local da aplicação
- Uso de anticoagulantes (avaliar risco-benefício)

6. CUIDADOS PÓS-PROCEDIMENTO
- Não deitar por 4 horas após aplicação
- Evitar exercícios físicos intensos por 24h
- Não massagear a área tratada
- Evitar exposição solar intensa
- Retorno em 14 dias para avaliação

7. DECLARAÇÃO
Declaro que fui devidamente informado(a) sobre os riscos e benefícios do procedimento, tive oportunidade de esclarecer minhas dúvidas e autorizo a realização do tratamento.`,
    risks: 'Hematomas, edema, cefaleia, assimetria temporária, ptose palpebral (raro), fraqueza muscular temporária'
  },
  preenchimento: {
    name: 'Preenchimento com Ácido Hialurônico',
    text: `CONSENTIMENTO INFORMADO PARA PREENCHIMENTO COM ÁCIDO HIALURÔNICO

Eu, paciente abaixo identificado, declaro estar ciente e concordar com os seguintes termos:

1. SOBRE O PROCEDIMENTO
O ácido hialurônico é uma substância biocompatível que, quando injetada, promove preenchimento de sulcos, rugas e aumento de volume em regiões faciais.

2. INDICAÇÕES
- Preenchimento de sulcos e rugas estáticas
- Aumento de volume labial
- Contorno facial (maçãs, mandíbula, mento)
- Harmonização do nariz (rinomodelação)
- Olheiras

3. RESULTADOS ESPERADOS
Resultados imediatos, com duração média de 12-18 meses, dependendo da área tratada e do produto utilizado.

4. POSSÍVEIS EFEITOS ADVERSOS
- Edema e hematomas (comum nos primeiros 3-7 dias)
- Assimetria (pode requerer retoque)
- Nódulos palpáveis
- Efeito Tyndall (coloração azulada)
- Necrose cutânea (raro, mas grave)
- Reação de hipersensibilidade (raro)
- Granulomas (muito raro)

5. CONTRAINDICAÇÕES
- Gravidez e amamentação
- Alergia ao ácido hialurônico
- Infecção ou lesão ativa no local
- Doenças autoimunes ativas
- Uso de anticoagulantes (avaliar)

6. CUIDADOS PÓS-PROCEDIMENTO
- Aplicar gelo nas primeiras 24h
- Evitar calor intenso por 1 semana
- Não massagear a área (exceto se orientado)
- Evitar exercícios físicos por 24-48h
- Dormir com a cabeça elevada por 3 noites
- Retorno em 14 dias para avaliação

7. DECLARAÇÃO
Declaro que fui devidamente informado(a) sobre os riscos e benefícios do procedimento, incluindo o risco raro mas grave de necrose cutânea, e autorizo a realização do tratamento.`,
    risks: 'Edema, hematomas, assimetria, nódulos, efeito Tyndall, necrose cutânea (raro), reação de hipersensibilidade, granulomas'
  },
  bioestimulador: {
    name: 'Bioestimulador de Colágeno (Sculptra/Radiesse)',
    text: `CONSENTIMENTO INFORMADO PARA BIOESTIMULADOR DE COLÁGENO

Eu, paciente abaixo identificado, declaro estar ciente e concordar com os seguintes termos:

1. SOBRE O PROCEDIMENTO
Bioestimuladores são substâncias que estimulam a produção natural de colágeno pela pele, promovendo rejuvenescimento e sustentação facial progressiva.

2. INDICAÇÕES
- Flacidez facial
- Perda de volume e contorno facial
- Rugas e linhas profundas
- Rejuvenescimento da pele das mãos
- Melhora da qualidade da pele

3. RESULTADOS ESPERADOS
Resultados progressivos, com melhora visível após 4-8 semanas. Geralmente são necessárias 2-3 sessões. Duração de 18-24 meses ou mais.

4. POSSÍVEIS EFEITOS ADVERSOS
- Edema e hematomas por 3-7 dias
- Nódulos palpáveis ou visíveis (pode ocorrer meses após)
- Assimetria
- Reação granulomatosa (raro)
- Hipercorreção (raro)

5. CONTRAINDICAÇÕES
- Gravidez e amamentação
- Alergia aos componentes
- Infecção ativa no local
- Doenças autoimunes ativas
- Queloides ou cicatrizes hipertróficas

6. CUIDADOS PÓS-PROCEDIMENTO
- Massagear a área conforme orientação (5-5-5)
- Aplicar gelo nas primeiras 24h
- Evitar exposição solar por 1 semana
- Evitar exercícios intensos por 24-48h
- Hidratação oral adequada
- Retornos conforme protocolo

7. DECLARAÇÃO
Declaro que fui informado(a) que os resultados são progressivos, que posso necessitar de múltiplas sessões, e que existe risco de formação de nódulos. Autorizo a realização do tratamento.`,
    risks: 'Edema, hematomas, nódulos (palpáveis ou visíveis), assimetria, reação granulomatosa (raro), hipercorreção'
  },
  peeling: {
    name: 'Peeling Químico',
    text: `CONSENTIMENTO INFORMADO PARA PEELING QUÍMICO

Eu, paciente abaixo identificado, declaro estar ciente e concordar com os seguintes termos:

1. SOBRE O PROCEDIMENTO
O peeling químico é um procedimento que utiliza substâncias químicas para promover esfoliação controlada da pele, melhorando textura, manchas e sinais de envelhecimento.

2. INDICAÇÕES
- Manchas e melasma
- Acne e marcas de acne
- Textura irregular da pele
- Rugas finas
- Renovação celular

3. RESULTADOS ESPERADOS
Melhora da textura, uniformização do tom, redução de manchas e luminosidade. Podem ser necessárias múltiplas sessões.

4. POSSÍVEIS EFEITOS ADVERSOS
- Vermelhidão e descamação (esperado)
- Hiperpigmentação pós-inflamatória
- Hipopigmentação
- Infecção (raro)
- Cicatrizes (muito raro)

5. CONTRAINDICAÇÕES
- Gravidez e amamentação
- Uso de isotretinoína nos últimos 6 meses
- Infecção ativa (herpes, acne grave)
- Fotossensibilidade
- Queloides

6. CUIDADOS PÓS-PROCEDIMENTO
- Uso obrigatório de protetor solar FPS 50+
- Hidratação intensiva da pele
- Não retirar a descamação manualmente
- Evitar exposição solar por 30 dias
- Não usar ácidos ou produtos irritantes
- Retorno conforme protocolo

7. DECLARAÇÃO
Declaro que fui informado(a) sobre a importância da fotoproteção rigorosa e os riscos de manchas. Autorizo a realização do tratamento.`,
    risks: 'Vermelhidão, descamação, hiperpigmentação pós-inflamatória, hipopigmentação, infecção (raro), cicatrizes (raro)'
  }
}

export default function ConsentForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { createInformedConsent } = useMedicalRecords()

  const patient = patients.find(p => p.id === id)

  const [procedureType, setProcedureType] = useState<keyof typeof CONSENT_TEMPLATES>('botox')
  const [procedureName, setProcedureName] = useState('')
  const [consentText, setConsentText] = useState(CONSENT_TEMPLATES.botox.text)
  const [risksExplained, setRisksExplained] = useState(CONSENT_TEMPLATES.botox.risks)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTemplateChange = (type: keyof typeof CONSENT_TEMPLATES) => {
    setProcedureType(type)
    const template = CONSENT_TEMPLATES[type]
    setProcedureName(template.name)
    setConsentText(template.text)
    setRisksExplained(template.risks)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !accepted) {
      alert('⚠️ Você precisa aceitar os termos para continuar.')
      return
    }

    setSaving(true)
    try {
      await createInformedConsent(id, {
        procedure_name: procedureName || CONSENT_TEMPLATES[procedureType].name,
        consent_text: consentText,
        risks_explained: risksExplained,
        status: 'pending',
      })

      alert('✅ Consentimento criado! O paciente deverá assinar.')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      alert('❌ Erro ao criar consentimento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Paciente não encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/app/pacientes/${id}/prontuario`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileSignature className="text-orange-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Novo Consentimento Informado</h1>
          </div>
          <p className="text-gray-400 mt-1">{patient.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selecionar Template */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Selecione o Tipo de Procedimento</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template de Consentimento *
              </label>
              <select
                value={procedureType}
                onChange={(e) => handleTemplateChange(e.target.value as keyof typeof CONSENT_TEMPLATES)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="botox">Toxina Botulínica (Botox)</option>
                <option value="preenchimento">Preenchimento (Ácido Hialurônico)</option>
                <option value="bioestimulador">Bioestimulador de Colágeno</option>
                <option value="peeling">Peeling Químico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Procedimento
              </label>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                placeholder="Ex: Toxina Botulínica em Glabela"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Texto do Consentimento */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Termo de Consentimento</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Texto Completo do Consentimento
            </label>
            <textarea
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              rows={20}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Riscos e Efeitos Adversos Explicados
            </label>
            <textarea
              value={risksExplained}
              onChange={(e) => setRisksExplained(e.target.value)}
              rows={3}
              placeholder="Resumo dos principais riscos explicados ao paciente..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">Importante</h3>
              <p className="text-gray-300 text-sm">
                Este consentimento será registrado como <strong>PENDENTE</strong>. O paciente deverá ler, compreender
                e assinar digitalmente o termo antes da realização do procedimento. Certifique-se de que todos os
                riscos foram devidamente explicados e que o paciente teve oportunidade de esclarecer suas dúvidas.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmação */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="accepted"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-2 focus:ring-orange-500/20 mt-0.5"
            />
            <label htmlFor="accepted" className="text-white cursor-pointer">
              <span className="font-medium">Confirmo que</span> expliquei detalhadamente ao paciente sobre o procedimento,
              riscos, benefícios, alternativas e cuidados pós-procedimento. O paciente teve oportunidade de esclarecer
              todas as suas dúvidas.
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to={`/app/pacientes/${id}/prontuario`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !accepted}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Criar Consentimento'}
          </button>
        </div>
      </form>
    </div>
  )
}
