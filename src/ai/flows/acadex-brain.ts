'use server';
/**
 * @fileOverview Le Cerveau ACADEX - Propulsé par Groq Llama 3.3
 * Analyse directe et profonde des données scolaires avec humanisation des prompts.
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

  // Transformation des données JSON en phrases naturelles pour l'IA
  let dataNarrative = "";
  
  if (userRole === 'Élève') {
    const grades = Object.entries(contextData?.moyennes || {})
      .map(([s, v]) => `en ${s} il a ${v}/20`)
      .join(', ');
    const absences = (contextData?.historiqueVieScolaire || []).length;
    dataNarrative = `Tu parles à l'élève ${contextData?.nom || 'l\'élève'}. Voici ses résultats réels ce trimestre : ${grades || 'aucune note saisie'}. Sa moyenne générale calculée est de ${contextData?.moyenneGenerale || '0.00'}/20. Il a ${absences} incidents enregistrés dans son carnet de vie scolaire.`;
  } else if (userRole === 'Directeur') {
    const promos = Object.entries(contextData?.moyennesParPromotion || {})
      .map(([p, v]) => `${p} (${v}/20)`)
      .join(', ');
    dataNarrative = `L'établissement compte actuellement ${contextData?.effectifTotal || 0} élèves. Les moyennes actuelles par promotion sont les suivantes : ${promos || 'non encore calculées'}. Le total des recettes de scolarité s'élève à ${contextData?.totalRecettes || 0} FCFA. Le taux de réussite global estimé pour l'école est de ${contextData?.tauxReussiteGlobalEstimation || '0%'}.`;
  } else if (userRole === 'Enseignant') {
    const classAvgs = (contextData?.moyenneParClasse || [])
      .map((c: any) => `${c.classe} (${c.moyenne}/20)`)
      .join(', ');
    dataNarrative = `Tu es le professeur de ${contextData?.matiere || 'votre discipline'}. Tu as la charge des classes ${contextData?.mesClasses?.join(', ') || 'aucune'}. Tu as déjà saisi ${contextData?.nombreNotesSaisies || 0} notes ce trimestre. Les moyennes actuelles de tes classes sont : ${classAvgs || 'pas encore de moyenne'}.`;
  }

  const systemPrompt = `Tu es le Cerveau ACADEX, l'intelligence centrale de cet établissement scolaire. 
  Ton tempérament est celui d'un professeur de collège extrêmement bienveillant, sage et précis.
  
  CONSIGNES DE RÉDACTION (STRICTES) :
  - Tu parles DIRECTEMENT à l'utilisateur (${userRole}).
  - Utilise uniquement des paragraphes de texte fluide et naturel.
  - INTERDICTION STRICTE d'utiliser des emojis.
  - INTERDICTION STRICTE de faire des listes à puces ou des énumérations.
  - INTERDICTION STRICTE d'utiliser des formules mathématiques complexes ou des notations JSON.
  - Ne donne pas de réponses trop longues, sois concis et inspirant.
  
  CONTEXTE RÉEL DE L'ÉTABLISSEMENT :
  ${dataNarrative}
  
  RÉPONDS À LA QUESTION EN UTILISANT EXCLUSIVEMENT LES DONNÉES CI-DESSUS POUR JUSTIFIER TES PROPOS. SI TU N'AS PAS DE DONNÉES, EXPLIQUE-LE AVEC BIENVEILLANCE.`;

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
