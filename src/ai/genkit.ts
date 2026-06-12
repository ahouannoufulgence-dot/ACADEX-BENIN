import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuration centrale de Genkit pour ACADEX.
 * Supporte les variables d'environnement Vercel standard.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn("--- ALERTE ACADEX IA ---");
  console.warn("Aucune clé API Gemini n'a été détectée. Vérifiez vos variables d'environnement en production.");
  console.warn("Noms testés: GOOGLE_GENAI_API_KEY, GOOGLE_API_KEY, GEMINI_API_KEY");
  console.warn("------------------------");
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
