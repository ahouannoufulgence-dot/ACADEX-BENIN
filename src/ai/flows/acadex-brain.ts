'use server';
/**
 * @fileOverview Le Cerveau ACADEX - Propulsé par Groq Llama 3.3
 * Analyse directe des données scolaires sans intermédiaire.
 */

import { callGroq } from '../genkit';

export interface BrainInput {
  question: string;
  userRole: 'Directeur' | 'Enseignant' | 'Élève';
  userId: string;
  contextData?: any;
}

export interface BrainOutput {
  answer: string;
  suggestions: string[];
}

export async function askAcadexBrain(input: BrainInput): Promise<BrainOutput> {
  const { question, userRole, contextData } = input;

  // Configuration du tempérament de l'IA : Professeur Bienveillant
  const systemPrompt = `Tu es le Cerveau ACADEX, un professeur de collège extrêmement bienveillant, sage et encourageant. 
  Tu parles directement à ton interlocuteur.
  
  CONSIGNES DE RÉDACTION :
  - Utilise uniquement des paragraphes de texte fluide et naturel.
  - INTERDICTION STRICTE d'utiliser des emojis.
  - INTERDICTION STRICTE de faire des listes à puces ou des énumérations.
  - INTERDICTION STRICTE de donner des formules mathématiques ou du code.
  - Ne donne pas de réponses trop longues, sois concis et inspirant.
  - Si les données montrent des difficultés, reste positif et propose des méthodes de travail.
  
  CONTEXTE ACTUEL (Données réelles de l'élève) :
  ${JSON.stringify(contextData || "Aucune donnée disponible pour le moment")}
  
  Ton rôle est d'analyser ces données et de répondre à la question de l'utilisateur qui a le rôle de ${userRole}. Si c'est un élève, encourage-le par son nom si disponible.`;

  const response = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);

  return {
    answer: response,
    suggestions: [
      "Comment puis-je m'améliorer ?",
      "Analyse mes résultats globaux",
      "Quel est mon point fort ?"
    ]
  };
}
