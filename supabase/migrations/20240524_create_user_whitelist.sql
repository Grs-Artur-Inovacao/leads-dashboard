-- 1. Garantir que o schema existe
CREATE SCHEMA IF NOT EXISTS dashboard_config;
-- 2. Criar os tipos enumerados dentro do schema
DO $$ BEGIN -- Tipo para Departamento
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_dept'
        AND typnamespace = (
            SELECT oid
            FROM pg_namespace
            WHERE nspname = 'dashboard_config'
        )
) THEN CREATE TYPE dashboard_config.user_dept AS ENUM (
    'atendimento',
    'inovacao',
    'ti',
    'marketing',
    'outros'
);
END IF;
-- Tipo para Cargo
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
        AND typnamespace = (
            SELECT oid
            FROM pg_namespace
            WHERE nspname = 'dashboard_config'
        )
) THEN CREATE TYPE dashboard_config.user_role AS ENUM ('admin', 'manager', 'user');
END IF;
END $$;
-- 3. Criar a tabela de Whitelist
CREATE TABLE IF NOT EXISTS dashboard_config.user_whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role dashboard_config.user_role DEFAULT 'user' NOT NULL,
    department dashboard_config.user_dept DEFAULT 'outros' NOT NULL,
    has_access BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE dashboard_config.user_whitelist ENABLE ROW LEVEL SECURITY;
-- 5. Políticas de Acesso
DROP POLICY IF EXISTS "Users can view their own whitelist entry" ON dashboard_config.user_whitelist;
CREATE POLICY "Users can view their own whitelist entry" ON dashboard_config.user_whitelist FOR
SELECT TO public USING (TRUE);
DROP POLICY IF EXISTS "Enable insert for registration" ON dashboard_config.user_whitelist;
CREATE POLICY "Enable insert for registration" ON dashboard_config.user_whitelist FOR
INSERT TO public WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Admins can manage whitelist" ON dashboard_config.user_whitelist;
CREATE POLICY "Admins can manage whitelist" ON dashboard_config.user_whitelist FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM dashboard_config.user_whitelist
        WHERE email = (auth.jwt()->>'email')
            AND role = 'admin'
    )
);