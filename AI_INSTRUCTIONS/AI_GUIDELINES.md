# Diretrizes de Desenvolvimento do Leads Dashboard

Este documento define os padrões e diretrizes obrigatórios para o desenvolvimento e manutenção deste projeto. Agentes de IA e desenvolvedores devem seguir estas regras rigorosamente para manter a consistência visual e arquitetural.

## 1. Stack Tecnológico

*   **Framework:** Next.js (App Router)
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS (**obrigatório**)
*   **Biblioteca de Componentes:** **shadcn/ui** (https://ui.shadcn.com/)

## 2. Padrões de Interface (UI/UX)

### Biblioteca de Componentes (Shadcn/UI)
*   **OBRIGATÓRIO:** Utilize componentes do shadcn/ui para elementos de interface (Botões, Inputs, Cards, Dialogs, etc.).
*   **Localização:** Os componentes base ficam no diretório `components/ui/`.
*   **Criação:** Se necessário um novo componente (ex: Tabs, Avatar), **copie a implementação oficial** da documentação do shadcn/ui e crie o arquivo correspondente em `components/ui/`. Não crie componentes de UI "do zero" com estilos ad-hoc se já existir um padrão no shadcn.
*   **NÃO use HTML nativo estilizado** (ex: `<button className="...">`) se houver um componente equivalente (`<Button>`).

### Estilo Visual (Look & Feel)
*   **Tema:** O projeto segue um tema **Dark Mode** premium ("Acme Inc.").
*   **Cores:**
    *   Utilize as variáveis semânticas do Tailwind (`bg-background`, `bg-card`, `text-primary`, `text-muted-foreground`) em vez de cores fixas (`bg-black`, `text-gray-500`).
    *   Isso garante consistência com o `globals.css`.
*   **Tipografia:** Fonte limpa e profissional (Inter/Sans). Use `text-muted-foreground` para textos secundários/descrições.

## 3. Estrutura de Diretórios

*   `app/`: Páginas (`page.tsx`) e layouts (`layout.tsx`).
*   `components/`: Componentes de negócio compostos (ex: `Sidebar.tsx`, `LeadsAreaChart.tsx`).
*   `components/ui/`: Componentes primitivos de UI (padrão shadcn). **Não modifique a lógica destes arquivos**, apenas o estilo se estritamente necessário via variantes.
*   `lib/`: Utilitários (ex: `utils.ts` com `cn`, `supabaseClient.ts`).

## 4. Convenções de Código

*   **Ícones:** Utilize a biblioteca `lucide-react`.
*   **Classes Condicionais:** Utilize a função `cn()` (de `@/lib/utils`) para mesclar classes Tailwind.
    *   *Exemplo:* `className={cn("bg-red-500", className)}`

## 5. Exemplos

### Como implementar um Botão (Correto vs Incorreto)

❌ **INCORRETO (Estilo Manual):**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Salvar
</button>
```

✅ **CORRETO (Padrão Shadcn):**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">
  Salvar
</Button>
```

### Como criar variantes de estilo
Use as variantes já definidas nos componentes (`variant="ghost"`, `variant="outline"`, `variant="secondary"`) antes de criar estilos customizados.

---
*Documento criado para padronização de desenvolvimento assistido por IA.*
