# Documentação da Funcionalidade: Central de Ajuda (Help View)

## 1. Visão Geral
A Central de Ajuda (Help View) fornece documentação, manuais e fluxogramas para os usuários do sistema. Assim como a seção de Updates, ela utiliza uma arquitetura baseada em arquivos estáticos (JSON + Markdown) para permitir a gestão dinâmica do conteúdo.

## 2. Arquitetura

### Componentes Principais
*   **Frontend Component**: `components/help-view.tsx`
    *   Responsável por buscar o manifesto, renderizar os itens do Accordion e exibir o conteúdo Markdown.
*   **Componentes UI**: Utiliza `Card` (para visualizações/imagens) e `Accordion` (para os textos).

### Fontes de Dados
*   **Manifesto**: `public/docs/manifest.json`
    *   Arquivo JSON que define a estrutura de seções.
    *   Contém: `id`, `title` (Título da Seção/Accordion), `file` (caminho para o markdown).
*   **Conteúdo Detalhado**: `public/docs/*.md`
    *   Arquivos Markdown contendo o texto de cada manual.

## 3. Workflow para Adicionar Nova Documentação

1.  **Criar o Arquivo de Conteúdo**:
    *   Adicione um novo arquivo `.md` na pasta `public/docs/` (ex: `faq.md`).
    *   Escreva o conteúdo usando Markdown.

2.  **Atualizar o Manifesto**:
    *   Edite `public/docs/manifest.json`.
    *   Adicione um novo objeto ao array para criar uma nova seção no Accordion:
    ```json
    {
      "id": "faq",
      "title": "Perguntas Frequentes",
      "file": "/docs/faq.md"
    }
    ```

## 4. Diretrizes de Estilo e Markdown

### Renderização de Código
Para garantir que trechos de código ou comandos (ex: `Edge Function`) sejam visíveis no Dark Mode, o componente `MarkdownContent` aplica estilos específicos:

```tsx
prose-code:font-mono prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 
prose-code:rounded prose-code:text-foreground
```

**Regra:** Sempre use crases (\`) para termos técnicos, nomes de tabelas ou comandos dentro dos arquivos Markdown. Ex: \`tabela_users\`.

### Imagens
*   As imagens devem ficar em `public/help-images/`.
*   Referências no Markdown devem usar caminho absoluto: `![Lead Flow](/help-images/flow.png)`.

---
*Documento criado para padronização da manutenção da Central de Ajuda.*
