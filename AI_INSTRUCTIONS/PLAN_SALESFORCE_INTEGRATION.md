# Plano de Integração: Cadastro de Leads SDR -> Salesforce via Supabase Edge Functions

## 1. Objetivo
Permitir que os SDRs (Sales Development Representatives) cadastrem manualmente leads na plataforma, enriquecendo esses dados automaticamente com informações de origem (UTMs) armazenadas no banco de dados e enviando-os para o Salesforce CRM. O processo deve ser auditável e seguro.

## 2. Arquitetura da Solução

### Fluxo de Dados
1.  **Frontend (Next.js)**: SDR abre o modal de cadastro na tela "Leads Detalhados".
2.  **Supabase Edge Function (`register-mql`)**: Recebe os dados do formulário em um único arquivo de execução.
3.  **Supabase Database (Lookup)**: A função consulta a tabela `public.campaign_log` usando o telefone para enriquecer o lead com dados de campanha (UTMs).
4.  **Salesforce (Auth & Create)**: A função autentica-se no Salesforce e cria o Lead via API REST.
5.  **Supabase Database (Log)**: A função registra o resultado da operação na tabela `dashboard_config.integration_logs`.

6.  **Frontend**: Recebe confirmação de sucesso ou erro e fecha o modal.

---

## 3. Componentes do Sistema

### A. Banco de Dados (Supabase PostgreSQL)

**Tabela existente: `public.campaign_log`**
Utilizada para consulta de origem do lead (UTMs) baseada no telefone.

**Nova Tabela: `dashboard_config.integration_logs`**
Responsável pela auditoria de todas as tentativas de cadastro.

```sql
create table dashboard_config.integration_logs (
  id uuid default gen_random_uuid() primary key,
  -- ... (mesma estrutura anterior)
);
```

### B. Supabase Edge Function (`register-mql`)

Esta função é o núcleo da lógica (Autenticação, Enriquecimento e Integração Salesforce). Foi implementada em um **arquivo único** (`index.ts`) para simplificar o deploy e evitar erros de dependência.


### C. Frontend (Dashboard)

**Novo Componente: `LeadRegistrationDialog`**
*   Substitui a ideia de uma *View* inteira.
*   Utiliza o componente `Dialog` (Shadcn UI).
*   Contém o formulário `LeadRegistrationForm` já desenvolvido.
*   Acionado por um botão "Novo Lead" na barra de ferramentas da tabela `LeadsListView`.

**Sidebar**
*   **Não haverá** item de menu "Novo Lead" separado. O acesso é contextual dentro da lista de leads.

---

## 4. Regras de Negócio do Formulário (Validado pelo Usuário)

*   **Campos Obrigatórios:** Sobrenome, Empresa, CNPJ, Origem do Lead, Unidade de Negócio, Celular/WhatsApp.
*   **Dependência:** O campo "Suborigem" deve filtrar opções baseado na "Origem" selecionada (Mapeamento `LEAD_SOURCES`).
*   **Validações:**
    *   **Celular:** Deve ser formatado/enviado como 55 + DDD + 9 dígitos (12-13 dígitos).
    *   **CNPJ:** 14 dígitos numéricos.
*   **Valores Padrão:** O campo `WhatsAppCelular__c` deve ser enviado como `true`.

---

## 5. Implementação Atualizada

1.  [x] Criar tabela `dashboard_config.integration_logs`.
2.  [x] Desenvolver e deployar Edge Function `register-mql` (Arquivo Único).

3.  [x] Criar lógica do formulário `LeadRegistrationForm` com as regras de negócio.
4.  [ ] **Refatorar Frontend:**
    *   Transformar `LeadRegistrationForm` para funcionar bem dentro de um Dialog (ou criar um wrapper).
    *   Remover "Novo Lead" da Sidebar e do `page.tsx`.
    *   Adicionar botão "Adicionar Lead" em `leads-list-view.tsx` que abre o modal.
