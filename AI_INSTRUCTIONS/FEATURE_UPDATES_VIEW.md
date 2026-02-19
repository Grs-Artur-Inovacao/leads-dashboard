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
*   **Manifesto**: `public/updates/manifest.json`
    *   Arquivo JSON que atua como índice das atualizações.
    *   Contém metadados: `id`, `version`, `date`, `title`, `summary`, `file` (caminho para o markdown).
*   **Conteúdo Detalhado**: `public/updates/*.md`
    *   Arquivos Markdown individuais contendo o texto completo de cada atualização.

## 3. Workflow para Adicionar Novas Atualizações

Para adicionar uma nova atualização ao sistema, siga estes passos:

1.  **Criar o Arquivo de Conteúdo**:
    *   Crie um novo arquivo `.md` na pasta `public/updates/` (ex: `v2.1.0.md`).
    *   Escreva o conteúdo detalhado usando Markdown padrão.

2.  **Atualizar o Manifesto**:
    *   Edite `public/updates/manifest.json`.
    *   Adicione um novo objeto ao array (preferencialmente no início para ordem cronológica inversa):
    ```json
    {
      "id": "v2.1.0",
      "version": "v2.1.0",
      "date": "Março 2026",
      "title": "Título da Atualização",
      "summary": "Resumo curto que aparece no card.",
      "file": "/updates/v2.1.0.md"
    }
    ```

3.  **Deploy**:
    *   O sistema irá ler automaticamente o novo arquivo JSON e exibir o card.

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
