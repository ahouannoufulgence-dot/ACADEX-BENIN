'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Assistant IA avec Restriction de Sécurité par Rôle.
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
    throw new Error("MISSING_API_KEY");
  }
  return acadexBrainFlow(input);
}

const acadexBrainPrompt = ai.definePrompt({
  name: 'acadexBrainPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { 
    schema: z.object({
      question: z.string(),
      userRole: z.string(),
      schoolName: z.string(),
      contextString: z.string(),
    })
  },
  output: { schema: BrainOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `Vous êtes le "Cerveau ACADEX", l'intelligence centrale de gestion scolaire pour l'établissement "{{schoolName}}".

**PROTOCOLE DE SÉCURITÉ :**
Votre réponse doit être STRICTEMENT limitée par le rôle de l'utilisateur : {{userRole}}.

1. SI RÔLE = "Directeur" : Accès total (trésorerie, notes, effectifs). Ton analytique et stratégique.
2. SI RÔLE = "Enseignant" : Uniquement ses matières et élèves. INTERDICTION de parler d'argent.
3. SI RÔLE = "Élève" : Uniquement SES PROPRES DONNÉES. Ton coach motivant et bienveillant.

**DONNÉES DE CONTEXTE RÉELLES :**
{{{contextString}}}

**QUESTION DE L'UTILISATEUR :**
{{{question}}}

Répondez en français de manière concise et précise. Ne jamais inventer de données qui ne sont pas dans le contexte.`,
});

const acadexBrainFlow = ai.defineFlow(
  {
    name: 'acadexBrainFlow',
    inputSchema: BrainInputSchema,
    outputSchema: BrainOutputSchema,
  },
  async (input) => {
    try {
      // Transformation du contexte JSON en string pour éviter les erreurs Handlebars
      const contextString = JSON.stringify(input.contextData || {}, null, 2);
      
      const { output } = await acadexBrainPrompt({
        question: input.question,
        userRole: input.userRole,
        schoolName: input.contextData?.schoolName || "ACADEX",
        contextString: contextString
      });

      if (!output) throw new Error('DÉFAUT_RÉPONSE_IA');
      return output;
    } catch (error: any) {
      console.error("--- ERREUR CRITIQUE CERVEAU ---", error.message);
      throw new Error(`SERVER_AI_ERROR: ${error.message}`);
    }
  }
);
