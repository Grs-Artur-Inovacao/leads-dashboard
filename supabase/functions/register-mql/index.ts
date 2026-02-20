
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
        console.log('--- NOVO PEDIDO DE REGISTRO MQL ---')
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


        // Try to find the lead source/metrics in campaign_log
        const { data: campaignData, error: campaignError } = await supabaseClient
            .from('campaign_log')
            .select('*')
            .ilike('phone', `%${normalizedPhone}%`) // Fuzzy match or exact match depending on data quality
            .limit(1)
            .single()

        // Default source values
        let utmSource = ''
        let utmMedium = ''
        let utmCampaign = ''
        let utmTerm = ''
        let utmContent = ''

        // Use values from request if provided (fixed in UI), otherwise generic
        let leadSource = reqLeadSource || 'SDR - Plataforma'
        let subOrigin = reqSubOrigin || 'SDR - Cadastro Manual'

        if (campaignData) {
            utmSource = campaignData.utm_source || ''
            utmMedium = campaignData.utm_medium || ''
            utmCampaign = campaignData.camping || '' // Assuming 'camping' is campaign name in schema
            utmTerm = campaignData.utm_term || ''
            utmContent = campaignData.utm_content || ''

            // If request didn't specify origin, use campaign data
            if (!reqLeadSource) {
                leadSource = 'Marketing'
                subOrigin = `Orgânico/Campanha (Enriquecido: ${utmSource}/${utmMedium})`
            }
        }


        // 2. Authenticate with Salesforce
        const sfClientId = Deno.env.get('SALESFORCE_CLIENT_ID')
        const sfClientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET')
        const sfUsername = Deno.env.get('SALESFORCE_USERNAME')
        const sfPassword = Deno.env.get('SALESFORCE_PASSWORD') // Includes Security Token if needed
        const sfLoginUrl = 'https://login.salesforce.com/services/oauth2/token'

        if (!sfClientId || !sfClientSecret || !sfUsername || !sfPassword) {
            throw new Error('Credenciais do Salesforce não configuradas no servidor.')
        }

        const authParams = new URLSearchParams()
        authParams.append('grant_type', 'password')
        authParams.append('client_id', sfClientId)
        authParams.append('client_secret', sfClientSecret)
        authParams.append('username', sfUsername)
        authParams.append('password', sfPassword)

        console.log('Authenticating with Salesforce...')
        const authResponse = await fetch(sfLoginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: authParams
        })

        if (!authResponse.ok) {
            const authError = await authResponse.text()
            console.error('Salesforce Auth Error:', authError)
            throw new Error(`Falha na autenticação do Salesforce: ${authResponse.statusText}`)
        }

        const authData = await authResponse.json()
        const accessToken = authData.access_token
        const instanceUrl = authData.instance_url

        // 3. Create Lead in Salesforce
        const leadPayload = {
            FirstName: firstName,
            LastName: lastName,
            MobilePhone: phone, // Assuming format matches SF requirement or pass raw
            WhatsAppCelular__c: true, // Fixed: should be boolean
            Company: company,
            CNPJ__c: cnpj,
            LeadSource: leadSource,
            Suborigem_do_Lead__c: subOrigin,
            utm_source__c: utmSource,
            UTM_Medium__c: utmMedium,
            UTM_Campaign__c: utmCampaign,
            UTM_Content__c: utmContent,
            utm_term__c: utmTerm,
            Interesse_do_Cliente__c: interest,
            Unidade_de_negocio__c: businessUnit,
            Segmento__c: segment || 'Usinagem'
        }


        console.log('PAYLOAD FINAL PARA SALESFORCE:', JSON.stringify(leadPayload, null, 2))
        const createLeadUrl = `${instanceUrl}/services/data/v59.0/sobjects/Lead`


        const leadResponse = await fetch(createLeadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadPayload)
        })

        let sfResponseData: any = {}
        let status = 'error'
        let errorMessage = ''
        let sfId = ''

        if (leadResponse.ok) {
            sfResponseData = await leadResponse.json()
            if (sfResponseData.success) {
                status = 'success'
                sfId = sfResponseData.id
            } else {
                // Should hopefully be caught by !ok if strictly REST, but let's be safe
                if (sfResponseData.errors && sfResponseData.errors.length > 0) {
                    errorMessage = JSON.stringify(sfResponseData.errors)
                }
            }
        } else {
            // Handle error response body
            try {
                const errorBody = await leadResponse.json()
                sfResponseData = errorBody
                errorMessage = JSON.stringify(errorBody)
            } catch (e) {
                errorMessage = `Error ${leadResponse.status}: ${leadResponse.statusText}`
            }
        }

        // 4. Log the attempt in Supabase
        console.log('Gravando log de auditoria no Supabase...')
        const { error: logError } = await supabaseClient
            .schema('dashboard_config')
            .from('integration_logs')
            .insert({


                user_email: email || 'system',
                lead_phone: phone,
                salesforce_id: sfId,
                status: status,
                error_message: errorMessage,
                payload_json: leadPayload,
                response_json: sfResponseData
            })

        if (logError) {
            console.error('Falha ao gravar log de auditoria:', logError)
        } else {
            console.log('Log de auditoria gravado com sucesso.')
        }


        if (status === 'success') {
            return new Response(
                JSON.stringify({ success: true, id: sfId, message: 'Lead criado com sucesso!' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        } else {
            return new Response(
                JSON.stringify({ success: false, error: errorMessage }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
