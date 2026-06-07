'use server';
/**
 * @fileOverview Flux Genkit pour la génération de feedbacks académiques personnalisés.
 *
 * - generateAcademicFeedback - Analyse les notes et produit un rapport détaillé.
 * - GenerateAcademicFeedbackInput - Schéma d'entrée (Nom, Notes, Contexte).
 * - GenerateAcademicFeedbackOutput - Schéma de sortie (Observation, Synthèse, Actions).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAcademicFeedbackInputSchema = z.object({
  studentName: z.string().describe("Le nom complet de l'élève."),
  grades: z.array(
    z.object({
      subject: z.string().describe("La matière."),
      grade: z.number().describe("La moyenne de l'élève."),
      maxGrade: z.number().describe("La note maximale (souvent 20)."),
    })
  ).describe("Liste des moyennes par matière."),
  evaluationContext: z.string().optional().describe("Contexte de l'évaluation."),
  teacherComments: z.string().optional().describe("Commentaires éventuels du professeur."),
});

export type GenerateAcademicFeedbackInput = z.infer<typeof GenerateAcademicFeedbackInputSchema>;

const GenerateAcademicFeedbackOutputSchema = z.object({
  academicFeedback: z.string().describe("Observation pédagogique globale et encourageante."),
  summaryReport: z.string().describe("Synthèse de la performance par bloc de compétences."),
  recommendations: z.array(z.string()).describe("Liste de 3 recommandations concrètes pour progresser."),
});

export type GenerateAcademicFeedbackOutput = z.infer<typeof GenerateAcademicFeedbackOutputSchema>;

export async function generateAcademicFeedback(input: GenerateAcademicFeedbackInput): Promise<GenerateAcademicFeedbackOutput> {
  return generateAcademicFeedbackFlow(input);
}

const academicFeedbackPrompt = ai.definePrompt({
  name: 'academicFeedbackPrompt',
  input: { schema: GenerateAcademicFeedbackInputSchema },
  output: { schema: GenerateAcademicFeedbackOutputSchema },
  prompt: `Vous êtes le Conseiller Pédagogique Expert d'ACADEX Bénin. Votre mission est d'analyser les résultats réels de l'élève {{{studentName}}} pour l'orienter vers l'excellence.

**RESULTATS RÉELS :**
{{#each grades}}
- {{{subject}}} : {{{grade}}}/{{{maxGrade}}}
{{/each}}

**CONTEXTE :**
{{{evaluationContext}}}

**REMARQUES ENSEIGNANT :**
{{{teacherComments}}}

**VOTRE ANALYSE :**
1. Identifiez les matières où l'élève excelle.
2. Repérez les zones de fragilité (moyenne < 10).
3. Produisez une observation motivante, professionnelle et constructive.
4. Donnez 3 conseils ultra-spécifiques pour la période suivante.

Répondez uniquement avec l'objet structuré selon le schéma de sortie.`,
});

const generateAcademicFeedbackFlow = ai.defineFlow(
  {
    name: 'generateAcademicFeedbackFlow',
    inputSchema: GenerateAcademicFeedbackInputSchema,
    outputSchema: GenerateAcademicFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await academicFeedbackPrompt(input);
    if (!output) {
      throw new Error('Le moteur IA ACADEX n\'a pas pu générer de réponse.');
    }
    return output;
  }
);
