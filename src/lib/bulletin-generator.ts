
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
    int1: number;
    int2: number;
    int3: number;
    dev1: number;
    dev2: number;
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
  const totalCoef = data.grades.reduce((acc, g) => acc + g.coef, 0);
  const totalWeighted = data.grades.reduce((acc, g) => acc + g.weighted, 0);
  const generalAvg = totalWeighted / totalCoef;
  const mention = getMention(generalAvg);

  // HEADER
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(20, 83, 45);
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

  // STUDENT INFO
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`BULLETIN DE NOTES - ${data.term.toUpperCase()}`, pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nom & Prénoms : ${data.student.fullName}`, 15, 65);
  doc.text(`Matricule : ${data.student.matricule}`, 15, 72);
  doc.text(`Classe : ${data.student.classId}`, 120, 65);
  doc.text(`Effectif : ${data.student.effectif}`, 120, 72);

  // GRADES TABLE (Simplified for space)
  const tableBody = data.grades.map(g => [
    g.subject,
    g.coef,
    ((g.int1 + g.int2 + g.int3) / 3).toFixed(2), // Moyenne Int.
    g.dev1.toFixed(2),
    g.dev2.toFixed(2),
    g.avg.toFixed(2),
    g.weighted.toFixed(2),
    g.rank === 1 ? '1er' : `${g.rank}è`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Matière', 'Coef', 'Moy Int.', 'Dev 1', 'Dev 2', 'Moy/20', 'Pondéré', 'Rang']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    styles: { halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // SUMMARY
  doc.setFillColor(245, 245, 245);
  doc.rect(10, finalY + 5, pageWidth - 20, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`MOYENNE GÉNÉRALE : ${generalAvg.toFixed(2)} / 20`, 15, finalY + 13);
  doc.text(`MENTION : ${mention}`, 15, finalY + 18);
  doc.text(`RANG GLOBAL : ${data.student.rank} / ${data.student.effectif}`, 120, finalY + 13);

  // QR Code
  const qrData = `ACADEX-${data.student.matricule}-${data.term}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 10, finalY + 30, 20, 20);

  doc.save(`BULLETIN_${data.student.matricule}.pdf`);
}
