'use server';
/**
 * @fileOverview Le "Cerveau ACADEX" - Analyse intelligente des données scolaires
 * Fonctionne sans API externe - analyse directe des données Firebase
 */

export interface BrainInput {
  question: string;
  userRole: 'Directeur' | 'Enseignant' | 'Élève';
  userId: string;
  contextData?: any;
}

export interface BrainOutput {
  answer: string;
  suggestions: string[];
  securityAlert?: boolean;
  error?: string;
}

export type { BrainInput as default };

function calculerMoyenne(notes: number[]): number {
  if (!notes || notes.length === 0) return 0;
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}

function apprecier(moyenne: number): string {
  if (moyenne >= 16) return "Excellent 🌟";
  if (moyenne >= 14) return "Très bien 👍";
  if (moyenne >= 12) return "Bien ✅";
  if (moyenne >= 10) return "Passable ⚠️";
  return "Insuffisant ❌";
}

function analyserEleveContext(data: any, question: string): BrainOutput {
  const notes = data?.notes || {};
  const matieres = Object.keys(notes);
  const q = question.toLowerCase();

  // Calcul des moyennes par matière
  const moyennesParMatiere: Record<string, number> = {};
  matieres.forEach((matiere) => {
    const valeursNotes = Array.isArray(notes[matiere])
      ? notes[matiere]
      : [notes[matiere]];
    moyennesParMatiere[matiere] = calculerMoyenne(valeursNotes.filter(Boolean));
  });

  const toutesLesMoyennes = Object.values(moyennesParMatiere);
  const moyenneGenerale = calculerMoyenne(toutesLesMoyennes);

  // Meilleure et pire matière
  const meilleureMatiere = matieres.reduce((a, b) =>
    moyennesParMatiere[a] > moyennesParMatiere[b] ? a : b, matieres[0]);
  const pireMatiere = matieres.reduce((a, b) =>
    moyennesParMatiere[a] < moyennesParMatiere[b] ? a : b, matieres[0]);

  // Réponse selon la question
  if (q.includes('moyenne') || q.includes('general') || q.includes('résultat')) {
    const lignesNotes = matieres.map(
      (m) => `• ${m} : ${moyennesParMatiere[m].toFixed(2)}/20 (${apprecier(moyennesParMatiere[m])})`
    ).join('\n');

    return {
      answer: `📊 **Voici tes résultats :**\n\n${lignesNotes}\n\n📈 **Moyenne générale : ${moyenneGenerale.toFixed(2)}/20 — ${apprecier(moyenneGenerale)}**\n\n💪 Point fort : ${meilleureMatiere}\n⚠️ À améliorer : ${pireMatiere}`,
      suggestions: [
        "Quelles sont mes notes en " + meilleureMatiere + " ?",
        "Comment améliorer mon niveau en " + pireMatiere + " ?",
        "Quels sont mes conseils pour progresser ?",
      ],
    };
  }

  if (q.includes('conseil') || q.includes('améliorer') || q.includes('progresser')) {
    const conseils = matieres
      .filter((m) => moyennesParMatiere[m] < 12)
      .map((m) => `• Travaille régulièrement en **${m}** (moyenne actuelle : ${moyennesParMatiere[m].toFixed(2)}/20)`)
      .join('\n');

    return {
      answer: conseils
        ? `💡 **Conseils personnalisés :**\n\n${conseils}\n\n✅ Continue comme ça en **${meilleureMatiere}** où tu excelles !`
        : `🎉 Félicitations ! Toutes tes moyennes sont au-dessus de 12/20. Continue ce bon travail en **${meilleureMatiere}** !`,
      suggestions: [
        "Voir ma moyenne générale",
        "Quelles matières dois-je prioriser ?",
        "Mon classement dans la classe ?",
      ],
    };
  }

  if (q.includes('absent') || q.includes('absence') || q.includes('présence')) {
    const absences = data?.absences || 0;
    return {
      answer: absences === 0
        ? "✅ Tu n'as aucune absence enregistrée. Excellent ! La régularité est clé pour la réussite."
        : `📅 Tu as **${absences} absence(s)** enregistrée(s). Attention, les absences peuvent impacter tes résultats.`,
      suggestions: [
        "Voir mes notes",
        "Voir ma moyenne générale",
        "Mes conseils personnalisés",
      ],
    };
  }

  // Réponse par défaut
  return {
    answer: `👋 Bonjour ! Je suis le Cerveau ACADEX.\n\n📊 Ta moyenne générale est de **${moyenneGenerale.toFixed(2)}/20** (${apprecier(moyenneGenerale)}).\n\n💪 Ton point fort est **${meilleureMatiere || 'non défini'}**.\n\nPose-moi une question sur tes notes, tes absences ou demande des conseils !`,
    suggestions: [
      "Quelle est ma moyenne générale ?",
      "Donne-moi des conseils pour progresser",
      "Combien d'absences j'ai ?",
    ],
  };
}

