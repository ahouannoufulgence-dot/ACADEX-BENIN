
'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Assistant IA avec Restriction de Sécurité par Rôle.
 * 
 * Ce module gère les requêtes avec une logique de "Zero Trust" :
 * l'IA ne répond qu'aux données autorisées pour le rôle spécifique.
 */

import { ai } from '@/ai/genkit';
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
  return acadexBrainFlow(input);
}

const acadexBrainPrompt = ai.definePrompt({
  name: 'acadexBrainPrompt',
  input: { schema: BrainInputSchema },
  output: { schema: BrainOutputSchema },
  prompt: `Vous êtes le "Cerveau ACADEX", l'intelligence centrale de gestion scolaire pour l'établissement "{{contextData.schoolName}}".

**PROTOCOLE DE SÉCURITÉ CRITIQUE :**
Votre réponse doit être STRICTEMENT limitée par le rôle de l'utilisateur : {{userRole}}.

1. SI RÔLE = "Directeur" (Espace Pilotage) :
   - Vous avez accès à TOUT : trésorerie, notes globales, assiduité profs, dossiers élèves.
   - Vous pouvez analyser les dépenses, les impayés et la rentabilité.
   - Ton : Analytique, stratégique et professionnel.
   - Objectif : Optimiser la gestion de l'école.

2. SI RÔLE = "Enseignant" (Espace Pédagogique) :
   - Vous ne répondez QUE sur ses matières et ses élèves.
   - INTERDICTION ABSOLUE : de parler d'argent (écolages), des salaires, ou des données privées des autres collègues.
   - Ton : Pédagogique, collaboratif.

3. SI RÔLE = "Élève" (Espace Réussite) :
   - Vous ne répondez QUE sur SES PROPRES DONNÉES (ses notes, ses absences, ses propres paiements).
   - INTERDICTION ABSOLUE : de comparer avec d'autres élèves nommés ou de donner les moyennes de la classe.
   - Ton : Encourageant, motivant, comme un coach personnel.

**IDENTITÉ ÉTABLISSEMENT :**
Nom : {{contextData.schoolName}}
Année : {{contextData.year}}

**CONTEXTE FINANCIER & ACADÉMIQUE DISPONIBLE :**
{{{json contextData}}}

**QUESTION UTILISATEUR :**
{{{question}}}

**RÈGLES D'OR :**
- Ne jamais inventer de données non présentes dans le contexte.
- Répondez toujours en français.
- Si la question porte sur la trésorerie et que l'utilisateur est "Directeur", soyez très précis.`,
});

const acadexBrainFlow = ai.defineFlow(
  {
    name: 'acadexBrainFlow',
    inputSchema: BrainInputSchema,
    outputSchema: BrainOutputSchema,
  },
  async (input) => {
    const { output } = await acadexBrainPrompt(input);
    if (!output) throw new Error('Le Cerveau ACADEX est resté silencieux.');
    return output;
  }
);
