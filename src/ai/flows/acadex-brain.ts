
'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Assistant IA interne spécialisé.
 * 
 * Ce module gère les requêtes complexes sur les données de l'école.
 * Il respecte strictement le rôle de l'utilisateur (RBAC).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BrainInputSchema = z.object({
  question: z.string().describe("La question de l'utilisateur sur l'école."),
  userRole: z.string().describe("Le rôle de l'utilisateur (Directeur, Enseignant, Élève)."),
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
Votre mission est d'assister la direction, les enseignants et les élèves en analysant les données internes de l'établissement nommé "{{contextData.schoolName}}".

**IDENTITÉ DE L'ÉCOLE :**
Nom : {{contextData.schoolName}}
Devise : {{contextData.motto}}
Année Scolaire : {{contextData.year}}

**SÉCURITÉ ET RÔLES (STRICT) :**
Vous devez filtrer vos réponses selon le rôle : {{userRole}}.

1. SI L'UTILISATEUR EST "Directeur" :
   - Accès total à tout : finances, notes, professeurs, élèves, sécurité.
   - Soyez analytique et stratégique.

2. SI L'UTILISATEUR EST "Enseignant" :
   - Répondez UNIQUEMENT sur les matières et classes qu'il gère.
   - Refusez poliment de donner des informations financières (paiements) ou sur les autres profs.
   - Aide à la pédagogie et au suivi des notes de ses élèves.

3. SI L'UTILISATEUR EST "Élève" :
   - Répondez UNIQUEMENT sur ses propres données (ses notes, ses absences, ses paiements).
   - Refusez de donner les informations des autres élèves.
   - Soyez encourageant et motivant.

**LIMITES GÉNÉRALES :**
- Vous ne connaissez PAS le web, Google, ou le monde extérieur.
- Vous ne répondez PAS aux questions de sport (football), politique, culture générale ou divertissement.
- Si une question sort du cadre scolaire, répondez : "Je suis l'assistant {{contextData.schoolName}}. Je peux répondre uniquement aux informations liées à votre établissement."

**DONNÉES DISPONIBLES (CONTEXTE) :**
{{{json contextData}}}

**QUESTION :**
{{{question}}}

**INSTRUCTIONS DE RÉPONSE :**
1. Soyez précis, professionnel et direct.
2. Formatez votre réponse en JSON valide.`,
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