function analyserDirecteurContext(data: any, question: string): BrainOutput {
  const eleves = data?.eleves || [];
  const q = question.toLowerCase();

  if (q.includes('élève') || q.includes('effectif') || q.includes('nombre')) {
    return {
      answer: `🏫 **Effectif total : ${eleves.length} élèves**\n\nL'établissement compte actuellement ${eleves.length} élèves enregistrés.`,
      suggestions: [
        "Quels élèves sont en difficulté ?",
        "Statistiques des moyennes de l'école",
        "Taux de présence global",
      ],
    };
  }

  if (q.includes('difficulté') || q.includes('faible') || q.includes('risque')) {
    const elevesDifficulte = eleves.filter((e: any) => (e.moyenne || 0) < 10);
    const liste = elevesDifficulte.slice(0, 5)
      .map((e: any) => `• ${e.nom || 'Élève'} : ${(e.moyenne || 0).toFixed(2)}/20`)
      .join('\n');
    return {
      answer: `⚠️ **${elevesDifficulte.length} élève(s) en difficulté (moyenne < 10) :**\n\n${liste || 'Aucun élève en difficulté détecté.'}`,
      suggestions: [
        "Voir l'effectif total",
        "Statistiques générales",
        "Taux d'absences global",
      ],
    };
  }

  return {
    answer: `🏫 **Tableau de bord directeur**\n\n• Effectif : ${eleves.length} élèves\n• Élèves en difficulté : ${eleves.filter((e: any) => (e.moyenne || 0) < 10).length}\n\nPosez une question sur les élèves, les résultats ou les présences.`,
    suggestions: [
      "Combien d'élèves sont en difficulté ?",
      "Effectif total de l'école",
      "Statistiques des moyennes",
    ],
  };
}

function analyserEnseignantContext(data: any, question: string): BrainOutput {
  const eleves = data?.eleves || [];
  const matiere = data?.matiere || 'votre matière';

  const moyennes = eleves.map((e: any) => e.moyenne || 0);
  const moyenneClasse = calculerMoyenne(moyennes);
  const elevesDifficulte = eleves.filter((e: any) => (e.moyenne || 0) < 10);

  return {
    answer: `📚 **${matiere} — Analyse de la classe**\n\n• Nombre d'élèves : ${eleves.length}\n• Moyenne de classe : ${moyenneClasse.toFixed(2)}/20 (${apprecier(moyenneClasse)})\n• Élèves en difficulté : ${elevesDifficulte.length}\n\n${elevesDifficulte.length > 0 ? `⚠️ Élèves à suivre : ${elevesDifficulte.map((e: any) => e.nom || 'Élève').join(', ')}` : '✅ Tous les élèves sont au-dessus de 10/20.'}`,
    suggestions: [
      "Quels élèves ont besoin d'aide ?",
      "Moyenne de la classe",
      "Meilleurs élèves de la classe",
    ],
  };
}

export async function askAcadexBrain(input: BrainInput): Promise<BrainOutput> {
  try {
    const { question, userRole, contextData } = input;

    if (!question || question.trim() === '') {
      return {
        answer: "Veuillez poser une question.",
        suggestions: ["Quelle est ma moyenne ?", "Mes conseils personnalisés", "Mes absences"],
      };
    }

    switch (userRole) {
      case 'Élève':
        return analyserEleveContext(contextData, question);
      case 'Directeur':
        return analyserDirecteurContext(contextData, question);
      case 'Enseignant':
        return analyserEnseignantContext(contextData, question);
      default:
        return {
          answer: "Rôle non reconnu.",
          suggestions: [],
          securityAlert: true,
        };
    }
  } catch (error: any) {
    return {
      answer: "",
      suggestions: [],
      error: `Erreur analyse : ${error.message}`,
    };
  }
}