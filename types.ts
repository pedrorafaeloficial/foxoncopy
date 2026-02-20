export interface ScriptModelField {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  type: 'text' | 'textarea';
}

export interface ScriptModel {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  promptTemplate?: string; // Template copiável para o cliente (ex: "TEMA: []...")
  fields?: ScriptModelField[]; // Novos campos dinâmicos
  icon: string; // e.g., 'video', 'star', 'trending'
}

export interface ClientUser {
  id: string;
  fullName: string;
  companyName?: string;
  username: string;
  password: string; // In production, this should be hashed
  createdAt: number;
}

export interface GeneratedScript {
  id: string;
  content: string;
  timestamp: number;
  modelName: string;
  topic: string;
}

export type ViewState = 'LANDING' | 'LOGIN' | 'ADMIN_DASHBOARD' | 'CLIENT_DASHBOARD' | 'CLIENT_GENERATOR';

export interface UserInput {
  topic: string;
  tone: string;
  additionalInfo: string;
  dynamicFields?: Record<string, string>;
}