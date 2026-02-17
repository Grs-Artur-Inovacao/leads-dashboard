# Relatório de Incidente: Ambiente de Desenvolvimento Frontend

**Data:** 17/02/2026
**Assunto:** Ausência do Node.js/NPM no ambiente de desenvolvimento
**Solicitante:** Inovação (Dashboard Leads)

## 1. Descrição do Problema
Durante a tentativa de execução do projeto *Leads Dashboard* (Next.js), foi identificado que o **Node.js** e o gerenciador de pacotes **npm** não estão instalados na máquina ou não estão configurados corretamente nas Variáveis de Ambiente (PATH) do sistema operacional Windows.

Ao tentar executar comandos padrão de desenvolvimento, o terminal retorna erros de "comando não encontrado".

## 2. Evidências Técnicas
Ao executar comandos de verificação de versão no PowerShell, obtivemos as seguintes saídas:

```powershell
PS C:\Users\inovacao02\...\dashboard\leads-dashboard> node -v
node : O termo 'node' não é reconhecido como nome de cmdlet, função, arquivo de script ou programa operável.

PS C:\Users\inovacao02\...\dashboard\leads-dashboard> npm run dev
npm : O termo 'npm' não é reconhecido como nome de cmdlet, função, arquivo de script ou programa operável.
```

## 3. Impacto
A ausência dessas ferramentas impede:
1.  A instalação de dependências do projeto (`npm install`).
2.  A execução do servidor de desenvolvimento local (`npm run dev`).
3.  O build da aplicação para produção.

## 4. Solicitação
Solicitamos o apoio da equipe de T.I. para realizar os seguintes procedimentos na estação de trabalho do usuário `inovacao02`:

1.  **Instalação do Node.js (Versão LTS)**
    *   Recomendada: **v20.x (LTS)** ou superior.
    *   Download oficial: [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
    
2.  **Configuração de Variáveis de Ambiente**
    *   Garantir que o executável do Node e do NPM estejam adicionados ao `PATH` do usuário e do sistema.
    
3.  **Validação**
    *   Após instalação, executar em um novo terminal:
        *   `node -v` (Deve retornar a versão, ex: v20.11.0)
        *   `npm -v` (Deve retornar a versão, ex: 10.2.4)

---
*Este documento foi gerado automaticamente pelo assistente de codificação para facilitar o chamado de suporte.*
