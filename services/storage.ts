import { ScriptModel, GeneratedScript, ClientUser } from '../types';

// Configuração do Status do Banco
export const DB_CONFIG = {
  connectionString: "Aguardando conexão...",
  isConnected: false
};

const API_URL = '/api';

// Verifica a saúde da API ao iniciar
export const connectDatabase = async (): Promise<boolean> => {
  console.log(`[Storage] Tentando conexão com Postgres via API...`);
  
  try {
    // Timeout aumentado para 5 segundos para lidar com cold starts
    const res = await fetch(`${API_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      console.log('[Storage] Conectado com sucesso ao Backend/Postgres.');
      DB_CONFIG.isConnected = true;
      DB_CONFIG.connectionString = "PostgreSQL (Easypanel)";
      return true;
    }
  } catch (e) {
    console.error('[Storage] Não foi possível conectar ao servidor:', e);
  }

  DB_CONFIG.isConnected = false;
  DB_CONFIG.connectionString = "Desconectado (Verifique o servidor)";
  return false;
};

// --- MODELS (Apenas via API) ---

export const getModels = async (): Promise<ScriptModel[]> => {
  if (!DB_CONFIG.isConnected) return [];
  try {
    const res = await fetch(`${API_URL}/models`);
    if (!res.ok) throw new Error("Falha ao buscar modelos");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveModel = async (model: ScriptModel): Promise<void> => {
  if (!DB_CONFIG.isConnected) throw new Error("Banco de dados desconectado.");
  
  const res = await fetch(`${API_URL}/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(model)
  });
  
  if (!res.ok) throw new Error("Erro ao salvar modelo no banco.");
};

export const deleteModel = async (id: string): Promise<void> => {
  if (!DB_CONFIG.isConnected) throw new Error("Banco de dados desconectado.");

  const res = await fetch(`${API_URL}/models/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Erro ao deletar modelo.");
};

// --- CLIENTS (Apenas via API) ---

export const getClients = async (): Promise<ClientUser[]> => {
  if (!DB_CONFIG.isConnected) return [];
  try {
    const res = await fetch(`${API_URL}/clients`);
    if (!res.ok) throw new Error("Falha ao buscar clientes");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveClient = async (client: ClientUser): Promise<void> => {
  if (!DB_CONFIG.isConnected) throw new Error("Banco de dados desconectado.");

  const res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client)
  });
  if (!res.ok) throw new Error("Erro ao salvar cliente no banco.");
};

export const deleteClient = async (id: string): Promise<void> => {
  if (!DB_CONFIG.isConnected) throw new Error("Banco de dados desconectado.");

  const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Erro ao deletar cliente.");
};

// --- HISTORY (Apenas via API) ---

export const getHistory = async (): Promise<GeneratedScript[]> => {
  if (!DB_CONFIG.isConnected) return [];
  try {
    const res = await fetch(`${API_URL}/history`);
    if (!res.ok) throw new Error("Falha ao buscar histórico");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveHistory = async (script: GeneratedScript): Promise<void> => {
  if (!DB_CONFIG.isConnected) return; // Fail silently for history log if down

  await fetch(`${API_URL}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(script)
  });
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
  if (!DB_CONFIG.isConnected) return;

  await fetch(`${API_URL}/history/${id}`, { method: 'DELETE' });
};