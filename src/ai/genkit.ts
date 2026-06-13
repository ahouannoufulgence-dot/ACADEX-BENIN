import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Supporte la détection multi-clés pour Vercel et local.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Indicateur de configuration (min 20 chars pour une clé valide)
export const isAiConfigured = !!(apiKey && apiKey.length > 10);

if (!isAiConfigured) {
  console.warn('--- ALERTE ACADEX --- : IA non configurée. Vérifiez GOOGLE_GENAI_API_KEY.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
});

export { googleAI };
