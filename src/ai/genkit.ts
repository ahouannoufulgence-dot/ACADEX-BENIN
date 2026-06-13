import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Le système vérifie impérativement le préfixe 'AIza' pour garantir la validité de la clé Gemini.
 */

const getApiKey = () => {
  return process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
};

const apiKey = getApiKey();

// Une clé Gemini valide commence TOUJOURS par AIza
export const isAiConfigured = !!(apiKey && apiKey.startsWith('AIza'));

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: isAiConfigured ? apiKey : 'INVALID_KEY_MUST_START_WITH_AIza' }),
  ],
});

export { googleAI };
