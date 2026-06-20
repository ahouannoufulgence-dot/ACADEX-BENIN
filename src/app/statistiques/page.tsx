
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
  TrendingUp,
  BarChart3,
  Loader2,
  Sparkles,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useMemo, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

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
  const [activeTab, setActiveTab] = useState("synthèse")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [mounted, setMounted] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
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
      const [sRes, gRes, pRes] = await Promise.all([
        supabase.from('students').select('*').eq('academic_year', activeYear).eq('status', 'Actif'),
        supabase.from('grades').select('*').eq('academic_year', activeYear),
        supabase.from('payments').select('*').eq('academic_year', activeYear)
      ])
      setStudents(sRes.data || [])
      setGrades(gRes.data || [])
      setPayments(pRes.data || [])
      setLoadingStudents(false)
      setLoadingGrades(false)
    }
    fetchData()
  }, [activeYear])

  const analysis = useMemo(() => {
    if (!students || !grades) return { 
      totalStudents: 0, globalGPA: "0.00", revenue: 0, payRate: 0, promoData: [], 
      isProvisional: true, completionRate: 0, advancedClasses: [], lateClasses: [] 
    }

    const classStats: Record<string, { totalGrades: number, expectedGrades: number, sumGPA: number, count: number }> = {}
    
    const studentAverages = students.map((s: any) => {
      const sGrades = grades.filter(g => g.student_matricule === s.matricule)
      const subjects: Record<string, any> = {}
      
      sGrades.forEach(g => {
        if (!subjects[g.subject]) {
          subjects[g.subject] = { 
            ints: [], 
            devs: [], 
            coef: Number(g.coefficient) || 2 
          }
        }
        if (g.type.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
        if (g.type.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
      })

      let totalWeighted = 0, totalCoef = 0
      Object.values(subjects).forEach((sub: any) => {
        let subAvg = 0
        const avgInt = sub.ints.length > 0 ? sub.ints.reduce((a:number, b:number) => a + b, 0) / sub.ints.length : null
        
        const blocks = []
        if (avgInt !== null) blocks.push(avgInt)
        sub.devs.forEach((d: number) => blocks.push(d))
        
        if (blocks.length > 0) {
          subAvg = blocks.reduce((a, b) => a + b, 0) / blocks.length
          totalWeighted += subAvg * sub.coef
          totalCoef += sub.coef
        }
      })

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

    const globalGPA = studentAverages.length > 0 
      ? (studentAverages.reduce((acc, v) => acc + v, 0) / studentAverages.length).toFixed(2)
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

    const classesList = Object.entries(classStats).map(([id, s]) => ({
      id,
      completion: Math.min(100, Math.round((s.totalGrades / s.expectedGrades) * 100)),
      avg: (s.sumGPA / s.count).toFixed(2)
    }))

    const advancedClasses = [...classesList].sort((a, b) => b.completion - a.completion).slice(0, 3)
    const lateClasses = [...classesList].sort((a, b) => a.completion - b.completion).slice(0, 3)
    const overallCompletion = classesList.length > 0 ? classesList.reduce((a, b) => a + b.completion, 0) / classesList.length : 0

    return { 
      totalStudents: students.length, 
      globalGPA, 
      revenue: payments?.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0) || 0,
      payRate: (students.length > 0 ? (payments?.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0) || 0) / (students.length * 150000) * 100 : 0),
      promoData,
      isProvisional: overallCompletion < 95,
      completionRate: Math.round(overallCompletion),
      advancedClasses,
      lateClasses
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
          <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 h-11 md:h-16 px-6 md:px-12 rounded-xl md:rounded-2xl font-black text-[10px] md:text-lg shadow-xl active:scale-95 transition-all">
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
                    <div className={cn("p-2 md:p-3.5 rounded-xl md:rounded-2xl shadow-sm transition-all group-hover:bg-primary group-hover:text-white shadow-sm", kpi.bg, kpi.color)}>
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
                        "L'analyse des registres montre une progression stable. {analysis.completionRate}% des notes sont déjà scellées, permettant une vision de pilotage fiable."
                      </p>
                    </div>
                  </div>
                  <BarChart3 className="absolute -bottom-10 -right-10 size-40 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
             <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
                <Card className="p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] bg-white border-none shadow-sm">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm"><CheckCircle2 className="size-6" /></div>
                      <h3 className="text-lg md:text-2xl font-black uppercase">Classes Avancées</h3>
                   </div>
                   <div className="space-y-4">
                      {analysis.advancedClasses.map((c, i) => (
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
                      {analysis.lateClasses.map((c, i) => (
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
