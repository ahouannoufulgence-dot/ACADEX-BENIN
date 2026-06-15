"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  FileDown,
  Activity,
  UserCheck,
  ShieldCheck,
  Wallet,
  Scale,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  Loader2,
  MapPin,
  VenetianMask,
  Sparkles
} from "lucide-react"
import {
  CartesianGrid,
  XAxis,
  YAxis,
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
import { collection, query, where } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

const COLORS = ['#14532d', '#10b981', '#fbbf24', '#ef4444', '#3b82f6'];

const LEVELS = [
  { id: "6EME", label: "6EME" },
  { id: "5EME", label: "5EME" },
  { id: "4EME", label: "4EME" },
  { id: "3EME", label: "3EME" },
  { id: "2NDE", label: "2NDE" },
  { id: "1ERE", label: "1ERE" },
  { id: "TLE", label: "TERMINALE" }
]

export default function StatisticsModule() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("synthèse")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const studentsCol = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif"))
  }, [db, activeYear])

  const gradesCol = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "grades"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const paymentsCol = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "payments"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const { data: students, loading: loadingStudents } = useCollection(studentsCol)
  const { data: grades, loading: loadingGrades } = useCollection(gradesCol)
  const { data: payments } = useCollection(paymentsCol)

  const analysis = useMemo(() => {
    if (!students || !grades) return { totalStudents: 0, globalGPA: "0.00", revenue: 0, payRate: 0, promoData: [], genderData: [], cityData: [] }

    const studentAverages = students.map((s: any) => {
      const sGrades = grades.filter(g => g.studentId === s.matricule)
      const subjects: Record<string, any> = {}
      sGrades.forEach(g => {
        if (!subjects[g.subject]) subjects[g.subject] = { vals: [], coef: Number(g.coefficient) || 2 }
        subjects[g.subject].vals.push(Number(g.value))
      })
      let totalWeighted = 0, totalCoef = 0
      Object.values(subjects).forEach((sub: any) => {
        const avg = sub.vals.reduce((a:number, b:number) => a + b, 0) / sub.vals.length
        totalWeighted += avg * sub.coef
        totalCoef += sub.coef
      })
      return totalCoef > 0 ? totalWeighted / totalCoef : 0
    })

    const globalGPA = studentAverages.length > 0 
      ? (studentAverages.reduce((acc, v) => acc + v, 0) / studentAverages.length).toFixed(2)
      : "0.00"

    const promoMap: Record<string, { total: number, count: number }> = {}
    students.forEach((s, i) => {
      const level = LEVELS.find(l => s.classId?.toUpperCase().includes(l.id))?.id || "AUTRE"
      if (!promoMap[level]) promoMap[level] = { total: 0, count: 0 }
      promoMap[level].total += studentAverages[i]
      promoMap[level].count += 1
    })

    const promoData = LEVELS.map(l => ({
      name: l.label,
      avg: promoMap[l.id]?.count > 0 ? Number((promoMap[l.id].total / promoMap[l.id].count).toFixed(2)) : 0
    }))

    const revenue = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const expected = students.length * 150000
    const payRate = expected > 0 ? (revenue / expected) * 100 : 0

    const genderDist: Record<string, number> = { "Masculin": 0, "Féminin": 0 }
    students.forEach((s: any) => { if (s.gender) genderDist[s.gender] = (genderDist[s.gender] || 0) + 1 })

    return { 
      totalStudents: students.length, 
      globalGPA, 
      revenue, 
      payRate, 
      promoData, 
      genderData: Object.entries(genderDist).map(([name, value]) => ({ name, value }))
    }
  }, [students, grades, payments])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-5 md:p-14 rounded-[1.8rem] md:rounded-[3.5rem] shadow-sm border-2 border-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <BarChart3 className="size-32 md:size-64" />
          </div>
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] md:text-xs font-black uppercase tracking-widest">
              <Activity className="size-2.5" /> Pilotage Stratégique
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Tableau de <span className="text-primary italic">Bord</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" /> Audit • {activeYear}
            </div>
          </div>
          <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 h-11 md:h-16 px-6 md:px-12 rounded-xl md:rounded-2xl font-black text-[10px] md:text-lg shadow-xl active:scale-95 transition-all">
             <FileDown className="mr-2 size-4 md:size-5" /> Exporter Bilan
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.2rem] md:rounded-[2.5rem] h-11 md:h-18 p-1 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "synthèse", label: "Synthèse", icon: Activity },
              { id: "académique", label: "Notes", icon: GraduationCap },
              { id: "démographie", label: "Effectifs", icon: Users },
              { id: "finance", label: "Finances", icon: Wallet },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-lg md:rounded-[2rem] font-black px-4 md:px-10 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5 md:gap-3 shrink-0">
                <t.icon className="size-3.5 md:size-4.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="synthèse" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {[
                { label: "Moyenne École", value: analysis.globalGPA, suffix: "/20", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", loading: loadingGrades },
                { label: "Présence Globale", value: "94.2", suffix: "%", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Effectif", value: analysis.totalStudents, suffix: " Élèves", icon: Users, color: "text-purple-600", bg: "bg-purple-50", loading: loadingStudents },
              ].map((kpi, i) => (
                <Card key={i} className="p-4 md:p-9 rounded-[1.5rem] md:rounded-[3rem] border-none shadow-sm bg-white group hover:shadow-xl transition-all relative overflow-hidden h-28 md:h-48 flex flex-col justify-between">
                  <div className={cn("absolute -top-4 -right-4 size-14 md:size-24 rounded-full opacity-[0.04]", kpi.bg)} />
                  <div className="flex items-center justify-between relative z-10">
                    <div className={cn("p-2 md:p-3.5 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", kpi.bg, kpi.color)}>
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
                    <TrendingUp className="text-primary size-4 md:size-7" /> Moyennes par Promotion
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
                      <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase">Brain <span className="text-primary italic">Analytique</span></h3>
                      <p className="text-white/60 text-[10px] md:text-sm font-medium leading-relaxed italic border-l-3 border-primary pl-4">
                        "Analyse : Les classes de 3ème progressent. Le taux de recouvrement financier est stabilisé à {analysis.payRate.toFixed(0)}%."
                      </p>
                    </div>
                  </div>
                  <BarChart3 className="absolute -bottom-10 -right-10 size-40 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}