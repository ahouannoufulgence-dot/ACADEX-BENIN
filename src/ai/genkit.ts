import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Cette version est optimisée pour le déploiement Serverless (Vercel).
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Indicateur de configuration pour l'interface utilisateur
export const isAiConfigured = !!(apiKey && apiKey.length > 10);

if (!isAiConfigured && process.env.NODE_ENV === 'production') {
  console.error('--- ALERTE ACADEX --- : Aucune clé API Google AI détectée en production. Le module IA est désactivé.');
}

// Initialisation sécurisée : on ne charge le plugin que si la clé est présente
export const ai = genkit({
  plugins: isAiConfigured ? [
    googleAI({ apiKey }),
  ] : [],
});

export { googleAI };
