'use server';

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

function apprecier(moyenne: number): string {
  if (moyenne >= 16) return "excellent";
  if (moyenne >= 14) return "très bien";
  if (moyenne >= 12) return "bien";
  if (moyenne >= 10) return "passable";
  return "insuffisant";
}

function conseilProfesseur(matiere: string, moyenne: number): string {
  if (moyenne >= 16) return `En ${matiere}, tu fais un excellent travail. Maintiens cet effort et aide tes camarades si tu le peux.`;
  if (moyenne >= 14) return `En ${matiere}, tu es sur la bonne voie. Quelques révisions supplémentaires te permettront d'atteindre l'excellence.`;
  if (moyenne >= 12) return `En ${matiere}, tu travailles bien. Relis tes cours le soir même après les leçons pour consolider ce que tu as appris.`;
  if (moyenne >= 10) return `En ${matiere}, tu passes mais tu peux faire mieux. Je te conseille de refaire les exercices du cours, pas seulement de les lire.`;
  if (moyenne >= 7) return `En ${matiere}, tu es en difficulté. N'attends pas les examens pour demander de l'aide à ton professeur. Prends rendez-vous avec lui cette semaine.`;
  return `En ${matiere}, la situation est préoccupante. Il faut absolument revoir les bases depuis le début. Parle-en à tes parents et à ton professeur dès maintenant.`;
}

function analyserEleveContext(data: any, question: string): BrainOutput {
  const notes = data?.notes || {};
  const matieres = Object.keys(notes);
  const nomEleve = data?.nomEleve || "l'élève";
  const q = question.toLowerCase();

  if (matieres.length === 0) {
    return {
      answer: "Je n'ai pas encore de notes enregistrées pour toi ce trimestre. Reviens me voir dès que tes professeurs auront saisi tes premières évaluations.",
      suggestions: ["Voir mes absences", "Comment bien travailler ?", "Mes conseils généraux"],
    };
  }

  const moyennesParMatiere: Record<string, number> = {};
  matieres.forEach((m) => {
    const val = notes[m];
    moyennesParMatiere[m] = typeof val === 'number' ? val : 0;
  });

  const toutesLesMoyennes = Object.values(moyennesParMatiere);
  const moyenneGenerale = toutesLesMoyennes.reduce((a, b) => a + b, 0) / toutesLesMoyennes.length;

  const meilleureMatiere = matieres.reduce((a, b) =>
    moyennesParMatiere[a] > moyennesParMatiere[b] ? a : b, matieres[0]);
  const pireMatiere = matieres.reduce((a, b) =>
    moyennesParMatiere[a] < moyennesParMatiere[b] ? a : b, matieres[0]);

  if (q.includes('moyenne') || q.includes('résultat') || q.includes('note') || q.includes('general')) {
    const lignes = matieres.map(
      (m) => `${m} : ${moyennesParMatiere[m].toFixed(2)} sur 20, soit un niveau ${apprecier(moyennesParMatiere[m])}.`
    ).join('\n');

    return {
      answer: `Voici tes résultats du trimestre en cours.\n\n${lignes}\n\nTa moyenne générale est de ${moyenneGenerale.toFixed(2)} sur 20, ce qui est ${apprecier(moyenneGenerale)}. Tu te démarques particulièrement en ${meilleureMatiere}. La matière qui nécessite le plus d'attention de ta part reste ${pireMatiere}.`,
      suggestions: [
        "Quels conseils pour progresser ?",
        "Comment améliorer mon niveau en " + pireMatiere + " ?",
        "Combien d'absences j'ai ?",
      ],
    };
  }

  if (q.includes('conseil') || q.includes('améliorer') || q.includes('progresser') || q.includes('aider')) {
    const matieresFaibles = matieres.filter((m) => moyennesParMatiere[m] < 12);

    if (matieresFaibles.length === 0) {
      return {
        answer: `Tu as de bons résultats dans l'ensemble, et c'est une vraie satisfaction. Pour continuer à progresser, je te recommande de ne jamais te reposer sur tes acquis. En ${meilleureMatiere} particulièrement, tu pourrais viser des notes encore plus hautes en approfondissant les chapitres difficiles. La régularité dans le travail quotidien est ce qui fait la différence entre un bon élève et un excellent élève.`,
        suggestions: [
          "Voir mes résultats complets",
          "Ma moyenne générale",
          "Mes absences ce trimestre",
        ],
      };
    }

    const conseils = matieresFaibles.map((m) => conseilProfesseur(m, moyennesParMatiere[m])).join('\n\n');

    return {
      answer: `Voici mes conseils personnalisés pour toi ce trimestre.\n\n${conseils}\n\nDe manière générale, essaie de travailler un peu chaque jour plutôt que de tout faire la veille des devoirs. C'est cette régularité qui construit une vraie réussite scolaire.`,
      suggestions: [
        "Voir ma moyenne générale",
        "Quelles matières prioriser ?",
        "Mes résultats complets",
      ],
    };
  }

  if (q.includes('absent') || q.includes('absence') || q.includes('présence')) {
    const absences = data?.absences || 0;
    return {
      answer: absences === 0
        ? "Tu n'as aucune absence enregistrée pour le moment. C'est très bien. La présence régulière en classe est l'un des facteurs les plus importants de la réussite scolaire. Continue comme ça."
        : `Tu as ${absences} absence${absences > 1 ? 's' : ''} enregistrée${absences > 1 ? 's' : ''} ce trimestre. Chaque heure de cours manquée est une leçon qu'il faut rattraper seul, ce qui est toujours plus difficile. Si ces absences sont justifiées, assure-toi de récupérer les cours auprès de tes camarades. Si elles ne le sont pas, parles-en avec tes parents.`,
      suggestions: [
        "Voir mes notes",
        "Ma moyenne générale",
        "Mes conseils pour progresser",
      ],
    };
  }

  return {
    answer: `Bonjour. Je suis le Cerveau ACADEX, ton assistant scolaire personnel. Ta moyenne générale est actuellement de ${moyenneGenerale.toFixed(2)} sur 20, ce qui est ${apprecier(moyenneGenerale)}. Tu peux me poser des questions sur tes notes, tes absences, ou me demander des conseils pour progresser dans une matière.`,
    suggestions: [
      "Voir mes résultats complets",
      "Quels conseils pour progresser ?",
      "Combien d'absences j'ai ?",
    ],
  };
}

