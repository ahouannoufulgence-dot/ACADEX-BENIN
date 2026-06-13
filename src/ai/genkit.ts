import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Le système est conçu pour être résilient aux erreurs d'initialisation.
 */

const getApiKey = () => {
  return process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
};

const apiKey = getApiKey();

// Vérification de sécurité : Les clés Gemini commencent par AIza.
export const isAiConfigured = !!(apiKey && apiKey.length > 10);
export const isStandardKey = !!(apiKey && apiKey.startsWith('AIza'));

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: isAiConfigured ? apiKey : 'MISSING_KEY' }),
  ],
});

export { googleAI };
