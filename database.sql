-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'CLIENT')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Modelos
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    system_instruction TEXT NOT NULL,
    -- prompt_template pode não existir se a tabela foi criada antes, adicionamos abaixo
    icon VARCHAR(50) DEFAULT 'sparkles',
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRATION: Garantir que a coluna prompt_template existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='models' AND column_name='prompt_template') THEN 
        ALTER TABLE models ADD COLUMN prompt_template TEXT; 
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='models' AND column_name='fields') THEN 
        ALTER TABLE models ADD COLUMN fields JSONB; 
    END IF;
END $$;

-- 4. Tabela de Histórico
CREATE TABLE IF NOT EXISTS history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    model_id UUID REFERENCES models(id),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRATION: Garantir que a coluna model_name existe no histórico
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='history' AND column_name='model_name') THEN 
        ALTER TABLE history ADD COLUMN model_name VARCHAR(100); 
    END IF;
END $$;

-- View Auxiliar (Drop e Create para garantir atualização)
DROP VIEW IF EXISTS users_view;
CREATE OR REPLACE VIEW users_view AS
SELECT 
    u.id, 
    u.username, 
    u.password_hash, 
    u.role, 
    u.created_at, 
    c.full_name, 
    c.company_name 
FROM users u
LEFT JOIN clients c ON u.id = c.user_id
WHERE u.role = 'CLIENT';

-- Dados Iniciais (Admin Padrão)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', 'admin', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- SEGURANÇA (RLS)
-- Habilita RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas para evitar o erro "policy already exists"
DROP POLICY IF EXISTS "Enable access to all users" ON users;
DROP POLICY IF EXISTS "Enable access to all clients" ON clients;
DROP POLICY IF EXISTS "Enable access to all models" ON models;
DROP POLICY IF EXISTS "Enable access to all history" ON history;

-- Recria as políticas permitindo tudo (Para uso com anon key neste demo)
CREATE POLICY "Enable access to all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access to all clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access to all models" ON models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access to all history" ON history FOR ALL USING (true) WITH CHECK (true);