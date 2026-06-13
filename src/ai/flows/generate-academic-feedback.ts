'use server';
/**
 * @fileOverview Flux Genkit pour la génération de feedbacks académiques personnalisés.
 */

import { ai, googleAI, isStandardKey } from '@/ai/genkit';
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
  error: z.string().optional().describe("Erreur éventuelle."),
});

export type GenerateAcademicFeedbackOutput = z.infer<typeof GenerateAcademicFeedbackOutputSchema>;

export async function generateAcademicFeedback(input: GenerateAcademicFeedbackInput): Promise<GenerateAcademicFeedbackOutput> {
  if (!isStandardKey) {
    return {
      academicFeedback: "",
      summaryReport: "",
      recommendations: [],
      error: "Clé API invalide pour l'analyse."
    };
  }
  return generateAcademicFeedbackFlow(input);
}

const academicFeedbackPrompt = ai.definePrompt({
  name: 'academicFeedbackPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: GenerateAcademicFeedbackInputSchema },
  output: { schema: GenerateAcademicFeedbackOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `Vous êtes le Conseiller Pédagogique Expert d'ACADEX. Analysez les résultats de {{{studentName}}}.

**RESULTATS :**
{{#each grades}}
- {{{subject}}} : {{{grade}}}/{{{maxGrade}}}
{{/each}}

Produisez une analyse motivante et 3 conseils spécifiques.`,
});

const generateAcademicFeedbackFlow = ai.defineFlow(
  {
    name: 'generateAcademicFeedbackFlow',
    inputSchema: GenerateAcademicFeedbackInputSchema,
    outputSchema: GenerateAcademicFeedbackOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await academicFeedbackPrompt(input);
      if (!output) throw new Error('Échec génération feedback.');
      return output;
    } catch (error: any) {
      console.error("--- ERREUR GEMINI FEEDBACK ---", error.message);
      return {
        academicFeedback: "",
        summaryReport: "",
        recommendations: [],
        error: error.message
      };
    }
  }
);
