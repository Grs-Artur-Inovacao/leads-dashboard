# Documentação da Funcionalidade: Visualização de Atualizações (Updates View)

## 1. Visão Geral
A seção "Novidades" (Updates View) é responsável por exibir o histórico de atualizações, melhorias e correções do sistema "Renatinha". Ela utiliza uma arquitetura baseada em arquivos estáticos (JSON + Markdown) para facilitar a manutenção de conteúdo sem a necessidade de banco de dados.

## 2. Arquitetura

### Componentes Principais
*   **Frontend Component**: `components/updates-view.tsx`
    *   Responsável por buscar o manifesto, renderizar os cards e gerenciar o estado do Drawer de detalhes.
*   **Drawer Component**: `components/ui/drawer.tsx`
    *   Implementação baseada na biblioteca `vaul` para exibir o conteúdo detalhado em um painel deslizante.

### Fontes de Dados
*   **Tabela Supabase**: `dashboard_config.updates_feed`
    *   Campos: `id`, `version`, `date_display`, `title`, `summary`, `content`, `release_date`, `is_active`, `theme_color`.
*   **Personalização Visual**:
    *   A coluna `theme_color` permite escolher a cor de destaque do card.
    *   Valores suportados: `blue` (default), `orange`, `green`, `purple`.

## 3. Workflow para Adicionar Novas Atualizações

As atualizações agora são gerenciadas via Banco de Dados (Supabase). Para adicionar uma nova:

1.  **Inserir Registro na Tabela**:
    ```sql
    INSERT INTO dashboard_config.updates_feed (
      version, 
      title, 
      summary, 
      content, 
      theme_color, 
      is_active
    ) VALUES (
      '2.2.0', 
      'Nova Funcionalidade', 
      'Breve resumo para o card.', 
      'Texto completo em **Markdown** para o detalhamento...', 
      'orange', 
      true
    );
    ```

2.  **Verificação**:
    *   O dashboard carrega automaticamente os registros onde `is_active = true`, ordenados pela `release_date` decrescente.

## 4. Diretrizes de Estilo e UI

### Card de Atualização
*   **Design Premium**: Cards com imagem de fundo (avatar gerado por versão), overlay escuro e tipografia clara.
*   **Comportamento**:
    *   Estado inicial: Imagem em escala de cinza (`grayscale`) e brilho reduzido.
    *   Hover: Imagem colorida e com brilho normal.
*   **Estrutura**: Badge da versão, Data, Título, Resumo clampado (3 linhas) e Botão "Ver Detalhes".

### Exibição de Detalhes (Drawer)
*   **Biblioteca**: `vaul` (Drawer).
*   **Renderização de Markdown**: `react-markdown` com plugin `remark-gfm`.
*   **Tipografia (Prose)**:
    *   Utiliza a classe `prose` do Tailwind Typography.
    *   **CRÍTICO (Dark Mode)**: É obrigatório o uso de overrides para garantir legibilidade no modo escuro:
        *   `prose-headings:text-foreground` (para, títulos h1-h6)
        *   `prose-strong:text-foreground` (para negrito)
        *   `text-muted-foreground` para parágrafos (`p`) e listas (`li`).

## 5. Exemplo de Código (Renderização Markdown)

Ao implementar ou modificar a renderização do markdown, certifique-se de usar as seguintes classes para garantir a visibilidade correta:

```tsx
<article className="prose prose-stone dark:prose-invert max-w-none 
    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
    prose-p:text-muted-foreground prose-li:text-muted-foreground
    prose-li:marker:text-primary
    prose-strong:text-foreground prose-strong:font-bold">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
    </ReactMarkdown>
</article>
```

---
*Documento criado para garantir a consistência na manutenção da seção de Updates.*
