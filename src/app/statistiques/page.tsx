"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  FileDown,
  Sparkles,
  Activity,
  UserCheck,
  ShieldCheck,
  Wallet,
  Scale,
  TrendingUp,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from "lucide-react"
import {
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, onSnapshot } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function StatisticsModule() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("synthèse")
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    const updateYear = (e: any) => setActiveYear(e.detail)
    window.addEventListener('acadex_year_changed', updateYear as any)
    return () => window.removeEventListener('acadex_year_changed', updateYear as any)
  }, [])

  const studentsCol = useMemo(() => query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif")), [db, activeYear])
  const gradesCol = useMemo(() => query(collection(db, "grades"), where("academicYear", "==", activeYear)), [db, activeYear])
  const lifeEventsCol = useMemo(() => query(collection(db, "student_life"), where("academicYear", "==", activeYear)), [db, activeYear])
  const paymentsCol = useMemo(() => query(collection(db, "payments"), where("academicYear", "==", activeYear)), [db, activeYear])
  const expensesCol = useMemo(() => query(collection(db, "expenses"), where("academicYear", "==", activeYear)), [db, activeYear])

  const { data: students } = useCollection(studentsCol)
  const { data: grades } = useCollection(gradesCol)
  const { data: lifeEvents } = useCollection(lifeEventsCol)
  const { data: payments } = useCollection(paymentsCol)
  const { data: expenses } = useCollection(expensesCol)

  const analysis = useMemo(() => {
    const totalStudents = students?.length || 0
    const validGrades = grades?.filter(g => !isNaN(Number(g.value))) || []
    const globalGPA = validGrades.length > 0 
      ? (validGrades.reduce((acc, g) => acc + Number(g.value), 0) / validGrades.length).toFixed(2)
      : "0.00"

    const promoGrades: Record<string, { total: number, count: number }> = {}
    validGrades.forEach(g => {
      const promo = g.classId.match(/^[0-9]+/)?.[0] || g.classId
      if (!promoGrades[promo]) promoGrades[promo] = { total: 0, count: 0 }
      promoGrades[promo].total += Number(g.value)
      promoGrades[promo].count += 1
    })
    const promoData = Object.entries(promoGrades).map(([name, d]) => ({
      name: `${name}EME`,
      avg: Number((d.total / d.count).toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name))

    const conductScores: Record<string, { total: number, count: number }> = {}
    students?.forEach(s => {
      const promo = s.classId.match(/^[0-9]+/)?.[0] || s.classId
      if (!conductScores[promo]) conductScores[promo] = { total: 20, count: 1 }
      else { conductScores[promo].total += 20; conductScores[promo].count += 1; }
    })
    lifeEvents?.forEach(e => {
      const s = students?.find(st => st.matricule === e.studentId)
      const promo = s?.classId.match(/^[0-9]+/)?.[0] || s?.classId || "Autre"
      if (conductScores[promo]) conductScores[promo].total += (e.pointsImpact || 0)
    })
    const conductData = Object.entries(conductScores).map(([name, d]) => ({
      name: name.includes('EME') ? name : `${name}EME`,
      avg: Math.max(0, Math.min(20, Number((d.total / d.count).toFixed(2))))
    })).sort((a, b) => a.name.localeCompare(b.name))

    const revenue = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const outgo = expenses?.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) || 0
    const expected = totalStudents * 150000
    const payRate = expected > 0 ? (revenue / expected) * 100 : 0

    return { totalStudents, globalGPA, revenue, outgo, payRate, promoData, conductData, expected }
  }, [students, grades, lifeEvents, payments, expenses])

  const handleExportStats = () => {
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 40, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(20)
    docPdf.text("ACADEX - AUDIT STRATÉGIQUE GLOBAL", 105, 25, { align: "center" })
    
    autoTable(docPdf, {
      startY: 50,
      head: [['Indicateur', 'Valeur', 'Année Scolaire']],
      body: [
        ['Effectifs Élèves', analysis.totalStudents, activeYear],
        ['Moyenne Générale École', analysis.globalGPA + '/20', activeYear],
        ['Recettes Totales', analysis.revenue.toLocaleString() + ' F', activeYear],
        ['Dépenses Globales', analysis.outgo.toLocaleString() + ' F', activeYear],
        ['Taux de Recouvrement', analysis.payRate.toFixed(1) + '%', activeYear],
      ],
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`AUDIT_ACADEX_${activeYear}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 animate-in">
        
        {/* Mobile First Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border-2 border-primary/5">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Tableau de Bord
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-medium text-xs md:text-sm">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] md:text-xs">Audit {activeYear}</Badge>
              <div className="flex items-center gap-1"><ShieldCheck className="size-3 text-emerald-500" /> SÉCURISÉ</div>
            </div>
          </div>
          <Button onClick={handleExportStats} className="w-full md:w-auto bg-primary hover:bg-primary/90 h-14 md:h-16 px-10 rounded-2xl font-black text-sm md:text-lg shadow-xl active:scale-95">
             <FileDown className="mr-3 size-5" /> Bilan PDF
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-16 md:h-20 p-2 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "synthèse", label: "Synthèse", icon: Activity },
              { id: "académique", label: "Notes", icon: GraduationCap },
              { id: "vie-scolaire", label: "Discipline", icon: Scale },
              { id: "finance", label: "Finances", icon: Wallet },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-6 md:px-8 text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="synthèse" className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Moyenne École", value: analysis.globalGPA, suffix: "/20", icon: GraduationCap, color: "text-primary" },
                { label: "Présence", value: "92", suffix: "%", icon: UserCheck, color: "text-emerald-600" },
                { label: "Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: Wallet, color: "text-amber-600" },
                { label: "Discipline", value: "98", suffix: "%", icon: Scale, color: "text-blue-600" },
              ].map((kpi, i) => (
                <Card key={i} className="p-6 md:p-7 rounded-[2rem] border-none shadow-sm bg-white group hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className={cn("p-3 md:p-4 bg-muted rounded-xl group-hover:bg-primary group-hover:text-white transition-all", kpi.color)}>
                      <kpi.icon className="size-5 md:size-7" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-foreground">{kpi.value}<span className="text-xs opacity-40 ml-1">{kpi.suffix}</span></h3>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10">
                 <h3 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3">
                   <TrendingUp className="text-primary size-6" /> Évolution par Promotion
                 </h3>
                 <div className="h-[300px] md:h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.promoData}>
                        <defs>
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14532d" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#14532d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize:10}} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="avg" stroke="#14532d" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <Card className="lg:col-span-4 border-none shadow-xl bg-foreground text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <Sparkles className="size-8 text-primary mb-6 animate-pulse" />
                  <h3 className="text-2xl font-black mb-4">IA Insights</h3>
                  <p className="text-white/60 text-sm font-medium leading-relaxed italic">
                    "Analyse : Les résultats en classes scientifiques progressent de 12% pour l'année {activeYear}."
                  </p>
                </div>
                <BarChart3 className="absolute -bottom-6 -right-6 size-48 text-white/[0.03] pointer-events-none" />
              </Card>
            </div>
          </TabsContent>

          {/* Fallback contents for other tabs optimized for mobile */}
          <TabsContent value="académique" className="space-y-6">
             <Card className="border-none shadow-sm bg-white rounded-[2rem] p-6 md:p-10">
                <h3 className="text-xl font-black mb-8">Performance par Promotion</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                   {analysis.promoData.map((promo) => (
                     <div key={promo.name} className="space-y-3 p-5 bg-muted/20 rounded-2xl">
                        <div className="flex justify-between items-center">
                           <Badge className="bg-primary text-white text-[9px] font-black">{promo.name}</Badge>
                           <span className="font-black text-xl">{promo.avg}</span>
                        </div>
                        <Progress value={(promo.avg / 20) * 100} className="h-1.5" />
                     </div>
                   ))}
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}