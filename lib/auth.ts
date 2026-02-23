import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { supabase } from "./supabaseClient"

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || "",
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
            tenantId: process.env.AZURE_AD_TENANT_ID || "",
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login", // Redirect to login on error
    },
    callbacks: {
        async signIn({ user }) {
            // Permitimos a entrada inicial para qualquer usuário que se autentique via Microsoft
            // A restrição real de acesso ao dashboard é feita na Page ou Middleware usando a flag hasAccess
            return true
        },
        async jwt({ token, user }) {
            try {
                if (user && user.email) {
                    const userEmail = user.email.toLowerCase()
                    console.log(`[AUTH] Processando: ${userEmail}`)

                    // 1. Verificar se o usuário já existe na whitelist
                    const { data: existingUser, error: fetchError } = await supabase
                        .schema('dashboard_config')
                        .from("user_whitelist")
                        .select("role, department, has_access")
                        .eq("email", userEmail)
                        .maybeSingle()

                    if (fetchError) {
                        console.error("[AUTH] Erro ao buscar whitelist:", fetchError)
                    }

                    if (existingUser) {
                        console.log(`[AUTH] Usuário encontrado: ${userEmail}, Acesso: ${existingUser.has_access}`)
                        token.role = existingUser.role
                        token.department = existingUser.department
                        token.hasAccess = existingUser.has_access
                    } else {
                        console.log(`[AUTH] Novo usuário ou não encontrado: ${userEmail}. Sincronizando...`)
                        // 2. NOVA PESSOA: Lógica de Auto-Registro
                        type AllowedDepts = 'atendimento' | 'inovacao' | 'ti' | 'marketing' | 'outros'
                        let detectedDept: AllowedDepts = 'outros'
                        let autoAccess = false

                        // Verificação de palavras-chave no e-mail
                        const keywords = ['ti', 'marketing', 'atendimento', 'inovacao']
                        for (const key of keywords) {
                            if (userEmail.includes(key)) {
                                detectedDept = key as AllowedDepts
                                autoAccess = true
                                break
                            }
                        }

                        // 3. Registrar ou atualizar no banco (Upsert para evitar conflitos)
                        const { error: insertError } = await supabase
                            .schema('dashboard_config')
                            .from("user_whitelist")
                            .upsert({
                                email: userEmail,
                                role: 'user',
                                department: detectedDept,
                                has_access: autoAccess,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'email' })

                        if (insertError) {
                            console.error("[AUTH] Erro ao registrar/atualizar usuário:", insertError)
                        }

                        token.role = 'user'
                        token.department = detectedDept
                        token.hasAccess = autoAccess
                    }
                }
            } catch (err) {
                console.error("[AUTH] Erro crítico no callback JWT:", err)
                token.hasAccess = false // Fallback de segurança
            }
            return token
        },
        async session({ session, token }) {
            // Adiciona cargo e departamento ao objeto da sessão com fallbacks seguros
            if (session.user) {
                (session.user as any).role = token.role || 'user';
                (session.user as any).department = token.department || 'outros';
                (session.user as any).hasAccess = token.hasAccess ?? false;
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
