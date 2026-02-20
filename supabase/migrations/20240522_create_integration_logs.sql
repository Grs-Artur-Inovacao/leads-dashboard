-- Create schema if not exists
create schema if not exists dashboard_config;
-- Create table for integration logs inside dashboard_config schema
create table if not exists dashboard_config.integration_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),
    user_email text not null,
    -- E-mail do SDR responsável
    lead_phone text,
    -- Telefone do lead para referência
    salesforce_id text,
    -- ID retornado pelo Salesforce (sucesso)
    status text check (status in ('success', 'error')),
    error_message text,
    -- Detalhe do erro (se houver)
    payload_json jsonb,
    -- Dados enviados (auditoria)
    response_json jsonb -- Resposta bruta do Salesforce
);
-- Policy to allow authenticated users to insert logs
alter table dashboard_config.integration_logs enable row level security;
create policy "Enable insert for authenticated users" on dashboard_config.integration_logs for
insert to authenticated with check (true);
create policy "Enable select for authenticated users" on dashboard_config.integration_logs for
select to authenticated using (true);