import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Initialisation résiliente pour éviter les erreurs de rendu Server Components.
 */

const getApiKey = () => process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export const isAiConfigured = !!(getApiKey() && getApiKey()!.length > 10);

// On initialise l'objet ai de manière à ce qu'il ne crashe pas si la clé est absente au build
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: getApiKey() }),
  ],
});

export { googleAI };
