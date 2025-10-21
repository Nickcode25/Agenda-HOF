import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  procedure: string
  start: string
  professional: string
  room?: string
}

interface Patient {
  id: string
  name: string
  phone?: string
}

interface TwilioSettings {
  account_sid: string
  auth_token: string
  whatsapp_from: string
  enabled: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service role (acesso total)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Buscar todos os agendamentos para amanhã (considerando todos os usuários)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('start', tomorrow.toISOString())
      .lt('start', dayAfterTomorrow.toISOString())
      .in('status', ['scheduled', 'confirmed'])

    if (appointmentsError) {
      throw appointmentsError
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum agendamento para amanhã' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Encontrados ${appointments.length} agendamentos para amanhã`)

    const results = []

    // Processar cada agendamento
    for (const appointment of appointments) {
      try {
        // Buscar dados do paciente
        const { data: patient, error: patientError } = await supabaseAdmin
          .from('patients')
          .select('id, name, phone')
          .eq('id', appointment.patientId)
          .single()

        if (patientError || !patient) {
          console.log(`Paciente não encontrado: ${appointment.patientId}`)
          results.push({
            appointmentId: appointment.id,
            status: 'error',
            error: 'Paciente não encontrado',
          })
          continue
        }

        // Verificar se paciente tem telefone
        if (!patient.phone) {
          console.log(`Paciente ${patient.name} não tem telefone cadastrado`)
          results.push({
            appointmentId: appointment.id,
            patientName: patient.name,
            status: 'skipped',
            reason: 'Telefone não cadastrado',
          })
          continue
        }

        // Buscar configurações do Twilio do usuário (dono do agendamento)
        const { data: twilioSettings, error: twilioError } = await supabaseAdmin
          .from('twilio_settings')
          .select('*')
          .eq('user_id', appointment.user_id)
          .eq('enabled', true)
          .single()

        if (twilioError || !twilioSettings) {
          console.log(`Configurações Twilio não encontradas para usuário: ${appointment.user_id}`)
          results.push({
            appointmentId: appointment.id,
            patientName: patient.name,
            status: 'skipped',
            reason: 'Twilio não configurado',
          })
          continue
        }

        // Verificar se já foi enviada notificação para este agendamento
        const { data: existingNotification } = await supabaseAdmin
          .from('whatsapp_notifications')
          .select('id, message_sent')
          .eq('appointment_id', appointment.id)
          .eq('patient_id', patient.id)
          .single()

        if (existingNotification?.message_sent) {
          console.log(`Notificação já enviada para agendamento: ${appointment.id}`)
          results.push({
            appointmentId: appointment.id,
            patientName: patient.name,
            status: 'skipped',
            reason: 'Já foi enviada',
          })
          continue
        }

        // Formatar telefone para WhatsApp (remover caracteres especiais e adicionar código do país)
        let phoneNumber = patient.phone.replace(/\D/g, '')
        if (!phoneNumber.startsWith('55')) {
          phoneNumber = '55' + phoneNumber // Adiciona código do Brasil
        }
        const whatsappTo = `whatsapp:+${phoneNumber}`

        // Formatar data e hora do agendamento
        const appointmentDate = new Date(appointment.start)
        const dateFormatted = appointmentDate.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
        const timeFormatted = appointmentDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        // Montar mensagem
        const message = `
🏥 *Lembrete de Consulta - Agenda HOF*

Olá ${patient.name}! 👋

Este é um lembrete do seu agendamento para amanhã:

📅 *Data:* ${dateFormatted}
⏰ *Horário:* ${timeFormatted}
💉 *Procedimento:* ${appointment.procedure}
👨‍⚕️ *Profissional:* ${appointment.professional}
${appointment.room ? `🚪 *Sala:* ${appointment.room}` : ''}

⚠️ Por favor, chegue com 10 minutos de antecedência.

Em caso de necessidade de reagendamento, entre em contato o quanto antes.

Aguardamos você! 😊
        `.trim()

        // Enviar mensagem via Twilio
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSettings.account_sid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization:
                'Basic ' +
                btoa(`${twilioSettings.account_sid}:${twilioSettings.auth_token}`),
            },
            body: new URLSearchParams({
              From: twilioSettings.whatsapp_from,
              To: whatsappTo,
              Body: message,
            }),
          }
        )

        const twilioData = await twilioResponse.json()

        if (!twilioResponse.ok) {
          throw new Error(twilioData.message || 'Erro ao enviar mensagem')
        }

        // Registrar notificação no banco
        const notificationData = {
          user_id: appointment.user_id,
          appointment_id: appointment.id,
          patient_id: patient.id,
          patient_name: patient.name,
          patient_phone: patient.phone,
          appointment_date: appointment.start,
          message_sent: true,
          sent_at: new Date().toISOString(),
          twilio_message_sid: twilioData.sid,
        }

        if (existingNotification) {
          // Atualizar registro existente
          await supabaseAdmin
            .from('whatsapp_notifications')
            .update(notificationData)
            .eq('id', existingNotification.id)
        } else {
          // Criar novo registro
          await supabaseAdmin
            .from('whatsapp_notifications')
            .insert(notificationData)
        }

        console.log(`Mensagem enviada com sucesso para ${patient.name}: ${twilioData.sid}`)

        results.push({
          appointmentId: appointment.id,
          patientName: patient.name,
          phone: whatsappTo,
          status: 'sent',
          messageSid: twilioData.sid,
        })
      } catch (error) {
        console.error(`Erro ao processar agendamento ${appointment.id}:`, error)

        // Registrar erro no banco
        await supabaseAdmin.from('whatsapp_notifications').insert({
          user_id: appointment.user_id,
          appointment_id: appointment.id,
          patient_id: appointment.patientId,
          patient_name: appointment.patientName,
          patient_phone: '',
          appointment_date: appointment.start,
          message_sent: false,
          error_message: error.message,
        })

        results.push({
          appointmentId: appointment.id,
          status: 'error',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Processamento concluído',
        total: appointments.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
