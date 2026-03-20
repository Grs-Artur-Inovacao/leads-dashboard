# Formulários de Qualificação de Lead (Ocultos)

Os formulários de qualificação de Lead (que permitem cadastrar o Lead como MQL no Salesforce e no banco de dados) foram **ocultados temporariamente** a pedido do usuário em 20/03/2026. Eles não foram excluídos para permitir o uso futuro.

## Onde e como estavam implementados

### 1. Componente `LeadRegistrationForm`
O formulário de qualificação de leads está localizado em `components/lead-registration-form.tsx`. Esse formulário possui regras de validações, campos obrigatórios, envio de dados para as Edge Functions (`register-mql`) e integração no Salesforce.
Ele foi mantido intacto no repositório.

### 2. Ocultação no `LeadsListView` (`components/leads-list-view.tsx`)
O botão "Qualificar como MQL" foi comentado/ocultado na tabela de "Leads Detalhados". 

O trecho de código ocultado dentro de `components/leads-list-view.tsx` era responsável por exibir um Modal (`Dialog`) contendo o `LeadRegistrationForm` na última coluna ("Resumo") da tabela, caso a flag `lead.is_mql` fosse falsa.

```tsx
/* Trecho removido/comentado temporariamente para ocultar a UI:
<Dialog>
    <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
            <UserPlus className="h-3.5 w-3.5" />
            Qualificar como MQL
        </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Qualificar Lead (MQL)</DialogTitle>
            <DialogDescription>
                Preencha os dados do lead para cadastrá-lo como MQL no Salesforce.
            </DialogDescription>
        </DialogHeader>
        <LeadRegistrationForm
            initialData={{
                leadId: lead.id,
                firstName: lead.first_name,
                lastName: lead.last_name,
                phone: lead.phone,
                company: lead.company,
                interest: lead.product,
                email: lead.email,
                cnpj: lead.cnpj
            }}
            onSuccess={() => fetchLeads()}
        />
    </DialogContent>
</Dialog>
*/
```

## Como reativar no futuro

Se precisar reativar a qualificação de MQLs:
1. Abra o arquivo `components/leads-list-view.tsx`.
2. Procure pela tabela condicional onde verifica `{lead.is_mql ? (...) : (...) }`.
3. Descomente a re-habilite o código do Modal/Dialog com o `<LeadRegistrationForm />`.
4. Garanta que a dependência da classe `LeadRegistrationForm` continue sendo importada no topo do arquivo.
5. Verifique a edge function `register-mql` no Supabase e garanta que as variáveis de ambiente com as credenciais do Salesforce estejam devidamente configuradas.
