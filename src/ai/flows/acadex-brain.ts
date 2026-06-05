
'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Assistant IA interne spécialisé.
 * 
 * Ce module gère les requêtes complexes sur les données de l'école.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BrainInputSchema = z.object({
  question: z.string().describe("La question de l'utilisateur sur l'école."),
  userRole: z.string().describe("Le rôle de l'utilisateur (Directeur, Enseignant, Elève)."),
  userId: z.string().describe("L'identifiant de l'utilisateur."),
  contextData: z.any().optional().describe("Données de contexte actuelles pour éviter les chargements massifs."),
});

const BrainOutputSchema = z.object({
  answer: z.string().describe("La réponse détaillée de l'IA."),
  suggestions: z.array(z.string()).describe("Suggestions de questions suivantes."),
  dataSnapshot: z.any().optional().describe("Données clés extraites pour affichage."),
});

export type BrainInput = z.infer<typeof BrainInputSchema>;
export type BrainOutput = z.infer<typeof BrainOutputSchema>;

export async function askAcadexBrain(input: BrainInput): Promise<BrainOutput> {
  return acadexBrainFlow(input);
}

const acadexBrainPrompt = ai.definePrompt({
  name: 'acadexBrainPrompt',
  input: { schema: BrainInputSchema },
  output: { schema: BrainOutputSchema },
  prompt: `Vous êtes le "Cerveau ACADEX", l'intelligence centrale de gestion scolaire.
Votre mission est d'assister la direction, les enseignants et les élèves en analysant les données internes.

**LIMITES STRICTES :**
- Vous ne connaissez PAS le web, Google, ou le monde extérieur.
- Vous ne répondez PAS aux questions de sport (football), politique, culture générale ou divertissement.
- Si une question sort du cadre scolaire, répondez : "Je suis l'assistant ACADEX. Je peux répondre uniquement aux informations liées à votre établissement."
- Respectez le rôle de l'utilisateur : {{userRole}}.

**DONNÉES DISPONIBLES (CONTEXTE) :**
{{{json contextData}}}

**QUESTION :**
{{{question}}}

**INSTRUCTIONS DE RÉPONSE :**
1. Soyez précis, professionnel et direct.
2. Si des données manquent dans le contexte, signalez-le poliment.
3. Donnez des analyses sur la ponctualité, les notes, les paiements ou les effectifs.
4. Formatez votre réponse en JSON valide.`,
});

const acadexBrainFlow = ai.defineFlow(
  {
    name: 'acadexBrainFlow',
    inputSchema: BrainInputSchema,
    outputSchema: BrainOutputSchema,
  },
  async (input) => {
    const { output } = await acadexBrainPrompt(input);
    if (!output) throw new Error('Le Cerveau ACADEX n\'a pas pu répondre.');
    return output;
  }
);
