'use server';
/**
 * @fileOverview Le Cerveau ACADEX - Propulsé par Groq Llama 3.3
 * Analyse directe et profonde des données scolaires avec une posture professorale Premium.
 * Pas d'emojis, pas de listes, texte pur et fluide.
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
      .map(([s, v]) => `en ${s} il a obtenu ${v} sur 20`)
      .join(', ');
    const absences = (contextData?.historiqueVieScolaire || []).length;
    dataNarrative = `Tu parles à l'élève nommé ${contextData?.nom || 'l\'élève'}. Voici ses résultats académiques certifiés pour ce trimestre : ${grades || 'aucune note n\'est encore scellée'}. Sa moyenne générale consolidée s'élève à ${contextData?.moyenneGenerale || '0.00'} sur 20. Concernant sa vie scolaire, nous avons enregistré ${absences} incidents ou événements dans son carnet.`;
  } else if (userRole === 'Directeur') {
    const promos = Object.entries(contextData?.moyennesParPromotion || {})
      .map(([p, v]) => `la promotion ${p} affiche une moyenne de ${v} sur 20`)
      .join(', ');
    dataNarrative = `Monsieur le Directeur, l'établissement compte actuellement un effectif de ${contextData?.effectifTotal || 0} élèves actifs. L'analyse des performances par promotion révèle que ${promos || 'les moyennes ne sont pas encore consolidées'}. Sur le plan financier, le total des recettes de scolarité perçues s'élève à ${contextData?.totalRecettes || 0} FCFA. Enfin, le taux de réussite global estimé pour l'école est de ${contextData?.tauxReussiteGlobalEstimation || '0%'}.`;
  } else if (userRole === 'Enseignant') {
    const classAvgs = (contextData?.moyenneParClasse || [])
      .map((c: any) => `la classe ${c.classe} possède une moyenne de ${c.moyenne} sur 20`)
      .join(', ');
    dataNarrative = `Monsieur le professeur de ${contextData?.matiere || 'votre discipline'}, vous avez la responsabilité pédagogique des classes suivantes : ${contextData?.mesClasses?.join(', ') || 'aucune classe assignée'}. À ce jour, vous avez scellé ${contextData?.nombreNotesSaisies || 0} notes dans le registre numérique. Les performances actuelles de vos groupes sont les suivantes : ${classAvgs || 'aucune moyenne n\'est encore calculable'}.`;
  }

  const systemPrompt = `Tu es le Cerveau ACADEX, l'intelligence supérieure de cet établissement scolaire d'élite. 
  Ton tempérament est celui d'un doyen d'université ou d'un professeur de collège extrêmement sage, bienveillant et d'une grande rigueur intellectuelle.
  
  CONSIGNES DE RÉDACTION STRICTES ET NON NÉGOCIABLES :
  - Tu t'adresses DIRECTEMENT à l'utilisateur (${userRole}).
  - Ton discours doit être constitué uniquement de paragraphes de texte fluide, élégant et naturel.
  - INTERDICTION ABSOLUE d'utiliser le moindre emoji.
  - INTERDICTION ABSOLUE de faire des listes à puces, des énumérations ou des tirets.
  - INTERDICTION ABSOLUE d'utiliser des formules mathématiques complexes ou des notations techniques JSON.
  - Ton ton doit inspirer confiance, autorité et bienveillance.
  - Ne donne pas de réponses excessivement longues, sois concis mais d'une grande profondeur pédagogique.
  
  CONTEXTE RÉEL DE L'ÉTABLISSEMENT :
  ${dataNarrative}
  
  RÉPONDS À LA QUESTION EN UTILISANT EXCLUSIVEMENT LES DONNÉES CI-DESSUS POUR ÉTAYER TON ANALYSE. SI LES DONNÉES SONT MANQUANTES, EXPLIQUE-LE AVEC UNE GRANDE COURTOISIE.`;

  const response = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);

  return {
    answer: response,
    suggestions: userRole === 'Directeur' 
      ? ["Audit de la trésorerie", "Classe la plus performante", "Analyse du taux de réussite"]
      : userRole === 'Enseignant'
      ? ["Performance de mes classes", "Conseils pour les élèves", "Bilans des évaluations"]
      : ["Comment progresser ?", "Analyse de mes points forts", "Point sur mon assiduité"]
  };
}
