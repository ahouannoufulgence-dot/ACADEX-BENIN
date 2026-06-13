import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Supporte la détection multi-clés pour Vercel et le local.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Indicateur de configuration pour l'interface utilisateur (min 20 chars pour une clé valide)
export const isAiConfigured = !!(apiKey && apiKey.length > 10);

if (isAiConfigured) {
  console.log('--- ACADEX AI --- : Module IA configuré et prêt.');
} else {
  console.warn('--- ALERTE ACADEX --- : Aucune clé API valide détectée.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
});

export { googleAI };
