import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const email = 'icaro.bittencourt@grupoalltech.com.br' // Taking first email from screenshot for a quick test 

    console.log("Tentando atualizar role para reader para o email:", email)
    const { data, error } = await supabase
        .schema('dashboard_config')
        .from('user_whitelist')
        .update({ role: 'reader' })
        .eq('email', email)
        .select()

    if (error) {
        console.error("ERRO DO SUPABASE:")
        console.error(error)
    } else {
        console.log("SUCESSO:", data)
    }
}

run()
