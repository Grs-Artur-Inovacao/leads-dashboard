
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the type for the request body
interface RegisterLeadRequest {
    firstName: string
    lastName: string
    phone: string
    company: string
    cnpj: string
    interest: string
    businessUnit: string
    segment?: string
    leadSource?: string
    subOrigin?: string
    email: string // Email of the user performing the action (SDR)
}


Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // User data from the request
        const body = await req.json() as RegisterLeadRequest
        console.log('--- NOVO PEDIDO DE REGISTRO (TESTE) ---')
        console.log('Dados recebidos:', JSON.stringify(body, null, 2))

        const {
            firstName,
            lastName,
            phone,
            company,
            cnpj,
            interest,
            businessUnit,
            segment,
            leadSource: reqLeadSource,
            subOrigin: reqSubOrigin,
            email
        } = body

        // Default values if missing
        if (!firstName || !lastName || !phone) {
            console.error('ERRO: Campos obrigatórios ausentes:', { firstName, lastName, phone })
            throw new Error('Campos obrigatórios: Nome, Sobrenome e Telefone.')
        }

        // 1. Enrich Lead Data
        console.log(`Buscando histórico para o telefone: ${phone}`)
        const normalizedPhone = phone.replace(/\D/g, '')


        const { data: campaignData } = await supabaseClient
            .from('campaign_log')
            .select('*')
            .ilike('phone', `%${normalizedPhone}%`)
            .limit(1)
            .single()

        // 2. Validate Salesforce Connection (Login only, no lead creation)
        const sfClientId = Deno.env.get('SALESFORCE_CLIENT_ID')
        const sfClientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET')
        const sfUsername = Deno.env.get('SALESFORCE_USERNAME')
        const sfPassword = Deno.env.get('SALESFORCE_PASSWORD')
        const sfLoginUrl = 'https://login.salesforce.com/services/oauth2/token'

        if (!sfClientId || !sfClientSecret || !sfUsername || !sfPassword) {
            throw new Error('TESTE FALHOU: Credenciais do Salesforce não configuradas no Supabase.')
        }

        console.log('--- TEST MODE: VERIFYING SALESFORCE LOGIN ---')

        const authParams = new URLSearchParams()
        authParams.append('grant_type', 'password')
        authParams.append('client_id', sfClientId)
        authParams.append('client_secret', sfClientSecret)
        authParams.append('username', sfUsername)
        authParams.append('password', sfPassword)

        const authResponse = await fetch(sfLoginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: authParams
        })

        if (!authResponse.ok) {
            const authError = await authResponse.text()
            console.error('Salesforce Auth Error (TEST):', authError)
            throw new Error(`TESTE FALHOU: Erro de autenticação no Salesforce. Verifique Login/Senha/Token. Detalhe: ${authResponse.statusText}`)
        }

        const authData = await authResponse.json()
        console.log('Salesforce Login Successful (Auth Token Obtained)')

        const leadPayload = {
            FirstName: firstName,
            LastName: lastName,
            MobilePhone: phone,
            WhatsAppCelular__c: true,
            Company: company,
            CNPJ__c: cnpj,
            LeadSource: reqLeadSource || 'SDR - Plataforma (Test)',
            Suborigem_do_Lead__c: reqSubOrigin || 'Cadastro Manual (Test)',
            utm_source: campaignData?.utm_source || 'teste',
            Interesse_do_Cliente__c: interest,
            Unidade_de_negocio__c: businessUnit,
            Segmento__c: segment || 'Usinagem'
        }

        console.log('PAYLOAD FINAL QUE SERIA ENVIADO:', JSON.stringify(leadPayload, null, 2))

        // Simulate Success
        const mockSfId = `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`
        const status = 'success'

        // 3. Log the attempt in Supabase (Test Context)
        console.log('Gravando log de auditoria no Supabase (integration_logs)...')
        const { error: logError } = await supabaseClient
            .schema('dashboard_config')
            .from('integration_logs')
            .insert({


                user_email: (email || 'test-user') + ' (TEST)',
                lead_phone: phone,
                salesforce_id: mockSfId,
                status: status,
                error_message: 'MODO TESTE: Login no Salesforce validado com sucesso. Nenhuma criação de lead feita.',
                payload_json: leadPayload,
                response_json: {
                    message: "Mock success - Auth verified",
                    instance_url: authData.instance_url,
                    timestamp: new Date().toISOString()
                }
            })

        if (logError) console.error('Falha ao gravar log no Supabase:', logError)
        else console.log('Log de auditoria gravado com sucesso.')


        return new Response(
            JSON.stringify({
                success: true,
                id: mockSfId,
                message: 'TESTE BEM SUCEDIDO: Credenciais do Salesforce validadas e dados prontos para envio!',
                debug_payload: leadPayload
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
