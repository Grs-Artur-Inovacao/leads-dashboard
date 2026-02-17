# Proposta de Planejamento: Página "Leads Detalhados"

Este documento descreve a proposta técnica e visual para a implementação da visualização detalhada dos leads no dashboard.

## 1. Objetivo Principal
Criar uma interface tabular rica e interativa que permita aos usuários visualizar, filtrar e analisar leads individuais com profundidade, indo além da visão agregada do gráfico.

## 2. Layout & UX (Experiência do Usuário)

A página será estruturada usando componentes modernos do **shadcn/ui** para manter a consistência com o resto da aplicação.

### Estrutura Proposta:
1.  **Cabeçalho de Controle**:
    *   **Filtros Já Existentes**: Reutilizar o seletor de Data (7d, 15d, etc.) e o Seletor de Agentes.
    *   **Novos Filtros**: Adicionar filtro por "Status" (Todos, Conectados, Frios).
    *   **Busca**: Campo de texto para buscar por ID ou Agente específico.
2.  **Resumo Rápido (Mini-KPIs)**:
    *   Uma barra superior mostrando o total de leads listados na tabela atual e quantos são qualificados como "Conectados".
3.  **Tabela de Dados (Data Grid)**:
    *   **Colunas Sugeridas**:
        *   **Data/Hora**: Formato amigável (ex: Today, 14:30 ou 15/02/2026).
        *   **Agente**: Nome do agente (usando os "apelidos" configurados nas settings).
        *   **Interações**: Número de mensagens trocadas + Indicador visual (Barra de progresso ou cor).
        *   **Status**: Badge colorido (Verde para Conectado, Cinza para Inicial, Amarelo para Em Progresso).
        *   **Ações**: Botão "Ver Detalhes" (para futuro modal ou drill-down).
4.  **Paginação**:
    *   Controles no rodapé da tabela para navegar entre páginas de resultados (10, 20, 50 itens por página).

## 3. Estratégia Técnica

### Novos Componentes Necessários:
*   `components/leads-list-view.tsx`: Componente principal da visualização.
*   `components/ui/table.tsx`: Componente base de tabela (shadcn/ui).
*   `components/ui/badge.tsx`: Para indicadores de status.
*   `components/ui/pagination.tsx`: Para navegação de páginas.

### Lógica de Dados (Supabase):
A query precisará ser adaptada para suportar paginação eficiente:
```typescript
const { data, count } = await supabase
  .from('info_lead')
  .select('*', { count: 'exact' }) // Buscar todos os campos para ver detalhes
  .range(start, end)               // Paginação
  .order('created_at', { ascending: false })
```

### Integração com Configurações:
*   A tabela respeitará o `interactionThreshold` definido nas configurações para decidir se um lead recebe a badge de "Conectado".
*   Os nomes dos agentes serão mapeados usando o mesmo objeto `agentNames` do localStorage.

## 4. Próximos Passos (Implementação)

1.  **Criar Componentes Base**: Instalar/Criar os componentes de UI (Table, Badge, Pagination).
2.  **Desenvolver `LeadsListView`**: Implementar a lógica de busca e renderização da tabela.
3.  **Integrar na `page.tsx`**: Substituir o placeholder "Em breve" pelo novo componente.
4.  **Refinar Estilos**: Garantir que as cores e espaçamentos sigam o padrão "Premium" do dashboard.

---
**Observação**: Esta proposta assume que a tabela `info_lead` pode conter mais colunas úteis (como identificador do lead, mensagem, etc.) que descobriremos ao dar o `select *`. Se não houver, focaremos nas métricas disponíveis.
