import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Supporte plusieurs variantes de noms pour les variables d'environnement.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Indicateur de configuration pour les flows
export const isAiConfigured = !!apiKey;

if (!apiKey) {
  console.error('--- ERREUR CRITIQUE ACADEX --- : Aucune clé API Google AI (GOOGLE_GENAI_API_KEY) détectée.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
});

export { googleAI };
