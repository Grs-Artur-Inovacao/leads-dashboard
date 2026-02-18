# Central de Ajuda e Documentação

Abaixo você encontrará o detalhamento completo do fluxo da nossa assistente virtual **Renatinha**, seguido pelas instruções de uso do Dashboard.

---

## 1. Fluxo de Funcionamento (Renatinha)

A **Renatinha** é o coração da nossa automação de atendimento. O diagrama abaixo ilustra a jornada completa do lead, desde a captação via anúncios até o processamento inteligente de dados, integrações com CRM e regras de follow-up.

![Fluxo Completo](/help-images/complet_flow.png)

### Passo 1: Entrada de Leads e Registro
Tudo começa com a interação do usuário.

1.  **Captação**: O usuário clica em um anúncio (Instagram/Facebook) e é direcionado para nossas Landing Pages (LP), que aciona a `Edge Function impact_campaign` registrando o anuncio vinculado ao telefone do lead.
2.  **Primeiro Contato**: Se o usuário enviar a primeira mensagem via WhatsApp, o sistema consulta a tabela `campaign_log` para identificar a origem do lead.
3.  **Não Contactou**: Se o usuário não enviar a primeira mensagem via WhatsApp, o timer automático na tabela `campaign_log` será acionado e será enviado um disparo para aquele contato.

![Entrada de Leads](/help-images/Step_1.png)

### Passo 2: O Núcleo da Renatinha
O "cérebro" da operação. A aplicação recebe a mensagem do usuário e processa a intenção.

-   **Loop de Conversação**: O sistema baseia-se em um loop de pergunta e resposta.
-   **Roteamento**: Baseado na mensagem, a Renatinha decide se deve responder automaticamente, acionar uma ferramenta específica ou encerrar o atendimento.

![Funções da Renatinha](/help-images/Step_2.png)

#### Passo 2.1: Habilidades e Ferramentas (Skills)

Para garantir a precisão das respostas, a Renatinha utiliza ferramentas de consulta a bases de dados:

*   **Base de Dados Atual:** O sistema opera com um banco de dados do `supabase` estático contendo informações consolidadas de Janeiro.
*   **Integração Futura:** Esta estrutura será substituída em breve por uma integração direta com o **Data Lake do Salesforce**, permitindo o acesso a dados dinâmicos e atualizados em tempo real.

![Base de Conhecimento](/help-images/Step_2.1.png)

### Passo 3: Estrutura de Dados e Integrações
Onde as informações residem e como são sincronizadas para garantir a inteligência do fluxo.

*   **Contextualização de Origem**: No início da conversa, o sistema consulta a tabela `campaign_dictionary` para identificar a origem exata do lead e o anúncio que motivou o contato.
*   **Inteligência de Vendas**: A assistente acessa dados dinâmicos nas tabelas `promotions_db` e `events_db`, adaptando o discurso conforme as promoções e eventos vigentes.
*   **Ciclo de Ingestão**: As informações coletadas durante o atendimento são registradas na tabela `lead_information`, garantindo a persistência e organização dos dados para futuras interações.
*   **Formulários de Captura**: Além do fluxo conversacional, são utilizados formulários específicos para a ingestão estruturada de dados dos leads.
*   **Otimização de Público (Facebook)**: Leads qualificados geram feedback automático para o Facebook, permitindo o ajuste fino dos algoritmos de anúncio e a melhoria contínua do público-alvo.

![Estrutura de Informações](/help-images/Step_3.png)

### Passo 4: Fluxo de Follow-up (Retenção)
Nenhum lead é deixado para trás. O sistema possui um ciclo de verificação automática:

1.  **Inatividade (30 min)**: Se o lead não interagir por 30 minutos, o sistema inicia o ciclo de follow-up automático.
2.  **Sequência de Contatos**:
    -   **Follow-up 1**: Pergunta se o usuário ainda precisa de auxílio ou informações adicionais.
    -   **Follow-up 2**: Notifica o usuário que a conversa será encerrada por falta de interação.
3.  **Janela de 24h**: Todo o processo de reengajamento ocorre dentro de um período máximo de 24 horas.
4.  **Desfecho do Lead**:
    -   **Reengajamento**: Se o lead responder a qualquer momento, ele retorna imediatamente para o fluxo de conversação ativo.
    -   **Perda (Lost)**: Caso não haja resposta após os follow-ups, o lead é movido para `Lost Leads` com o registro do motivo da perda para futuras campanhas.

5.  **Resposta ao Salesforce**: Caso tenhamos todas as informações do cliente o sistema envia automaticamente o resumo da conversa e o status atualizado do lead para o CRM, garantindo que a equipe comercial tenha visibilidade total do histórico.

![Fluxo de Follow UP](/help-images/Step_4.png)

---

## 2. Informações Adicionais: Painel Dashboard

Após entender o fluxo da Renatinha, veja como acompanhar esses dados no nosso Dashboard.

### Visão Geral
A tela inicial apresenta um resumo estratégico:
-   **Gráfico de Área**: Exibe a evolução dos leads (Eixo X: Tempo, Eixo Y: Volume), permitindo filtrar por status ou operador.
-   **Dica**: Passe o mouse sobre os pontos do gráfico para métricas diárias detalhadas.

### Leads Detalhados
Na seção de lista, você tem controle total:
-   **Colunas**: Nome, Status (Novo, Em Atendimento, etc), Data da última interação e Agente responsável.
-   **Filtros**: Utilize os seletores no topo para segmentar a lista rapidamente.

### Configurações
Área administrativa para:
-   Atualizar perfil e senha.
-   Configurar notificações de alertas.
-   Gerenciar integrações (CRM, WhatsApp).

---

**Suporte Técnico**
Dúvidas sobre o funcionamento da Renatinha ou do Dashboard? Abra um chamado com a equipe de dev.
