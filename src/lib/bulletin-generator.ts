
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface BulletinData {
  schoolInfo: {
    name: string;
    motto: string;
    address: string;
    phone: string;
    email: string;
    academicYear: string;
    logoUrl?: string;
    primaryColor?: string;
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
    int1?: number;
    int2?: number;
    int3?: number;
    dev1?: number;
    dev2?: number;
    comp?: number;
    avg: number;
    weighted: number;
    rank: number;
    appreciation: string;
  }>;
  discipline: {
    absencesJustified: number;
    absencesUnjustified: number;
    delays: number;
    conductGrade: number;
  };
  summary: {
    totalWeighted: number;
    totalCoef: number;
    generalAvg: number;
    mention: string;
    decision: string;
  };
}

export async function generateBulletinPDF(data: BulletinData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = data.schoolInfo.primaryColor || "#14532D";
  
  // Convert hex to RGB for jspdf
  const r = parseInt(primaryColor.slice(1, 3), 16);
  const g = parseInt(primaryColor.slice(3, 5), 16);
  const b = parseInt(primaryColor.slice(5, 7), 16);

  // --- HEADER SECTION ---
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo placeholder or actual image
  if (data.schoolInfo.logoUrl) {
    try {
      doc.addImage(data.schoolInfo.logoUrl, 'PNG', 15, 10, 25, 25);
    } catch (e) {
      doc.setFillColor(r, g, b);
      doc.roundedRect(15, 10, 25, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(data.schoolInfo.name[0], 27.5, 25, { align: 'center' });
    }
  }

  // School Identity
  doc.setTextColor(r, g, b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(data.schoolInfo.name.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(`"${data.schoolInfo.motto}"`, pageWidth / 2, 24, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.schoolInfo.address} | Tél: ${data.schoolInfo.phone}`, pageWidth / 2, 30, { align: 'center' });
  doc.text(`Email: ${data.schoolInfo.email}`, pageWidth / 2, 34, { align: 'center' });

  // Academic Year Box
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageWidth - 55, 10, 40, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolInfo.academicYear, pageWidth - 35, 17.5, { align: 'center' });

  // --- DOCUMENT TITLE ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`BULLETIN DE NOTES - ${data.term.toUpperCase()}`, pageWidth / 2, 60, { align: 'center' });
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, 63, pageWidth / 2 + 30, 63);

  // --- STUDENT INFO ---
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 70, pageWidth - 30, 25, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text("ÉLÈVE :", 20, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.fullName.toUpperCase(), 45, 78);
  
  doc.setFont('helvetica', 'bold');
  doc.text("MATRICULE :", 20, 84);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.matricule, 45, 84);

  doc.setFont('helvetica', 'bold');
  doc.text("CLASSE :", 110, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.classId, 130, 78);
  
  doc.setFont('helvetica', 'bold');
  doc.text("EFFECTIF :", 110, 84);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.student.effectif} élèves`, 130, 84);

  // --- GRADES TABLE ---
  autoTable(doc, {
    startY: 100,
    head: [['Matières', 'Coef', 'Int.', 'Dev. 1', 'Dev. 2', 'Comp.', 'Moy/20', 'Pondéré', 'Appréciations']],
    body: data.grades.map(g => [
      g.subject.toUpperCase(),
      g.coef,
      (( (g.int1||0) + (g.int2||0) + (g.int3||0) ) / ( (g.int1!==undefined?1:0)+(g.int2!==undefined?1:0)+(g.int3!==undefined?1:0) || 1)).toFixed(1),
      g.dev1 !== undefined ? g.dev1.toFixed(1) : '-',
      g.dev2 !== undefined ? g.dev2.toFixed(1) : '-',
      g.comp !== undefined ? g.comp.toFixed(1) : '-',
      g.avg.toFixed(2),
      g.weighted.toFixed(2),
      g.appreciation
    ]),
    theme: 'grid',
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontSize: 8, halign: 'center', valign: 'middle' },
    bodyStyles: { fontSize: 7, halign: 'center', textColor: [50, 50, 50] },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 },
      8: { halign: 'left', fontStyle: 'italic', cellWidth: 40 }
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // --- SUMMARY BOXES ---
  // Left: Results
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, finalY + 5, 85, 35, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text("RÉSULTATS DU TRIMESTRE", 20, finalY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Total des Points Pondérés :`, 20, finalY + 20);
  doc.text(`${data.summary.totalWeighted.toFixed(2)}`, 85, finalY + 20, { align: 'right' });
  
  doc.text(`Total des Coefficients :`, 20, finalY + 25);
  doc.text(`${data.summary.totalCoef}`, 85, finalY + 25, { align: 'right' });
  
  doc.setFontSize(11);
  doc.text(`MOYENNE GÉNÉRALE :`, 20, finalY + 33);
  doc.text(`${data.summary.generalAvg.toFixed(2)} / 20`, 85, finalY + 33, { align: 'right' });

  // Right: Discipline & Ranks
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - 100, finalY + 5, 85, 35, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text("POSITION & VIE SCOLAIRE", pageWidth - 95, finalY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Rang de l'élève :`, pageWidth - 95, finalY + 20);
  doc.text(`${data.student.rank}${data.student.rank === 1 ? 'er' : 'è'} sur ${data.student.effectif}`, pageWidth - 20, finalY + 20, { align: 'right' });
  
  doc.text(`Assiduité (Absences) :`, pageWidth - 95, finalY + 25);
  doc.text(`${data.discipline.absencesUnjustified}H non justif.`, pageWidth - 20, finalY + 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text(`MENTION : ${data.summary.mention}`, pageWidth - 95, finalY + 33);

  // --- FOOTER SIGNATURES ---
  const footerY = finalY + 55;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("Le Parent d'élève", 30, footerY);
  doc.text("Le Titulaire", pageWidth / 2, footerY, { align: 'center' });
  doc.text("Le Chef d'Établissement", pageWidth - 30, footerY, { align: 'right' });

  // QR Code for verification
  const qrData = `VERIF-ACADEX-${data.student.matricule}-${data.term}-${data.summary.generalAvg}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 12, footerY + 10, 24, 24);
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Document certifié conforme par le système ACADEX - Toute rature annule le document.", pageWidth / 2, footerY + 38, { align: 'center' });

  doc.save(`BULLETIN_${data.student.matricule}_${data.term}.pdf`);
}
