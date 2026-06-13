import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Optimisée pour le déploiement local et la production (Vercel).
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Indicateur de configuration pour l'interface utilisateur
export const isAiConfigured = !!(apiKey && apiKey.length > 5);

if (isAiConfigured) {
  console.log('--- ACADEX AI --- : Module IA configuré et prêt.');
} else if (process.env.NODE_ENV === 'production') {
  console.error('--- ALERTE ACADEX --- : Aucune clé API détectée. Le module IA est désactivé.');
}

// Initialisation sécurisée
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey || 'dummy-key-to-avoid-crash' }),
  ],
});

export { googleAI };
