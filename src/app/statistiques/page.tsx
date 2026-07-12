"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, GraduationCap, FileDown, Activity, UserCheck, ShieldCheck,
  Wallet, TrendingUp, BarChart3, Loader2, Sparkles, Zap, Clock,
  AlertTriangle, CheckCircle2, BookOpen, Award
} from "lucide-react"
import {
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useMemo, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const LEVELS = [
  { id: "6EME", label: "6EME" },{ id: "5EME", label: "5EME" },{ id: "4EME", label: "4EME" },
  { id: "3EME", label: "3EME" },{ id: "2NDE", label: "2NDE" },{ id: "1ERE", label: "1ERE" },
  { id: "TLE", label: "TERMINALE" }
]

export default function StatisticsModule() {
  const [activeTab, setActiveTab] = useState("synthèse")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [mounted, setMounted] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [classFees, setClassFees] = useState<any[]>([])
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [sanctions, setSanctions] = useState<any[]>([])
  const [conductConfig, setConductConfig] = useState<any>({ note_depart: 20 })
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)

  useEffect(() => {
    setMounted(true)
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  useEffect(() => {
    if (!activeYear) return
    const fetchData = async () => {
      setLoadingStudents(true)
      setLoadingGrades(true)
      const [sRes, gRes, pRes, fRes, cRes, scRes, ccRes] = await Promise.all([
        supabase.from('students').select('*').eq('academic_year', activeYear).eq('status', 'Actif'),
        supabase.from('grades').select('*').eq('academic_year', activeYear),
        supabase.from('payments').select('*').eq('academic_year', activeYear),
        supabase.from('class_fees').select('*').eq('academic_year', activeYear),
        supabase.from('school_settings').select('*').eq('id', 'main_config').single(),
        supabase.from('sanctions').select('*').eq('academic_year', activeYear),
        supabase.from('conduct_config').select('*').eq('id', 'main').single()
      ])
      setStudents(sRes.data || [])
      setGrades(gRes.data || [])
      setPayments(pRes.data || [])
      setClassFees(fRes.data || [])
      if (cRes.data) setSchoolConfig(cRes.data)
      setSanctions(scRes.data || [])
      if (ccRes.data) setConductConfig(ccRes.data)
      setLoadingStudents(false)
      setLoadingGrades(false)
    }
    fetchData()
  }, [activeYear])

  const analysis = useMemo(() => {
    if (!students || !grades) return { 
      totalStudents: 0, globalGPA: "0.00", revenue: 0, payRate: 0, promoData: [], 
      isProvisional: true, completionRate: 0, advancedClasses: [], lateClasses: [],
      subjectStats: [], expectedRevenue: 0
    }

    const classStats: Record<string, { totalGrades: number, expectedGrades: number, sumGPA: number, count: number }> = {}
    const subjectAverages: Record<string, number[]> = {}
    
    const studentAverages = students.map((s: any) => {
      const sGrades = grades.filter(g => g.student_matricule === s.matricule)
      const subjects: Record<string, any> = {}
      
      sGrades.forEach(g => {
        if (!g.type) return
        if (!subjects[g.subject]) {
          subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 2 }
        }
        if (g.type.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
        if (g.type.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
      })

      let totalWeighted = 0, totalCoef = 0
      Object.entries(subjects).forEach(([subName, sub]: [string, any]) => {
        let subAvg = 0
        const avgInt = sub.ints.length > 0 ? sub.ints.reduce((a:number, b:number) => a + b, 0) / sub.ints.length : null
        const blocks = []
        if (avgInt !== null) blocks.push(avgInt)
        sub.devs.forEach((d: number) => blocks.push(d))
        
        if (blocks.length > 0) {
          subAvg = blocks.reduce((a, b) => a + b, 0) / blocks.length
          totalWeighted += subAvg * sub.coef
          totalCoef += sub.coef
          if (!subjectAverages[subName]) subjectAverages[subName] = []
          subjectAverages[subName].push(subAvg)
        }
      })

      // Intégrer la note de conduite (coef 1)
      if (totalCoef > 0) {
        const studentSanctions = sanctions.filter((sc: any) => sc.student_matricule === (s.student_matricule || s.matricule))
        const totalPoints = studentSanctions.reduce((acc: number, sc: any) => acc + Number(sc.points_retranches || 0), 0)
        const conductValue = Math.max(0, (conductConfig.note_depart || 20) - totalPoints)
        totalWeighted += conductValue * 1
        totalCoef += 1
      }
      const gpa = totalCoef > 0 ? totalWeighted / totalCoef : 0

      if (!classStats[s.class_id]) {
        classStats[s.class_id] = { totalGrades: 0, expectedGrades: 0, sumGPA: 0, count: 0 }
      }
      classStats[s.class_id].sumGPA += gpa
      classStats[s.class_id].count++
      classStats[s.class_id].totalGrades += sGrades.length
      classStats[s.class_id].expectedGrades += 5 * 10 

      return gpa
    })

    const classAvgsList = Object.values(classStats).map((cs: any) => cs.count > 0 ? cs.sumGPA / cs.count : 0).filter(v => v > 0)
    const globalGPA = classAvgsList.length > 0 
      ? (classAvgsList.reduce((acc, v) => acc + v, 0) / classAvgsList.length).toFixed(2)
      : "0.00"

    const promoMap: Record<string, { total: number, count: number }> = {}
    students.forEach((s, i) => {
      const level = LEVELS.find(l => s.class_id?.toUpperCase().includes(l.id))?.id || "AUTRE"
      if (!promoMap[level]) promoMap[level] = { total: 0, count: 0 }
      promoMap[level].total += studentAverages[i]
      promoMap[level].count += 1
    })

    const promoData = LEVELS.map(l => ({
      name: l.label,
      avg: promoMap[l.id]?.count > 0 ? Number((promoMap[l.id].total / promoMap[l.id].count).toFixed(2)) : 0
    }))

    const subjectStats = Object.entries(subjectAverages).map(([name, vals]) => ({
      name,
      avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
      count: vals.length
    })).sort((a, b) => b.avg - a.avg)

    const classesList = Object.entries(classStats).map(([id, s]) => ({
      id,
      completion: Math.min(100, Math.round((s.totalGrades / s.expectedGrades) * 100)),
      avg: (s.sumGPA / s.count).toFixed(2)
    }))

    const advancedClasses = [...classesList].sort((a, b) => b.completion - a.completion).slice(0, 3)
    const lateClasses = [...classesList].sort((a, b) => a.completion - b.completion).slice(0, 3)
    const overallCompletion = classesList.length > 0 ? classesList.reduce((a, b) => a + b.completion, 0) / classesList.length : 0

    // Revenu réel basé sur les vrais tarifs par classe
    const expectedRevenue = students.reduce((acc, s) => {
      const fee = classFees.find(f => f.class_id === s.class_id)?.amount || 150000
      return acc + Number(fee)
    }, 0)
    const totalReceived = payments?.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0) || 0

    return { 
      totalStudents: students.length, 
      globalGPA, 
      revenue: totalReceived,
      expectedRevenue,
      payRate: expectedRevenue > 0 ? (totalReceived / expectedRevenue) * 100 : 0,
      promoData,
      isProvisional: overallCompletion < 95,
      completionRate: Math.round(overallCompletion),
      advancedClasses,
      lateClasses,
      subjectStats
    }
  }, [students, grades, payments, classFees, sanctions, conductConfig])

  const exportPDF = () => {
    const doc = new jsPDF()
    const schoolName = schoolConfig?.school_name || "ACADEX"
    const primaryColor: [number, number, number] = [20, 83, 45]
    const W = 210

    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, W, 42, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), 14, 20)
    doc.setFontSize(11)
    doc.text('BILAN STATISTIQUE GLOBAL', 14, 30)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Année : ${activeYear} • Édité le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 30, { align: 'right' })

    // KPIs
    autoTable(doc, {
      startY: 50,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Moyenne École', `${analysis.globalGPA}/20`],
        ['Effectif Actif', `${analysis.totalStudents} élèves`],
        ['Taux de Saisie des Notes', `${analysis.completionRate}%`],
        ['Taux de Recouvrement Financier', `${analysis.payRate.toFixed(1)}%`],
        ['Total Reçu', `${analysis.revenue.toLocaleString()} FCFA`],
        ['Total Attendu', `${analysis.expectedRevenue.toLocaleString()} FCFA`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: primaryColor },
    })

    const y1 = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Performance par Promotion', 14, y1)
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Niveau', 'Moyenne /20']],
      body: analysis.promoData.map(p => [p.name, p.avg.toFixed(2)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: primaryColor },
    })

    const y2 = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Performance par Matière', 14, y2)
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Matière', 'Moyenne /20', 'Nb Élèves Notés']],
      body: analysis.subjectStats.map(s => [s.name, s.avg.toFixed(2), s.count]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: primaryColor },
    })

    doc.save(`bilan-statistique-${activeYear}.pdf`)
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-5 md:p-14 rounded-[1.8rem] md:rounded-[3.5rem] shadow-sm border-2 border-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <BarChart3 className="size-32 md:size-64" />
          </div>
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-full text-[8px] md:text-xs">
                <Activity className="size-2.5 mr-1.5" /> PILOTAGE STRATÉGIQUE
              </Badge>
              {analysis.isProvisional && (
                <Badge className="bg-amber-500 text-white border-none font-black px-3 py-1 rounded-full text-[8px] md:text-xs animate-pulse">
                  <AlertTriangle className="size-2.5 mr-1.5" /> DONNÉES PROVISOIRES
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Analyse <span className="text-primary italic">Globale</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" /> Audit Certifié • {activeYear}
            </div>
          </div>
          <Button onClick={exportPDF} className="w-full md:w-auto bg-primary hover:bg-primary/90 h-11 md:h-16 px-6 md:px-12 rounded-xl md:rounded-2xl font-black text-[10px] md:text-lg shadow-xl active:scale-95 transition-all">
             <FileDown className="mr-2 size-4 md:size-5" /> Exporter Bilan
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.2rem] md:rounded-[2.5rem] h-11 md:h-18 p-1 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "synthèse", label: "Synthèse", icon: Activity },
              { id: "académique", label: "Notes", icon: GraduationCap },
              { id: "audit", label: "Audit Saisie", icon: Clock },
              { id: "finance", label: "Finances", icon: Wallet },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-lg md:rounded-[2rem] font-black px-4 md:px-10 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5 md:gap-3 shrink-0">
                <t.icon className="size-3.5 md:size-4.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── SYNTHÈSE ── */}
          <TabsContent value="synthèse" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {[
                { label: "Moyenne École", value: analysis.globalGPA, suffix: "/20", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", loading: loadingGrades },
                { label: "Saisie Notes", value: analysis.completionRate, suffix: "%", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Effectif", value: analysis.totalStudents, suffix: " Élèves", icon: Users, color: "text-purple-600", bg: "bg-purple-50", loading: loadingStudents },
              ].map((kpi, i) => (
                <Card key={i} className="p-4 md:p-9 rounded-[1.5rem] md:rounded-[3rem] border-none shadow-sm bg-white group hover:shadow-xl transition-all relative overflow-hidden h-28 md:h-48 flex flex-col justify-between">
                  <div className={cn("absolute -top-4 -right-4 size-14 md:size-24 rounded-full opacity-[0.04]", kpi.bg)} />
                  <div className="flex items-center justify-between relative z-10">
                    <div className={cn("p-2 md:p-3.5 rounded-xl md:rounded-2xl shadow-sm transition-all group-hover:bg-primary group-hover:text-white", kpi.bg, kpi.color)}>
                      <kpi.icon className="size-3.5 md:size-5" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{kpi.label}</p>
                    <h3 className="text-xs md:text-3xl font-black text-foreground tabular-nums truncate">
                      {kpi.loading ? "..." : kpi.value}<span className="text-[6px] md:text-sm opacity-40 ml-0.5">{kpi.suffix}</span>
                    </h3>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3.5rem] p-5 md:p-14">
                 <h3 className="text-base md:text-3xl font-black text-foreground tracking-tight mb-8 md:mb-14 flex items-center gap-3">
                    <TrendingUp className="text-primary size-4 md:size-7" /> Performance par Promotion
                 </h3>
                 <div className="h-[240px] md:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.promoData}>
                        <defs>
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14532d" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#14532d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '900'}} dy={10} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '700'}} />
                        <Tooltip contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 15px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="avg" name="Moyenne" stroke="#14532d" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-xl bg-foreground text-white rounded-[2.2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between h-full group">
                  <div className="relative z-10 space-y-8">
                    <div className="size-12 md:size-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-inner">
                      <Sparkles className="size-5 md:size-8 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase">Cerveau <span className="text-primary italic">ACADEX</span></h3>
                      <p className="text-white/60 text-[10px] md:text-sm font-medium leading-relaxed italic border-l-3 border-primary pl-4">
                        "L'analyse des registres montre une progression {analysis.globalGPA >= "10" ? "positive" : "à surveiller"}. {analysis.completionRate}% des notes sont déjà scellées."
                      </p>
                    </div>
                  </div>
                  <BarChart3 className="absolute -bottom-10 -right-10 size-40 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── ACADÉMIQUE / NOTES ── */}
          <TabsContent value="académique" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3.5rem] p-5 md:p-14">
              <h3 className="text-base md:text-3xl font-black mb-8 md:mb-14 flex items-center gap-3">
                <BookOpen className="text-primary size-4 md:size-7" /> Performance par Matière
              </h3>
              {analysis.subjectStats.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-black uppercase text-sm">Aucune note saisie pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="h-[300px] md:h-[400px] w-full mb-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.subjectStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '700'}} angle={-20} textAnchor="end" height={60} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 8}} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px' }} />
                        <Bar dataKey="avg" name="Moyenne" fill="#14532d" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {analysis.subjectStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl">
                        <span className="font-black text-sm uppercase">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-muted-foreground">{s.count} notes</span>
                          <Badge className={cn("font-black", s.avg >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                            {s.avg.toFixed(2)}/20
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* ── AUDIT SAISIE ── */}
          <TabsContent value="audit" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
             <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
                <Card className="p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] bg-white border-none shadow-sm">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm"><CheckCircle2 className="size-6" /></div>
                      <h3 className="text-lg md:text-2xl font-black uppercase">Classes Avancées</h3>
                   </div>
                   <div className="space-y-4">
                      {analysis.advancedClasses.length === 0 ? (
                        <p className="text-center py-10 opacity-30 font-black text-xs uppercase">Aucune donnée</p>
                      ) : analysis.advancedClasses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="font-black text-xl text-primary">{c.id}</span>
                              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black">{c.avg}/20</Badge>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Remplissage</p>
                              <Progress value={c.completion} className="h-2 w-32 md:w-40" />
                              <span className="text-xs font-black text-primary mt-1 inline-block">{c.completion}%</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>

                <Card className="p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] bg-white border-none shadow-sm">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="size-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm"><AlertTriangle className="size-6" /></div>
                      <h3 className="text-lg md:text-2xl font-black uppercase">Classes en Retard</h3>
                   </div>
                   <div className="space-y-4">
                      {analysis.lateClasses.length === 0 ? (
                        <p className="text-center py-10 opacity-30 font-black text-xs uppercase">Aucune donnée</p>
                      ) : analysis.lateClasses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-red-100 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="font-black text-xl text-foreground">{c.id}</span>
                              <Badge variant="outline" className="font-black border-muted-foreground/20">{c.avg}/20</Badge>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Remplissage</p>
                              <Progress value={c.completion} className="h-2 w-32 md:w-40" />
                              <span className="text-xs font-black text-red-600 mt-1 inline-block">{c.completion}%</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
          </TabsContent>

          {/* ── FINANCES ── */}
          <TabsContent value="finance" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[
                { label: "Total Reçu", value: analysis.revenue.toLocaleString(), suffix: " F", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Attendu", value: analysis.expectedRevenue.toLocaleString(), suffix: " F", icon: Award, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Taux Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Reste à Percevoir", value: Math.max(0, analysis.expectedRevenue - analysis.revenue).toLocaleString(), suffix: " F", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              ].map((kpi, i) => (
                <Card key={i} className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white">
                  <div className={cn("p-2.5 rounded-xl w-fit mb-4", kpi.bg, kpi.color)}>
                    <kpi.icon className="size-4" />
                  </div>
                  <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-lg md:text-2xl font-black truncate">{kpi.value}<span className="text-[8px] opacity-40">{kpi.suffix}</span></h3>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8 md:p-14">
              <h3 className="text-base md:text-2xl font-black mb-8 flex items-center gap-3">
                <Wallet className="text-primary size-5" /> Progression du Recouvrement
              </h3>
              <div className="w-full bg-muted/30 h-6 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary transition-all duration-1000 flex items-center justify-end pr-3" style={{ width: `${Math.min(100, analysis.payRate)}%` }}>
                  {analysis.payRate > 15 && <span className="text-white text-[9px] font-black">{analysis.payRate.toFixed(0)}%</span>}
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {analysis.revenue.toLocaleString()} F reçus sur {analysis.expectedRevenue.toLocaleString()} F attendus
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}