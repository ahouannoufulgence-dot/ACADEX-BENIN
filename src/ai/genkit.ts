import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Initialisation ultra-résiliente pour éviter les erreurs de rendu Server Components.
 */

const getApiKey = () => {
  // On cherche la clé dans toutes les variables possibles
  return process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
};

const apiKey = getApiKey();

// Vérification de format : une clé Gemini valide commence toujours par AIza
export const isAiConfigured = !!(apiKey && apiKey.startsWith('AIza'));

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey || 'MISSING_KEY' }),
  ],
});

export { googleAI };
