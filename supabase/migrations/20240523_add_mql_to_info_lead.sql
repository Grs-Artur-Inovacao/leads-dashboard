-- Adiciona colunas para controle de MQL (Salesforce Integration) na tabela info_lead
ALTER TABLE public.info_lead
ADD COLUMN IF NOT EXISTS is_mql BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS salesforce_id TEXT,
    ADD COLUMN IF NOT EXISTS mql_at TIMESTAMP WITH TIME ZONE;
-- Comentários para documentação
COMMENT ON COLUMN public.info_lead.is_mql IS 'Indica se o lead foi convertido para MQL (criado no Salesforce)';
COMMENT ON COLUMN public.info_lead.salesforce_id IS 'ID do registro correspondente no Salesforce';
COMMENT ON COLUMN public.info_lead.mql_at IS 'Data e hora em que a conversão para MQL ocorreu';