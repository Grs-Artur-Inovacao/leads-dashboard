# Sistema de Rastreamento de Campanhas (Ads Tracking)

Este documento descreve o funcionamento técnico do sistema de rastreamento de campanhas integrado ao dashboard.

## 1. Origem dos Dados
Os dados de campanha residem na tabela `campaign_log` do Supabase. Essa tabela registra cliques em anúncios e parâmetros UTM capturados no frontend.

Colunas principais utilizadas:
* `phone`: Número de telefone do usuário (chave de cruzamento).
* `utm_campaign` / `camping` / `campaign_name`: Nome técnico da campanha.
* `utm_source`, `utm_medium`, `utm_term`, `utm_content`: Parâmetros de origem.

## 2. Lógica de Cruzamento (Join)
O sistema não utiliza Chaves Estrangeiras (FK) rígidas, pois o cruzamento é feito em tempo de consulta utilizando o número de telefone como identificador comum entre as tabelas `info_lead` e `campaign_log`.

### Processo de Normalização:
Sempre normalize os números de telefone removendo caracteres não numéricos (`\D`) antes de comparar, para garantir a compatibilidade entre os formatos (ex: `+5511...` vs `(11) ...`).

## 3. Extração de Nomes de Campanha
As campanhas geradas via tráfego pago seguem frequentemente o padrão de tokens delimitados por colchetes:
`[ATR][MT][CONV][PRO][REN][USI][NOME_AMIGAVEL][NT]`

### Lógica de Parsing (JavaScript/TypeScript):
1. Capturar todos os conteúdos entre colchetes usando regex: `campaign.match(/\[([^\]]+)\]/g)`.
2. Se houver 7 ou mais tokens, o **7º token** (índice 6) é considerado o nome amigável da campanha.
3. Se houver menos de 7 tokens, utilize o último token encontrado.
4. Substitua caracteres de soma (`+`) por espaços.
5. Caso não siga o padrão de colchetes, retorne o valor bruto limpo.

## 4. Implementação nas Views

### CampaignLogsView (`components/campaign-logs-view.tsx`)
* Lista as entradas mais recentes da tabela `campaign_log`.
* Cruza cada log com a tabela `info_lead` para mostrar o nome do lead correspondente.
* Agrega dados para um gráfico de barras (Mixed Bar Chart) mostrando as top campanhas.

### LeadsListView (`components/leads-list-view.tsx`)
* Cada lead carregado é enriquecido com o log de campanha mais recente vinculado ao seu telefone.
* A campanha identificada é exibida como um `Badge` azul suave na coluna **Interesse (Produto)** para prover contexto comercial imediato.

## 5. Diretrizes de Manutenção
* **Performance:** Ao buscar dados de campanha para muitos leads, faça uma única consulta usando o operador `.in()` ou `.or()` com a lista de telefones, em vez de uma consulta por lead.
* **Fallback:** Sempre forneça um fallback amigável (ex: "Direto / Orgânico") caso nenhum log de campanha seja encontrado para o lead.
