
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
    appreciation: string;
  }>;
  discipline: {
    absencesJustified: number;
    absencesUnjustified: number;
    delays: number;
    behavior: 'Excellent' | 'Bon' | 'Passable' | 'Médiocre';
  };
  councilDecision?: string;
}

export async function generateBulletinPDF(data: BulletinData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Header ---
  // Background rectangle for header
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // School Name and Motto
  doc.setTextColor(20, 83, 45); // Primary color
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

  // Student info section
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.5);
  doc.line(10, 45, pageWidth - 10, 45);

  // --- Student Identity ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES DU 1er TRIMESTRE', pageWidth / 2, 55, { align: 'center' });

  // Left column identity
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Identité de l\'Élève', 15, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom & Prénoms : ${data.student.fullName}`, 15, 72);
  doc.text(`Né(e) le : ${data.student.dob} | Sexe : ${data.student.sex}`, 15, 78);
  doc.text(`Matricule : ${data.student.matricule}`, 15, 84);

  // Right column identity
  doc.text(`Classe : ${data.student.classId}`, 120, 72);
  doc.text(`Effectif : ${data.student.effectif}`, 120, 78);
  doc.text(`Prof. Principal : ${data.student.principalTeacher}`, 120, 84);

  // --- Grades Table ---
  const tableBody = data.grades.map(g => [
    g.subject,
    g.coef,
    g.quiz.toFixed(2),
    g.exam.toFixed(2),
    g.avg.toFixed(2),
    g.weighted.toFixed(2),
    g.rank === 1 ? '1er' : `${g.rank}è`,
    g.appreciation
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

  // --- Totals and Results ---
  const totalCoef = data.grades.reduce((acc, g) => acc + g.coef, 0);
  const totalWeighted = data.grades.reduce((acc, g) => acc + g.weighted, 0);
  const generalAvg = totalWeighted / totalCoef;

  let mention = '';
  if (generalAvg >= 16) mention = 'TRÈS BIEN';
  else if (generalAvg >= 14) mention = 'BIEN';
  else if (generalAvg >= 12) mention = 'ASSEZ BIEN';
  else if (generalAvg >= 10) mention = 'PASSABLE';
  else mention = 'INSUFFISANT';

  doc.setFillColor(245, 245, 245);
  doc.rect(10, finalY + 5, pageWidth - 20, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL POINTS : ${totalWeighted.toFixed(2)} / ${totalCoef * 20}`, 15, finalY + 13);
  doc.text(`MOYENNE GÉNÉRALE : ${generalAvg.toFixed(2)} / 20`, 15, finalY + 20);
  doc.text(`MENTION : ${mention}`, 15, finalY + 27);

  doc.text(`RANG : ${data.student.rank === 1 ? '1er' : data.student.rank + 'è'} / ${data.student.effectif}`, 120, finalY + 13);
  doc.text(`DÉCISION : ${data.councilDecision || (generalAvg >= 10 ? 'Tableau d\'Honneur' : 'À encourager')}`, 120, finalY + 20);

  // --- Discipline ---
  doc.setFontSize(9);
  doc.text('DISCIPLINE & ASSIDUITÉ', 15, finalY + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Absences : ${data.discipline.absencesUnjustified} (Injust.) | ${data.discipline.absencesJustified} (Just.)`, 15, finalY + 46);
  doc.text(`Retards : ${data.discipline.delays} | Conduite : ${data.discipline.behavior}`, 15, finalY + 52);

  // --- Signatures ---
  const sigY = finalY + 70;
  doc.setFont('helvetica', 'bold');
  doc.text('Le Professeur Principal', 15, sigY);
  doc.text('Le Directeur', pageWidth - 50, sigY);

  // QR Code
  const qrData = `VERIFY-ACADEX-${data.student.matricule}-${data.term}-2025`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 15, sigY - 10, 30, 30);
  doc.setFontSize(7);
  doc.text('Scanner pour vérifier l\'authenticité', pageWidth / 2, sigY + 22, { align: 'center' });

  // Save the PDF
  doc.save(`BULLETIN_${data.student.matricule}_${data.term}.pdf`);
}
