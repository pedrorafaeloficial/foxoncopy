import { GoogleGenAI } from "@google/genai";
import { ScriptModel, UserInput } from '../types';

// Initialize Gemini Client
// Verificamos a chave apenas na chamada para permitir carregamento da página mesmo sem chave configurada (para debug)
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("ERRO CRÍTICO: process.env.API_KEY não está definido. Verifique suas variáveis de ambiente.");
    throw new Error("Chave de API não configurada no sistema.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateScript = async (model: ScriptModel, input: UserInput): Promise<string> => {
  try {
    const ai = getAiClient();

    let prompt = '';

    // Build prompt from dynamic fields if available
    if (model.fields && model.fields.length > 0 && input.dynamicFields) {
      prompt += "DETALHES DO PEDIDO:\n\n";
      model.fields.forEach(field => {
        const value = input.dynamicFields?.[field.id] || 'Não informado';
        prompt += `${field.label}: ${value}\n`;
      });
    } else {
      // Fallback to legacy topic
      prompt += `Tópico/Contexto: ${input.topic}\n`;
    }

    // Add common fields
    // prompt += `\nTom Desejado: ${input.tone}\n`; // Removed per user request
    // if (input.additionalInfo) {
    //   prompt += `Detalhes Adicionais: ${input.additionalInfo}\n`;
    // }

    prompt += `\nPor favor, escreva um roteiro completo de vídeo curto (Shorts/Reels) em PORTUGUÊS baseado nas instruções do sistema fornecidas.`;

    console.log(`[Gemini] Gerando roteiro com modelo: gemini-3-flash-preview`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: model.systemInstruction,
        temperature: 0.7, // Ajustado para ser criativo mas coerente
      },
      contents: prompt,
    });

    if (!response.text) {
      console.warn("[Gemini] Resposta vazia recebida.", response);
      return "A IA não retornou texto. O conteúdo pode ter sido bloqueado por filtros de segurança ou o modelo está sobrecarregado.";
    }

    return response.text;

  } catch (error: any) {
    console.error("Erro detalhado na API Gemini:", error);
    
    let userMessage = "Falha ao gerar o roteiro.";

    // Tenta extrair mensagens de erro comuns da API do Google
    if (error.message) {
      if (error.message.includes('API key')) {
        userMessage = "Erro de Autenticação: Chave de API inválida ou ausente.";
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        userMessage = "Erro 404: O modelo 'gemini-3-flash-preview' não está disponível para sua chave de API.";
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        userMessage = "Erro 429: Cota de uso da API excedida. Tente novamente mais tarde.";
      } else if (error.message.includes('SAFETY')) {
        userMessage = "Bloqueio de Segurança: O tópico solicitado violou as diretrizes da IA.";
      } else {
        userMessage = `Erro na IA: ${error.message}`;
      }
    }

    throw new Error(userMessage);
  }
};