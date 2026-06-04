'use server';
/**
 * @fileOverview A Genkit flow for generating personalized academic feedback and summary reports for students.
 *
 * - generateAcademicFeedback - A function that handles the academic feedback generation process.
 * - GenerateAcademicFeedbackInput - The input type for the generateAcademicFeedback function.
 * - GenerateAcademicFeedbackOutput - The return type for the generateAcademicFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAcademicFeedbackInputSchema = z.object({
  studentName: z.string().describe("The name of the student."),
  grades: z.array(
    z.object({
      subject: z.string().describe("The name of the subject."),
      grade: z.number().describe("The student's grade for the subject (e.g., 15 for 15/20)."),
      maxGrade: z.number().describe("The maximum possible grade for the subject, typically 20."),
    })
  ).describe("A list of grades for different subjects, including the subject name, the student's grade, and the maximum possible grade."),
  evaluationContext: z.string().optional().describe("Optional context for the evaluation, e.g., 'rapport trimestriel', 'évaluation de fin d\'année'."),
  teacherComments: z.string().optional().describe("Optional specific comments or observations from the teacher."),
  predefinedCriteria: z.string().optional().describe("Optional predefined criteria or areas for improvement, provided by the teacher."),
});
export type GenerateAcademicFeedbackInput = z.infer<typeof GenerateAcademicFeedbackInputSchema>;

const GenerateAcademicFeedbackOutputSchema = z.object({
  academicFeedback: z.string().describe("Personalized academic feedback for the student, highlighting strengths and areas for improvement."),
  summaryReport: z.string().describe("A comprehensive summary report of the student's overall academic performance."),
  recommendations: z.array(z.string()).describe("A list of specific, actionable recommendations for the student's improvement."),
});
export type GenerateAcademicFeedbackOutput = z.infer<typeof GenerateAcademicFeedbackOutputSchema>;

export async function generateAcademicFeedback(input: GenerateAcademicFeedbackInput): Promise<GenerateAcademicFeedbackOutput> {
  return generateAcademicFeedbackFlow(input);
}

const academicFeedbackPrompt = ai.definePrompt({
  name: 'academicFeedbackPrompt',
  input: { schema: GenerateAcademicFeedbackInputSchema },
  output: { schema: GenerateAcademicFeedbackOutputSchema },
  prompt: `Vous êtes un conseiller pédagogique expérimenté et professionnel, spécialisé dans l'évaluation scolaire au Bénin. Votre tâche est de générer des observations académiques personnalisées et un rapport de synthèse détaillé pour l'élève suivant, en vous basant sur ses notes et les informations fournies par l'enseignant et les critères prédéfinis.

**Informations sur l'élève :**
Nom : {{{studentName}}}

**Notes détaillées :**
{{#each grades}}
- {{{subject}}} : {{{grade}}}/{{{maxGrade}}}
{{/each}}

**Contexte de l'évaluation :**
{{#if evaluationContext}}
{{{evaluationContext}}}
{{else}}
Non spécifié. Veuillez utiliser un ton général de suivi académique.
{{/if}}

**Commentaires spécifiques de l'enseignant (si fournis) :**
{{#if teacherComments}}
{{{teacherComments}}}
{{else}}
Aucun commentaire spécifique de l'enseignant n'a été fourni.
{{/if}}

**Critères prédéfinis ou axes d'amélioration (si applicables) :**
{{#if predefinedCriteria}}
{{{predefinedCriteria}}}
{{else}}
Aucun critère prédéfini n'a été fourni.
{{/if}}


Veuillez générer des retours constructifs, professionnels, encourageants et équilibrés. Le ton doit être approprié pour un rapport scolaire destiné aux parents et aux élèves.

Le feedback doit inclure les sections suivantes, dans l'ordre :
1.  **academicFeedback**: Une observation académique personnalisée. Mettez en évidence les points forts de l'élève et identifiez clairement les domaines nécessitant une amélioration. Le langage doit être clair et compréhensible.
2.  **summaryReport**: Un rapport de synthèse global évaluant la performance générale de l'élève dans l'ensemble des matières. Incluez une appréciation générale du niveau de compétence.
3.  **recommendations**: Une liste de 3 à 5 recommandations spécifiques, actionnables et réalisables pour que l'élève puisse améliorer ses performances et développer ses compétences académiques. Ces recommandations doivent être concises.

Formatez l'intégralité de votre réponse en un objet JSON valide, strictement conforme au schéma de sortie fourni ci-dessous, sans aucun texte additionnel ou marque de mise en forme en dehors de l'objet JSON. Utilisez les descriptions du schéma pour guider la profondeur et le contenu de chaque champ.

```json
{{jsonSchema output}}
```
`,
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
      throw new Error('Failed to generate academic feedback. Output was empty.');
    }
    return output;
  }
);
