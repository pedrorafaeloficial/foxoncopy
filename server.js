import 'dotenv/config'; // Carrega variáveis do arquivo .env
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ES Modules para pegar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DA CONEXÃO POSTGRES ---
// Prioriza a variável de ambiente DATABASE_URL. Se não existir, usa a string interna de fallback.
const connectionString = process.env.DATABASE_URL || "postgres://postgres:f230d561ff514e111888@testes_database-foxon:5432/foxon-db";

const pool = new pg.Pool({
  connectionString: connectionString,
  // Redes internas (Docker/Easypanel interno) geralmente não usam SSL, então desativamos
  ssl: false 
});

app.use(cors());
app.use(express.json());

// --- Servir Frontend (Arquivos Estáticos) ---
// O Node serve os arquivos gerados pelo 'npm run build'
app.use(express.static(path.join(__dirname, 'dist')));

// --- Inicialização do Banco (Auto-Migration) ---
const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log('[Database] Conectado ao Postgres (Rede Interna) com sucesso!');
    
    try {
      await client.query('BEGIN');

      // 1. Garante extensão para UUIDs
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

      // 2. Tabelas Base
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL, 
          role VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT now()
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(100) NOT NULL,
          company_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT now()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS models (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          system_instruction TEXT NOT NULL,
          prompt_template TEXT,
          icon VARCHAR(50) DEFAULT 'sparkles',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT now()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT NOT NULL,
          topic TEXT NOT NULL,
          model_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT now()
        );
      `);

      // 3. MIGRATIONS FORÇADAS
      await client.query(`
        ALTER TABLE models ADD COLUMN IF NOT EXISTS prompt_template TEXT;
        ALTER TABLE models ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'sparkles';
        ALTER TABLE models ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        ALTER TABLE models ADD COLUMN IF NOT EXISTS fields JSONB;
      `);

      await client.query(`
        ALTER TABLE history ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);
      `);

      // 4. Seed Admin
      await client.query(`
        INSERT INTO users (username, password_hash, role) 
        VALUES ('admin', 'admin', 'ADMIN')
        ON CONFLICT (username) DO NOTHING;
      `);

      await client.query('COMMIT');
      console.log('[Database] Estrutura do banco verificada e atualizada.');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[Database] Erro na migração/criação:', e);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database] Erro fatal de conexão:', err.message);
    console.error('[Database] Dica: Como você está usando um host interno (testes_database-foxon), certifique-se que este container está na mesma rede do banco.');
  }
};

initDB();

// --- Rotas da API (Ponte React <-> Postgres) ---

app.get('/api/health', (req, res) => res.json({ status: 'online', db: 'postgres-internal' }));

// Models
app.get('/api/models', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM models WHERE is_active = true");
    const data = result.rows.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      systemInstruction: m.system_instruction,
      promptTemplate: m.prompt_template,
      icon: m.icon,
      fields: m.fields || []
    }));
    res.json(data);
  } catch (e) { 
    console.error("Erro GET /models:", e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/models', async (req, res) => {
  const { id, name, description, systemInstruction, promptTemplate, icon, fields } = req.body;
  
  try {
    if (!name || !systemInstruction) {
        throw new Error("Nome e Instrução do Sistema são obrigatórios");
    }

    await pool.query(
      `INSERT INTO models (id, name, description, system_instruction, prompt_template, icon, fields, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         description = EXCLUDED.description, 
         system_instruction = EXCLUDED.system_instruction, 
         prompt_template = EXCLUDED.prompt_template, 
         icon = EXCLUDED.icon,
         fields = EXCLUDED.fields,
         is_active = true`,
      [id, name, description, systemInstruction, promptTemplate, icon, JSON.stringify(fields || [])]
    );
    res.json({ success: true });
  } catch (e) { 
    console.error("ERRO POST /models:", e.message);
    res.status(500).json({ error: e.message }); 
  }
});

app.delete('/api/models/:id', async (req, res) => {
  try {
    await pool.query("UPDATE models SET is_active = false WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Clients (Users + Clients)
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.full_name, c.company_name, u.username, u.password_hash as password, c.created_at
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE u.role = 'CLIENT'
    `);
    
    const data = result.rows.map(c => ({
      id: c.id,
      fullName: c.full_name,
      companyName: c.company_name,
      username: c.username,
      password: c.password,
      createdAt: new Date(c.created_at).getTime()
    }));
    res.json(data);
  } catch (e) { 
    console.error("Erro GET /clients:", e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/clients', async (req, res) => {
  const client = req.body;
  const client_pool = await pool.connect();
  try {
    await client_pool.query('BEGIN');
    
    // 1. Upsert na tabela USERS
    const userQuery = `
      INSERT INTO users (id, username, password_hash, role) 
      VALUES ($1, $2, $3, 'CLIENT')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `;
    
    const userRes = await client_pool.query(userQuery, [client.id, client.username, client.password]);
    const userId = userRes.rows[0].id;

    // 2. Upsert na tabela CLIENTS
    const checkClient = await client_pool.query('SELECT id FROM clients WHERE user_id = $1', [userId]);

    if (checkClient.rows.length > 0) {
      await client_pool.query(
        'UPDATE clients SET full_name = $1, company_name = $2 WHERE user_id = $3',
        [client.fullName, client.companyName, userId]
      );
    } else {
      await client_pool.query(
        'INSERT INTO clients (user_id, full_name, company_name) VALUES ($1, $2, $3)',
        [userId, client.fullName, client.companyName]
      );
    }

    await client_pool.query('COMMIT');
    res.json({ success: true, id: userId });
  } catch (e) {
    await client_pool.query('ROLLBACK');
    console.error("Erro POST /clients:", e);
    res.status(500).json({ error: e.message });
  } finally {
    client_pool.release();
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const clientRes = await pool.query('SELECT user_id FROM clients WHERE id = $1', [req.params.id]);
    
    if (clientRes.rows.length > 0) {
        const userId = clientRes.rows[0].user_id;
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    } else {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    }

    res.json({ success: true });
  } catch (e) { 
    console.error("Erro DELETE /clients:", e);
    res.status(500).json({ error: e.message }); 
  }
});

// History
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM history ORDER BY created_at DESC LIMIT 50");
    const data = result.rows.map(h => ({
      id: h.id,
      content: h.content,
      topic: h.topic,
      modelName: h.model_name,
      timestamp: new Date(h.created_at).getTime()
    }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/history', async (req, res) => {
  const { id, content, topic, modelName, timestamp } = req.body;
  try {
    await pool.query(
      "INSERT INTO history (id, content, topic, model_name, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, content, topic, modelName, new Date(timestamp)]
    );
    res.json({ success: true });
  } catch (e) { 
    console.error("Erro POST /history:", e);
    res.status(500).json({ error: e.message }); 
  }
});

app.delete('/api/history/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM history WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Rota Catch-All para o React ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint API não encontrado' });
  }
  const indexFile = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(500).send("Erro ao carregar a aplicação. Certifique-se de que o 'npm run build' foi executado.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Servidor Ponte] Conectado ao banco interno na porta ${PORT}`);
});