function analyserDirecteurContext(data: any, question: string): BrainOutput {
  const eleves = data?.eleves || [];
  const q = question.toLowerCase();
  const elevesDifficulte = eleves.filter((e: any) => (e.moyenne || 0) < 10);

  if (q.includes('élève') || q.includes('effectif') || q.includes('nombre')) {
    return {
      answer: `L'établissement compte actuellement ${eleves.length} élèves enregistrés pour cette année scolaire. Parmi eux, ${elevesDifficulte.length} élève${elevesDifficulte.length > 1 ? 's sont' : ' est'} en situation de difficulté avec une moyenne inférieure à 10 sur 20.`,
      suggestions: [
        "Quels élèves sont en difficulté ?",
        "Statistiques des moyennes",
        "Taux de présence global",
      ],
    };
  }

  if (q.includes('difficulté') || q.includes('faible') || q.includes('risque')) {
    const liste = elevesDifficulte.slice(0, 5)
      .map((e: any) => `${e.nom || 'Élève'} avec une moyenne de ${(e.moyenne || 0).toFixed(2)} sur 20`)
      .join(', ');
    return {
      answer: elevesDifficulte.length === 0
        ? "Aucun élève n'est actuellement en dessous de la moyenne. Les résultats généraux sont satisfaisants."
        : `Il y a ${elevesDifficulte.length} élève${elevesDifficulte.length > 1 ? 's' : ''} en difficulté cette période. ${liste ? 'Les plus concernés sont : ' + liste + '.' : ''} Une attention particulière de leurs enseignants serait recommandée.`,
      suggestions: [
        "Voir l'effectif total",
        "Statistiques générales",
        "Taux d'absences global",
      ],
    };
  }

  return {
    answer: `Bonjour. Voici un aperçu rapide de l'établissement. Vous avez ${eleves.length} élèves inscrits et ${elevesDifficulte.length} en situation de difficulté académique. Posez-moi une question précise sur les élèves, les résultats ou les présences.`,
    suggestions: [
      "Combien d'élèves sont en difficulté ?",
      "Effectif total",
      "Statistiques des moyennes",
    ],
  };
}

function analyserEnseignantContext(data: any, question: string): BrainOutput {
  const eleves = data?.eleves || [];
  const matiere = data?.matiere || 'votre matière';
  const moyennes = eleves.map((e: any) => e.moyenne || 0);
  const moyenneClasse = moyennes.length > 0 ? moyennes.reduce((a: number, b: number) => a + b, 0) / moyennes.length : 0;
  const elevesDifficulte = eleves.filter((e: any) => (e.moyenne || 0) < 10);

  return {
    answer: `En ${matiere}, la classe compte ${eleves.length} élèves avec une moyenne générale de ${moyenneClasse.toFixed(2)} sur 20, ce qui est ${apprecier(moyenneClasse)}. ${elevesDifficulte.length === 0 ? 'Tous les élèves sont au-dessus de la moyenne, ce qui est encourageant.' : `Il y a ${elevesDifficulte.length} élève${elevesDifficulte.length > 1 ? 's' : ''} en dessous de la moyenne : ${elevesDifficulte.map((e: any) => e.nom || 'Élève').join(', ')}. Un suivi individualisé serait bénéfique pour ces élèves.`}`,
    suggestions: [
      "Quels élèves ont besoin d'aide ?",
      "Moyenne de la classe",
      "Meilleurs élèves",
    ],
  };
}

export async function askAcadexBrain(input: BrainInput): Promise<BrainOutput> {
  try {
    const { question, userRole, contextData } = input;

    if (!question || question.trim() === '') {
      return {
        answer: "Bonjour, je suis prêt à vous aider. Posez-moi une question sur vos résultats, vos absences ou demandez des conseils.",
        suggestions: ["Quelle est ma moyenne ?", "Mes conseils pour progresser", "Mes absences"],
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