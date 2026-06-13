'use server';
/**
 * @fileOverview Le Cerveau ACADEX - Propulsé par Groq Llama 3.3
 * Analyse directe et profonde des données scolaires.
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

  // Configuration du tempérament de l'IA : Professeur/Analyste Bienveillant
  const systemPrompt = `Tu es le Cerveau ACADEX, l'intelligence centrale de cet établissement scolaire. 
  Ton tempérament est celui d'un professeur de collège extrêmement bienveillant, sage et précis.
  
  CONSIGNES DE RÉDACTION (STRICTES) :
  - Utilise uniquement des paragraphes de texte fluide et naturel.
  - INTERDICTION STRICTE d'utiliser des emojis.
  - INTERDICTION STRICTE de faire des listes à puces ou des énumérations.
  - Ne donne pas de réponses trop longues, sois concis et inspirant.
  - Si tu analyses des chiffres, intègre-les dans tes phrases de manière naturelle.
  
  CONTEXTE DE L'APPLICATION (Données réelles et certifiées) :
  L'utilisateur actuel a le rôle de : ${userRole}.
  
  DONNÉES DISPONIBLES POUR L'ANALYSE :
  ${JSON.stringify(contextData || "Aucune donnée n'a pu être extraite pour le moment.")}
  
  INSTRUCTIONS SELON LE RÔLE :
  - Si tu parles au DIRECTEUR : Analyse les performances globales, la trésorerie et le rayonnement de l'école. Sois un conseiller stratégique.
  - Si tu parles à l'ENSEIGNANT : Analyse les résultats de ses classes et propose des méthodes pédagogiques.
  - Si tu parles à l'ÉLÈVE : Analyse ses notes personnelles, encourage-le et propose des axes d'amélioration précis en fonction de ses moyennes par matière.
  
  Réponds à la question suivante en utilisant exclusivement les données ci-dessus pour justifier tes propos.`;

  const response = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);

  return {
    answer: response,
    suggestions: userRole === 'Directeur' 
      ? ["Bilan de la trésorerie", "Classe la plus performante", "Taux de réussite global"]
      : userRole === 'Enseignant'
      ? ["Analyse mes classes", "Conseils pédagogiques", "Élèves en difficulté"]
      : ["Comment m'améliorer ?", "Mon point fort", "Bilan de mes absences"]
  };
}
