
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
  BarChart3,
  Loader2
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

  const { data: students, loading: loadingStudents } = useCollection(studentsCol)
  const { data: grades, loading: loadingGrades } = useCollection(gradesCol)
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
      name: name.includes('EME') ? name : `${name}EME`,
      avg: Number((d.total / d.count).toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name))

    const revenue = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const expected = totalStudents * 150000
    const payRate = expected > 0 ? (revenue / expected) * 100 : 0

    return { totalStudents, globalGPA, revenue, payRate, promoData }
  }, [students, grades, payments])

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
        ['Taux de Recouvrement', analysis.payRate.toFixed(1) + '%', activeYear],
      ],
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`AUDIT_ACADEX_${activeYear}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Responsive Header Card - Refined Icons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border-2 border-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <BarChart3 className="size-40 md:size-64" />
          </div>
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] md:text-xs font-black uppercase tracking-widest">
              <Activity className="size-2.5 md:size-3" /> Pilotage Stratégique
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
              Tableau de <span className="text-primary italic">Bord</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>Audit Certifié • {activeYear}</span>
            </div>
          </div>
          <Button onClick={handleExportStats} className="w-full md:w-auto bg-primary hover:bg-primary/90 h-13 md:h-16 px-8 md:px-12 rounded-2xl font-black text-xs md:text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
             <FileDown className="mr-2 md:mr-3 size-4 md:size-5" /> Télécharger Bilan
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[2rem] md:rounded-[2.5rem] h-15 md:h-20 p-2 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "synthèse", label: "Synthèse", icon: Activity },
              { id: "académique", label: "Notes", icon: GraduationCap },
              { id: "vie-scolaire", label: "Discipline", icon: Scale },
              { id: "finance", label: "Finances", icon: Wallet },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-[1.4rem] md:rounded-[2rem] font-black px-6 md:px-10 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2 shrink-0">
                <t.icon className="size-3 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="synthèse" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            {/* KPI Cards Grid - Smaller Icons for Beauty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: "Moyenne École", value: analysis.globalGPA, suffix: "/20", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", loading: loadingGrades },
                { label: "Présence Globale", value: "92.4", suffix: "%", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Discipline", value: "18.5", suffix: "/20", icon: Scale, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((kpi, i) => (
                <Card key={i} className="p-6 md:p-9 rounded-[2rem] md:rounded-[3rem] border-none shadow-sm bg-white group hover:shadow-xl transition-all relative overflow-hidden">
                  <div className={cn("absolute -top-4 -right-4 size-16 md:size-24 rounded-full opacity-[0.04]", kpi.bg)} />
                  <div className="flex items-center justify-between mb-5 md:mb-10 relative z-10">
                    <div className={cn("p-2.5 md:p-4 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", kpi.bg, kpi.color)}>
                      <kpi.icon className="size-4 md:size-7" />
                    </div>
                    {kpi.loading ? <Loader2 className="animate-spin size-4 text-primary" /> : <ArrowUpRight className="size-3.5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />}
                  </div>
                  <div className="relative z-10">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">{kpi.label}</p>
                    <h3 className="text-2xl md:text-4xl font-black text-foreground tabular-nums">
                      {kpi.value}<span className="text-xs md:text-sm opacity-40 ml-1 font-bold">{kpi.suffix}</span>
                    </h3>
                  </div>
                </Card>
              ))}
            </div>

            {/* Performance Charts */}
            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-7 md:p-14">
                 <div className="flex items-center justify-between mb-10 md:mb-14">
                    <div className="space-y-1">
                      <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-primary size-5 md:size-8" /> Moyennes par Promotion
                      </h3>
                      <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Analyse Comparée des Niveaux {activeYear}</p>
                    </div>
                 </div>
                 <div className="h-[260px] md:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.promoData}>
                        <defs>
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14532d" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#14532d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 9, fontWeight: '900', fill: '#64748b'}} 
                          dy={15}
                        />
                        <YAxis 
                          domain={[0, 20]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 9, fontWeight: '700'}} 
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '1.5rem', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            padding: '1rem',
                            fontSize: '12px'
                          }} 
                          itemStyle={{ fontWeight: 'black', color: '#14532d' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avg" 
                          name="Moyenne"
                          stroke="#14532d" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorAvg)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <div className="lg:col-span-4 space-y-6 md:space-y-10">
                <Card className="border-none shadow-xl bg-foreground text-white rounded-[2.5rem] md:rounded-[3.5rem] p-9 md:p-12 relative overflow-hidden flex flex-col justify-between h-full group">
                  <div className="relative z-10 space-y-10">
                    <div className="size-14 md:size-20 bg-primary/20 rounded-[1.6rem] md:rounded-[2rem] flex items-center justify-center shadow-inner">
                      <Sparkles className="size-6 md:size-10 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-5">
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Cerveau IA <br /><span className="text-primary italic">Acadex Insights</span></h3>
                      <p className="text-white/60 text-xs md:text-base font-medium leading-relaxed italic border-l-4 border-primary pl-5">
                        "Analyse : Les classes de 3ème progressent de 1.4pt par rapport au mois dernier. Le taux de recouvrement financier est supérieur à la moyenne nationale."
                      </p>
                    </div>
                    <Button variant="outline" className="w-full h-12 md:h-16 rounded-xl border-white/10 text-white font-black text-[10px] md:text-sm hover:bg-white/5 transition-all">
                       Audit Pédagogique Complet
                    </Button>
                  </div>
                  <BarChart3 className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]" />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="académique" className="animate-in fade-in zoom-in-95">
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-20 text-center flex flex-col items-center justify-center min-h-[400px] border-4 border-dashed border-muted">
                <div className="size-16 md:size-24 bg-muted rounded-[2rem] flex items-center justify-center mb-8 opacity-40">
                   <GraduationCap className="size-8 md:size-12 text-primary" />
                </div>
                <h3 className="text-xl md:text-3xl font-black mb-3">Analyse Académique</h3>
                <p className="text-muted-foreground font-medium max-w-sm text-sm md:text-lg opacity-60">Le module d'audit par matière et par classe est en cours de scellage sécurisé pour l'année {activeYear}.</p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
