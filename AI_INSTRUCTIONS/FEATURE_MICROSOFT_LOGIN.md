# Feature: Microsoft Azure Login

Implementação do login seguro utilizando as contas organizacionais da Alltech via Microsoft Entra ID (Azure AD).

## Estrutura da Feature

- **Página de Login**: `app/login/page.tsx`
- **Componente de Formulário**: `components/login-form.tsx`
- **Ícone**: `components/icons/microsoft-icon.tsx`
- **Configuração de Auth**: `lib/auth.ts` (A ser criado)
- **API Handler**: `app/api/auth/[...nextauth]/route.ts` (A ser criado)

## Passos para Integração

1. **Dependências**: Instalar `next-auth`.
2. **Azure App Registration**:
   - Criar um app no portal Azure.
   - Configurar o Redirect URI para `http://localhost:3000/api/auth/callback/azure-ad`.
   - Obter Client ID, Client Secret e Tenant ID.
3. **Variáveis de Ambiente**:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`
   - `NEXTAUTH_SECRET` (Chave aleatória)
   - `NEXTAUTH_URL` (`http://localhost:3000`)

## Fluxo de Autenticação

1. Usuário acessa `/login`.
2. Usuário clica em "Entrar com Microsoft".
3. Redirecionamento para o fluxo OAuth da Microsoft.
4. Após o sucesso, o NextAuth gerencia a sessão via Cookies/JWT.
5. O usuário é redirecionado para a dashboard.

## Estilo

- Baseado no template de login do **shadcn/ui**.
- Cores e fontes alinhadas com o sistema de design atual (vibrant colors, clean interface).
