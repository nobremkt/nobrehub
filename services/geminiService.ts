
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analisa o score do lead com base em dados cadastrais e histórico.
 * Útil para priorização automática no Kanban.
 */
export const analyzeLeadScore = async (contactInfo: string, lastMessages: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `CONTEXTO DO LEAD:
      DADOS: ${contactInfo}
      ÚLTIMAS MENSAGENS: ${lastMessages}
      
      TAREFAS:
      1. Pontue de 0 a 100 o potencial de fechamento.
      2. Explique brevemente o motivo em português.
      
      REGRAS: Retorne estritamente JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Pontuação de 0 a 100" },
            reasoning: { type: Type.STRING, description: "Razão da nota em português (máx 100 caracteres)" }
          },
          required: ["score", "reasoning"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro no scoring do lead:", error);
    return { score: 50, reasoning: "IA indisponível no momento." };
  }
};

/**
 * Gera sugestões de resposta contextualizadas.
 * Implementa a persona de 'Vendedor Premium'.
 */
export const generateAIReply = async (history: string, language: string = 'pt-BR') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history,
      config: {
        systemInstruction: `Você é o Atendente Virtual da Nobre Marketing. 
        PERSONA: Profissional, persuasivo, educado e focado em converter o lead.
        IDIOMA: Responda sempre em ${language}.
        REGRAS: Use emojis de forma moderada e profissional. Não invente informações que não estão no histórico.`,
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Erro na resposta da IA:", error);
    return "Olá! Como posso ajudar você hoje?";
  }
};

/**
 * Gera resumos executivos para dashboards de Analytics.
 */
export const getAnalyticsSummary = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise os seguintes dados de performance de vendas e forneça um insight estratégico curto em Português: ${JSON.stringify(stats)}`,
      config: {
        systemInstruction: "Você é um Consultor de Growth Marketing. Forneça insights baseados em dados.",
      }
    });
    return response.text;
  } catch (error) {
    return "As métricas indicam crescimento estável. Foque na retenção de leads qualificados.";
  }
};
