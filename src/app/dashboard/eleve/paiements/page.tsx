"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { CreditCard, DollarSign, History, CheckCircle2, Lock, ShieldCheck, Wallet, FileDown, Download } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { jsPDF } from "jspdf"

export default function StudentPaymentsPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [expectedFee, setExpectedFee] = useState(150000)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem("acadex_user_id") || ""
    const year = localStorage.getItem("acadex_active_year") || "2026-2027"
    const name = localStorage.getItem("acadex_user_name") || ""
    setStudentId(id)
    setActiveYear(year)
    setStudentName(name)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!studentId || !activeYear) return
    const fetchData = async () => {
      setLoading(true)

      // Config école
      const { data: config } = await supabase.from("school_settings").select("*").eq("id", "main_config").single()
      if (config) setSchoolConfig(config)

      // Classe de l'élève
      const { data: studentData } = await supabase.from("students").select("class_id, first_name, last_name").eq("matricule", studentId).single()
      const classId = studentData?.class_id || ""
      setStudentClass(classId)
      if (studentData?.first_name) setStudentName(`${studentData.last_name} ${studentData.first_name}`)

      // Tarif classe
      if (classId) {
        const { data: feeData } = await supabase.from("class_fees").select("amount").eq("class_id", classId).eq("academic_year", activeYear).single()
        if (feeData) setExpectedFee(Number(feeData.amount))
      }

      // Paiements
      const { data: payData } = await supabase.from("payments").select("*").eq("student_matricule", studentId).eq("academic_year", activeYear).order("payment_date", { ascending: false })
      setPayments(payData || [])
      setLoading(false)
    }
    fetchData()
  }, [studentId, activeYear])

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0), [payments])
  const remaining = expectedFee - totalPaid
  const percent = Math.min(100, (totalPaid / expectedFee) * 100)

  // ── Générer reçu PDF premium ──────────────────────────────────
  const generateReceipt = (payment: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
    const schoolName = schoolConfig?.school_name || "ACADEX"
    const schoolAddress = schoolConfig?.address || "Cotonou, Bénin"
    const schoolPhone = schoolConfig?.phone || ""
    const primaryColor: [number, number, number] = [20, 83, 45]
    const lightGreen: [number, number, number] = [240, 253, 244]

    const W = 148, H = 210

    // Fond header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, W, 45, 'F')

    // Logo lettre
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(10, 8, 22, 22, 4, 4, 'F')
    doc.setTextColor(...primaryColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName[0], 21, 22, { align: 'center' })

    // Nom école
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), 38, 18)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(schoolAddress, 38, 24)
    if (schoolPhone) doc.text(schoolPhone, 38, 29)

    // Titre reçu
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('REÇU DE PAIEMENT', W - 10, 18, { align: 'right' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`N° ${payment.id?.slice(0, 8).toUpperCase() || 'REC-001'}`, W - 10, 24, { align: 'right' })
    doc.text(`Année : ${activeYear}`, W - 10, 29, { align: 'right' })

    // Bande verte claire
    doc.setFillColor(...lightGreen)
    doc.rect(0, 45, W, 18, 'F')
    doc.setTextColor(...primaryColor)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('REÇU CERTIFIÉ ACADEX', W / 2, 56, { align: 'center' })

    // Section élève
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS ÉLÈVE', 10, 73)
    doc.setDrawColor(200, 200, 200)
    doc.line(10, 75, W - 10, 75)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const infos = [
      ['Nom & Prénom', studentName],
      ['Matricule', studentId],
      ['Classe', studentClass],
    ]
    infos.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text(label + ' :', 12, 83 + i * 8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(value || '---', 55, 83 + i * 8)
    })

    // Section paiement
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(8)
    doc.text('DÉTAILS DU VERSEMENT', 10, 112)
    doc.line(10, 114, W - 10, 114)

    const payInfos = [
      ['Motif', payment.note || 'Scolarité'],
      ['Date', payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'],
      ['Statut', payment.status || 'Validé'],
    ]
    payInfos.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text(label + ' :', 12, 122 + i * 8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(String(value), 55, 122 + i * 8)
    })

    // Montant — grande zone
    doc.setFillColor(...primaryColor)
    doc.roundedRect(10, 148, W - 20, 22, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('MONTANT VERSÉ', W / 2, 156, { align: 'center' })
    doc.setFontSize(18)
    doc.text(`${Number(payment.amount_paid).toLocaleString()} FCFA`, W / 2, 165, { align: 'center' })

    // Bilan scolarité
    doc.setFillColor(245, 245, 245)
    doc.rect(10, 175, W - 20, 18, 'F')
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Scolarité totale : ${expectedFee.toLocaleString()} F`, 15, 182)
    doc.text(`Total versé : ${totalPaid.toLocaleString()} F`, 15, 188)
    const rem = expectedFee - totalPaid
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(rem <= 0 ? 20 : 185, rem <= 0 ? 83 : 28, rem <= 0 ? 45 : 28)
    doc.text(rem <= 0 ? '✓ Scolarité entièrement réglée' : `Reste à payer : ${rem.toLocaleString()} F`, W - 15, 185, { align: 'right' })

    // Footer
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.text('Document généré automatiquement par le système ACADEX — Valeur de reçu officiel', W / 2, 202, { align: 'center' })
    doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, W / 2, 206, { align: 'center' })

    doc.save(`recu-${studentId}-${payment.id?.slice(0, 8) || 'paiement'}.pdf`)
  }

  // ── Reçu global tous paiements ───────────────────────────────
  const generateFullReceipt = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const schoolName = schoolConfig?.school_name || "ACADEX"
    const primaryColor: [number, number, number] = [20, 83, 45]
    const W = 210

    // Header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, W, 50, 'F')
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(12, 10, 28, 28, 5, 5, 'F')
    doc.setTextColor(...primaryColor)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName[0], 26, 28, { align: 'center' })
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text(schoolName.toUpperCase(), 46, 22)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(schoolConfig?.address || "Cotonou, Bénin", 46, 30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('RELEVÉ DE PAIEMENTS', W - 15, 22, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Année : ${activeYear}`, W - 15, 30, { align: 'right' })
    doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, W - 15, 37, { align: 'right' })

    // Infos élève
    doc.setTextColor(50, 50, 50)
    doc.setFillColor(240, 253, 244)
    doc.rect(12, 58, W - 24, 28, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('ÉLÈVE', 18, 67)
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom : ${studentName}`, 18, 74)
    doc.text(`Matricule : ${studentId}`, 18, 80)
    doc.text(`Classe : ${studentClass}`, 100, 74)
    doc.text(`Scolarité : ${expectedFee.toLocaleString()} F`, 100, 80)

    // Tableau paiements
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.text('HISTORIQUE DES VERSEMENTS', 12, 98)

    // En-tête tableau
    doc.setFillColor(...primaryColor)
    doc.rect(12, 102, W - 24, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('N°', 16, 109)
    doc.text('Date', 28, 109)
    doc.text('Motif', 70, 109)
    doc.text('Statut', 130, 109)
    doc.text('Montant (FCFA)', W - 16, 109, { align: 'right' })

    // Lignes
    payments.forEach((p, i) => {
      const y = 118 + i * 10
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(12, y - 6, W - 24, 10, 'F')
      }
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(String(i + 1), 16, y)
      doc.text(p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '---', 28, y)
      doc.text((p.note || 'Scolarité').substring(0, 30), 70, y)
      doc.setTextColor(p.status === 'Validé' ? 20 : 185, p.status === 'Validé' ? 83 : 28, p.status === 'Validé' ? 45 : 28)
      doc.text(p.status || 'Validé', 130, y)
      doc.setTextColor(20, 83, 45)
      doc.setFont('helvetica', 'bold')
      doc.text(`+${Number(p.amount_paid).toLocaleString()}`, W - 16, y, { align: 'right' })
    })

    // Total
    const totalY = 118 + payments.length * 10 + 5
    doc.setFillColor(...primaryColor)
    doc.rect(12, totalY, W - 24, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL VERSÉ', 18, totalY + 9)
    doc.text(`${totalPaid.toLocaleString()} FCFA`, W - 16, totalY + 9, { align: 'right' })

    // Reste
    const remY = totalY + 20
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const rem = expectedFee - totalPaid
    if (rem <= 0) {
      doc.setFillColor(240, 253, 244)
      doc.rect(12, remY, W - 24, 12, 'F')
      doc.setTextColor(20, 83, 45)
      doc.setFont('helvetica', 'bold')
      doc.text('✓ SCOLARITÉ ENTIÈREMENT RÉGLÉE', W / 2, remY + 8, { align: 'center' })
    } else {
      doc.setFillColor(254, 242, 242)
      doc.rect(12, remY, W - 24, 12, 'F')
      doc.setTextColor(185, 28, 28)
      doc.setFont('helvetica', 'bold')
      doc.text(`Reste à payer : ${rem.toLocaleString()} FCFA`, W / 2, remY + 8, { align: 'center' })
    }

    // Footer
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('Document officiel généré par le système ACADEX — Conservez ce document comme preuve de paiement.', W / 2, 280, { align: 'center' })

    doc.save(`releve-paiements-${studentId}-${activeYear}.pdf`)
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground uppercase">
              Mes <span className="text-primary italic">Paiements</span>
            </h1>
            <p className="text-muted-foreground font-medium text-[10px] md:text-base">Suivi financier personnel pour l'année {activeYear}.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-2 rounded-full font-black text-xs md:text-sm w-fit">
              TOTAL : {expectedFee.toLocaleString()} F
            </Badge>
            <Button onClick={generateFullReceipt} disabled={payments.length === 0}
              className="bg-primary text-white h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs shadow-xl active:scale-95 transition-all">
              <FileDown className="mr-2 size-3.5 md:size-4" /> Relevé PDF
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="size-10 md:size-16 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
              <DollarSign className="size-4 md:size-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Versé</p>
              <p className="text-2xl md:text-4xl font-black tabular-nums">{totalPaid.toLocaleString()} <span className="text-[10px] opacity-40">F</span></p>
            </div>
          </Card>
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between border-l-[6px] md:border-l-[10px] border-amber-500">
            <div className="size-10 md:size-16 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
              <Wallet className="size-4 md:size-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reste à payer</p>
              <p className="text-2xl md:text-4xl font-black text-amber-600 tabular-nums">{remaining.toLocaleString()} <span className="text-[10px] opacity-40">F</span></p>
            </div>
          </Card>
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-foreground text-white flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest">Statut</p>
              <p className="text-lg md:text-2xl font-black uppercase">{remaining <= 0 ? "SOLDÉE ✓" : "PARTIEL"}</p>
              <div className="w-full bg-white/10 h-2 md:h-3 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-[7px] md:text-[10px] font-bold text-white/40 mt-1.5">{percent.toFixed(1)}% réglé</p>
            </div>
            <ShieldCheck className="absolute -bottom-10 -right-10 size-32 md:size-48 text-white/5" />
          </Card>
        </div>

        {/* Historique */}
        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
          <div className="p-5 md:p-8 border-b bg-muted/5 flex items-center justify-between">
            <h3 className="text-base md:text-xl font-black flex items-center gap-2">
              <History className="text-primary size-3.5 md:size-4" /> Historique des versements
            </h3>
            <Badge className="bg-primary/10 text-primary font-black text-[8px] rounded-full px-3">
              {payments.length} versement{payments.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <div>
            {loading ? (
              <div className="p-12 text-center animate-pulse font-black text-muted-foreground text-[10px]">Synchronisation...</div>
            ) : payments.length === 0 ? (
              <div className="p-16 text-center space-y-3 opacity-30">
                <Lock className="size-8 md:size-12 text-muted-foreground mx-auto" />
                <p className="text-[10px] font-medium">Aucun versement scellé.</p>
              </div>
            ) : (
              <div className="divide-y divide-muted/20">
                {payments.map((p: any, i: number) => (
                  <div key={i} className="p-4 md:p-6 flex items-center justify-between group hover:bg-muted/5 transition-all">
                    <div className="flex items-center gap-3 md:gap-5 min-w-0">
                      <div className="size-10 md:size-12 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <CheckCircle2 className="size-4 md:size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm md:text-xl tabular-nums">{Number(p.amount_paid).toLocaleString()} F</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[7px] md:text-[9px] font-black border-primary/20 text-primary">
                            {p.note || "Scolarité"}
                          </Badge>
                          <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </span>
                          <Badge className={`text-[6px] font-black rounded-full px-2 border-none ${p.status === 'En attente' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {p.status || "Validé"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* Bouton reçu individuel */}
                    <Button variant="ghost" size="sm" onClick={() => generateReceipt(p)}
                      className="shrink-0 h-9 px-3 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white font-black text-[8px] uppercase transition-all opacity-0 group-hover:opacity-100">
                      <Download className="size-3 mr-1" /> Reçu
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}