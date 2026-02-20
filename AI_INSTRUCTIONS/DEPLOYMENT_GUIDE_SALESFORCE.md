
# Guia de Implantação - Integração Salesforce

Para colocar a integração em funcionamento, siga os passos abaixo:

## 1. Banco de Dados
Acesse o **SQL Editor** no painel do Supabase e execute o conteúdo do arquivo:
`supabase/migrations/20240522_create_integration_logs.sql`

## 2. Configurar Segredos (Variáveis de Ambiente)
Execute os comandos abaixo no seu terminal (ou adicione via Dashboard em *Edge Functions > Secrets*):

```bash
supabase secrets set SALESFORCE_CLIENT_ID="<seu-client-id>"
supabase secrets set SALESFORCE_CLIENT_SECRET="<seu-client-secret>"
supabase secrets set SALESFORCE_USERNAME="integracao.salesforce@grupoalltech.com.br"
supabase secrets set SALESFORCE_PASSWORD="<sua-senha-e-token>"
```

*Nota: Use as credenciais fornecidas no documento PDF/Prompt.*

## 3. Deploy da Edge Function
No terminal, execute:

```bash
supabase functions deploy register-lead
```

## 4. Teste
1. Acesse o Dashboard.
2. Navegue até "Novo Lead" na barra lateral.
3. Preencha o formulário e envie.
4. Verifique se o lead apareceu no Salesforce e se o log foi criado na tabela `integration_logs`.
