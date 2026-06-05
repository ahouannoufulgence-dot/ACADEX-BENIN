
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface BulletinData {
  schoolInfo: {
    name: string;
    motto: string;
    address: string;
    phone: string;
    academicYear: string;
    logoUrl?: string;
  };
  student: {
    id: string;
    fullName: string;
    matricule: string;
    classId: string;
    dob: string;
    sex: string;
    photoUrl?: string;
    rank: number;
    effectif: number;
    principalTeacher: string;
  };
  term: string;
  grades: Array<{
    subject: string;
    coef: number;
    quiz: number;
    exam: number;
    avg: number;
    weighted: number;
    rank: number;
    appreciation?: string;
  }>;
  discipline: {
    absencesJustified: number;
    absencesUnjustified: number;
    delays: number;
    behavior: 'Excellent' | 'Bon' | 'Passable' | 'Médiocre';
  };
  councilDecision?: string;
}

/**
 * Generates an automatic appreciation based on average
 */
function getAutoAppreciation(avg: number): string {
  if (avg >= 16) return "Excellent travail, continuez ainsi.";
  if (avg >= 14) return "Très bon trimestre, élève sérieux.";
  if (avg >= 12) return "Bon travail, quelques efforts à maintenir.";
  if (avg >= 10) return "Résultats acceptables, plus d’efforts nécessaires.";
  return "Travail insuffisant, efforts indispensables pour réussir.";
}

/**
 * Generates a mention based on average
 */
function getMention(avg: number): string {
  if (avg >= 16) return 'TRÈS BIEN';
  if (avg >= 14) return 'BIEN';
  if (avg >= 12) return 'ASSEZ BIEN';
  if (avg >= 10) return 'PASSABLE';
  return 'INSUFFISANT';
}

export async function generateBulletinPDF(data: BulletinData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- CALCULS AUTOMATIQUES ---
  const totalCoef = data.grades.reduce((acc, g) => acc + g.coef, 0);
  const totalWeighted = data.grades.reduce((acc, g) => acc + g.weighted, 0);
  const generalAvg = totalWeighted / totalCoef;
  const mention = getMention(generalAvg);

  // --- HEADER ---
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(20, 83, 45); // ACADEX Primary
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolInfo.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`"${data.schoolInfo.motto}"`, pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.schoolInfo.address} | Tél: ${data.schoolInfo.phone}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Année Scolaire: ${data.schoolInfo.academicYear} | ${data.term}`, pageWidth / 2, 34, { align: 'center' });

  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.5);
  doc.line(10, 45, pageWidth - 10, 45);

  // --- STUDENT IDENTITY ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`BULLETIN DE NOTES - ${data.term.toUpperCase()}`, pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Identité de l\'Élève', 15, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom & Prénoms : ${data.student.fullName}`, 15, 72);
  doc.text(`Né(e) le : ${data.student.dob} | Sexe : ${data.student.sex}`, 15, 78);
  doc.text(`Matricule : ${data.student.matricule}`, 15, 84);

  doc.text(`Classe : ${data.student.classId}`, 120, 72);
  doc.text(`Effectif : ${data.student.effectif}`, 120, 78);
  doc.text(`Prof. Principal : ${data.student.principalTeacher}`, 120, 84);

  // --- GRADES TABLE ---
  const tableBody = data.grades.map(g => [
    g.subject,
    g.coef,
    g.quiz.toFixed(2),
    g.exam.toFixed(2),
    g.avg.toFixed(2),
    g.weighted.toFixed(2),
    g.rank === 1 ? '1er' : `${g.rank}è`,
    g.appreciation || getAutoAppreciation(g.avg)
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['Matière', 'Coef', 'Devoir', 'Comp.', 'Moy/20', 'Pondéré', 'Rang', 'Appréciation']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center' },
    },
    styles: { cellPadding: 2 }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // --- SUMMARY BOX ---
  doc.setFillColor(245, 245, 245);
  doc.rect(10, finalY + 5, pageWidth - 20, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL POINTS : ${totalWeighted.toFixed(2)} / ${totalCoef * 20}`, 15, finalY + 13);
  doc.text(`MOYENNE GÉNÉRALE : ${generalAvg.toFixed(2)} / 20`, 15, finalY + 20);
  doc.text(`MENTION : ${mention}`, 15, finalY + 27);

  doc.text(`RANG GLOBAL : ${data.student.rank === 1 ? '1er' : data.student.rank + 'è'} / ${data.student.effectif}`, 120, finalY + 13);
  doc.text(`DÉCISION : ${data.councilDecision || (generalAvg >= 10 ? 'Admis' : 'Redouble')}`, 120, finalY + 20);

  // --- DISCIPLINE ---
  doc.setFontSize(9);
  doc.text('DISCIPLINE & ASSIDUITÉ', 15, finalY + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Absences : ${data.discipline.absencesUnjustified} (Injust.) | ${data.discipline.absencesJustified} (Just.)`, 15, finalY + 46);
  doc.text(`Retards : ${data.discipline.delays} | Conduite : ${data.discipline.behavior}`, 15, finalY + 52);

  // --- SIGNATURES ---
  const sigY = finalY + 70;
  doc.setFont('helvetica', 'bold');
  doc.text('Le Professeur Principal', 15, sigY);
  doc.text('Le Directeur', pageWidth - 50, sigY);

  // Cachet Simulation
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(1);
  doc.ellipse(pageWidth - 35, sigY + 5, 20, 10);
  doc.setFontSize(6);
  doc.text('CACHET OFFICIEL', pageWidth - 35, sigY + 6, { align: 'center' });

  // QR Code Verification
  const qrData = `VERIFY-ACADEX-${data.student.matricule}-${data.term}-2025`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 15, sigY - 10, 30, 30);
  doc.setFontSize(7);
  doc.text('Scanner pour vérification officielle', pageWidth / 2, sigY + 22, { align: 'center' });

  // SAVE
  doc.save(`BULLETIN_${data.student.matricule}_${data.term}.pdf`);
}
