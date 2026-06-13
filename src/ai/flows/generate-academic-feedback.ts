'use server';
/**
 * @fileOverview Génération de feedbacks académiques - Analyse locale sans API externe
 */

export interface GenerateAcademicFeedbackInput {
  studentName: string;
  grades: Array<{
    subject: string;
    grade: number;
    maxGrade: number;
  }>;
  evaluationContext?: string;
  teacherComments?: string;
}

export interface GenerateAcademicFeedbackOutput {
  academicFeedback: string;
  summaryReport: string;
  recommendations: string[];
  error?: string;
}

export async function generateAcademicFeedback(
  input: GenerateAcademicFeedbackInput
): Promise<GenerateAcademicFeedbackOutput> {
  try {
    const { studentName, grades, teacherComments } = input;

    const moyenne = grades.reduce((sum, g) => sum + (g.grade / g.maxGrade) * 20, 0) / grades.length;

    const meilleureMatiere = grades.reduce((a, b) => a.grade > b.grade ? a : b);
    const faibleMatiere = grades.reduce((a, b) => a.grade < b.grade ? a : b);

    const appreciation = moyenne >= 16 ? "excellents" :
      moyenne >= 14 ? "très bons" :
      moyenne >= 12 ? "bons" :
      moyenne >= 10 ? "passables" : "insuffisants";

    const academicFeedback = `${studentName} présente des résultats ${appreciation} avec une moyenne générale de ${moyenne.toFixed(2)}/20. ${
      moyenne >= 12
        ? `Les efforts fournis sont visibles, notamment en ${meilleureMatiere.subject}. Continuez sur cette lancée !`
        : `Des efforts supplémentaires sont nécessaires, particulièrement en ${faibleMatiere.subject}.`
    }${teacherComments ? ` Note du professeur : ${teacherComments}` : ''}`;

    const lignesNotes = grades
      .map(g => {
        const sur20 = ((g.grade / g.maxGrade) * 20).toFixed(2);
        const statut = parseFloat(sur20) >= 10 ? "✅" : "⚠️";
        return `${statut} ${g.subject} : ${sur20}/20`;
      })
      .join('\n');

    const summaryReport = `📊 Bilan de ${studentName} :\n\n${lignesNotes}\n\n📈 Moyenne générale : ${moyenne.toFixed(2)}/20\n💪 Point fort : ${meilleureMatiere.subject}\n📚 À renforcer : ${faibleMatiere.subject}`;

    const recommendations: string[] = [];

    grades
      .filter(g => (g.grade / g.maxGrade) * 20 < 10)
      .slice(0, 2)
      .forEach(g => {
        recommendations.push(`Intensifier le travail en ${g.subject} avec des exercices réguliers.`);
      });

    if (moyenne >= 10) {
      recommendations.push(`Maintenir le bon niveau en ${meilleureMatiere.subject} et viser l'excellence.`);
    }

    if (recommendations.length < 3) {
      recommendations.push("Revoir les leçons régulièrement et ne pas attendre les examens pour réviser.");
    }

    return { academicFeedback, summaryReport, recommendations };

  } catch (error: any) {
    return {
      academicFeedback: "",
      summaryReport: "",
      recommendations: [],
      error: `Erreur analyse : ${error.message}`,
    };
  }
}