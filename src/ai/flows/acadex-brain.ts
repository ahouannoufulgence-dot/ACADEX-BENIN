'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Assistant IA avec Restriction de Sécurité par Rôle.
 * 
 * - askAcadexBrain - Fonction principale d'interrogation.
 * - BrainInput - Schéma d'entrée sécurisé.
 */

import { ai, googleAI, isAiConfigured } from '@/ai/genkit';
import { z } from 'genkit';

const BrainInputSchema = z.object({
  question: z.string().describe("La question de l'utilisateur sur l'école."),
  userRole: z.enum(["Directeur", "Enseignant", "Élève"]).describe("Le rôle vérifié de l'utilisateur."),
  userId: z.string().describe("L'identifiant de l'utilisateur."),
  contextData: z.any().optional().describe("Données de contexte filtrées selon le rôle."),
});

const BrainOutputSchema = z.object({
  answer: z.string().describe("La réponse de l'IA, filtrée selon les permissions."),
  suggestions: z.array(z.string()).describe("Suggestions de questions contextuelles."),
  securityAlert: z.boolean().optional().describe("Indique si l'utilisateur a tenté d'accéder à des données interdites."),
});

export type BrainInput = z.infer<typeof BrainInputSchema>;
export type BrainOutput = z.infer<typeof BrainOutputSchema>;

export async function askAcadexBrain(input: BrainInput): Promise<BrainOutput> {
  if (!isAiConfigured) {
    throw new Error("MISSING_API_KEY: Le module IA n'est pas configuré sur ce serveur.");
  }
  return acadexBrainFlow(input);
}

const acadexBrainPrompt = ai.definePrompt({
  name: 'acadexBrainPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: { schema: BrainInputSchema },
  output: { schema: BrainOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `Vous êtes le "Cerveau ACADEX", l'intelligence centrale de gestion scolaire pour l'établissement "{{contextData.schoolName}}".

**PROTOCOLE DE SÉCURITÉ CRITIQUE :**
Votre réponse doit être STRICTEMENT limitée par le rôle de l'utilisateur : {{userRole}}.

1. SI RÔLE = "Directeur" (Espace Pilotage) :
   - Vous avez accès à TOUT : trésorerie, notes globales, assiduité profs, dossiers élèves.
   - Ton : Analytique, stratégique et professionnel.

2. SI RÔLE = "Enseignant" (Espace Pédagogique) :
   - Vous ne répondez QUE sur ses matières et ses élèves.
   - INTERDICTION ABSOLUE : de parler d'argent (écolages) ou des salaires.

3. SI RÔLE = "Élève" (Espace Réussite) :
   - Vous ne répondez QUE sur SES PROPRES DONNÉES.
   - Ton : Encourageant, motivant, comme un coach personnel.

**CONTEXTE :**
{{{json contextData}}}

**QUESTION :**
{{{question}}}

Répondez en français. Ne jamais inventer de données.`,
});

const acadexBrainFlow = ai.defineFlow(
  {
    name: 'acadexBrainFlow',
    inputSchema: BrainInputSchema,
    outputSchema: BrainOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await acadexBrainPrompt(input);
      if (!output) throw new Error('Le Cerveau ACADEX est resté silencieux.');
      return output;
    } catch (error: any) {
      console.error("--- ERREUR FLOW BRAIN ---", error.message);
      throw new Error(`Le cerveau ACADEX a rencontré une difficulté : ${error.message}`);
    }
  }
);
