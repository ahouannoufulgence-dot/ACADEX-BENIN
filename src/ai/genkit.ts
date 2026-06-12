import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Version optimisée pour le déploiement Cloud et les performances mobiles.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('--- ALERTE ACADEX --- : Aucune clé API Google AI détectée dans les variables d\'environnement.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
});

export { googleAI };
