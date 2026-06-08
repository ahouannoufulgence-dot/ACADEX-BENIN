"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  ShieldCheck,
  TrendingUp,
  Zap,
  Loader2,
  Trophy,
  Award,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from "recharts"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [activeTerm, setActiveTab] = useState("T1")
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    const matricule = localStorage.getItem('acadex_user_id') || ""
    setStudentId(matricule)
    const parts = matricule.split('-')
    if (parts.length >= 2) setStudentClass(parts[1])
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  // 1. MES NOTES RÉELLES
  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  // 2. VIE SCOLAIRE POUR LA CONDUITE
  const myLifeEventsQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "student_life"), where("studentId", "==", studentId), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  // 3. TOUTES LES NOTES (Pour calcul moyenne promotion et classe min/max)
  const allGradesQuery = useMemo(() => {
    if (!db) return null
    return query(collection(db, "grades"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)
  const { data: allGrades } = useCollection(allGradesQuery)
  const { data: myLifeEvents } = useCollection(myLifeEventsQuery)

  // LOGIQUE DE CALCUL AVEC CONDUITE AUTOMATISÉE
  const analysis = useMemo(() => {
    if (!myGrades || !allGrades) return null
    
    const myTermGrades = myGrades.filter((g: any) => g.term === activeTerm)
    const allTermGrades = allGrades.filter((g: any) => g.term === activeTerm)

    // CALCUL DE LA NOTE DE CONDUITE RÉELLE (Base 20)
    let conductGradeValue = 20
    if (myLifeEvents) {
      myLifeEvents.forEach((e: any) => {
        if (e.pointsImpact) conductGradeValue += Number(e.pointsImpact)
      })
    }
    conductGradeValue = Math.max(0, Math.min(20, conductGradeValue))

    const calcAvg = (gradeList: any[], isMe: boolean = false) => {
      const subs: Record<string, any> = {}
      gradeList.forEach((g: any) => {
        const sub = g.subject
        if (!subs[sub]) subs[sub] = { vals: [], coef: Number(g.coefficient) || 1 }
        subs[sub].vals.push(Number(g.value))
      })
      
      let totalW = 0, totalC = 0
      Object.values(subs).forEach((s: any) => {
        const avgSub = s.vals.reduce((a:number, b:number)=>a+b, 0) / s.vals.length
        totalW += avgSub * s.coef
        totalC += s.coef
      })

      // INJECTION DE LA CONDUITE (COEF 1)
      totalW += (isMe ? conductGradeValue : 15) * 1
      totalC += 1

      return totalC > 0 ? (totalW / totalC) : 0
    }

    const myAvg = calcAvg(myTermGrades, true)
    const classAvg = calcAvg(allTermGrades.filter((g: any) => g.classId === studentClass))

    const subjects: Record<string, any> = {}
    myTermGrades.forEach((g: any) => {
      const sub = g.subject
      if (!subjects[sub]) subjects[sub] = { name: sub, coef: Number(g.coefficient) || 1, vals: [] }
      subjects[sub].vals.push(Number(g.value))
    })

    const subjectList = Object.values(subjects).map((s: any) => {
      s.myAverage = s.vals.reduce((a:number, b:number)=>a+b, 0) / s.vals.length
      const classSubGrades = allTermGrades.filter((g: any) => g.subject === s.name && g.classId === studentClass)
      const classVals = classSubGrades.map((g:any) => Number(g.value))
      s.classMax = classVals.length > 0 ? Math.max(...classVals) : 20
      s.classMin = classVals.length > 0 ? Math.min(...classVals) : 0
      
      s.chartData = [
        { name: "Min", val: Number(s.classMin.toFixed(2)), fill: "#ef4444" },
        { name: "Moi", val: Number(s.myAverage.toFixed(2)), fill: "#14532d" },
        { name: "Max", val: Number(s.classMax.toFixed(2)), fill: "#10b981" },
      ]
      return s
    })

    // AJOUTER LA CONDUITE EN TÊTE DE LISTE
    subjectList.unshift({
      name: "CONDUITE (Cahier de Vie)",
      coef: 1,
      myAverage: conductGradeValue,
      classMin: 12,
      classMax: 20,
      chartData: [
        { name: "Min", val: 12, fill: "#ef4444" },
        { name: "Moi", val: Number(conductGradeValue.toFixed(2)), fill: "#14532d" },
        { name: "Max", val: 20, fill: "#10b981" },
      ]
    })

    return { myAvg, classAvg, subjects: subjectList }
  }, [myGrades, allGrades, myLifeEvents, activeTerm, studentClass, activeYear])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header - Immersive */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Acadex</span></h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Notes incluant la <b>Conduite</b></span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-primary text-white p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-2xl shadow-primary/20 flex flex-col items-center justify-center min-w-[160px] md:min-w-[240px] group transition-all hover:scale-105 active:scale-95">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Moyenne Générale</p>
              <h2 className="text-3xl md:text-5xl font-black tabular-nums">{analysis?.myAvg.toFixed(2) || "0.00"}</h2>
            </div>
            <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-2">Année Scolaire {activeYear}</p>
          </div>
        </div>

        {/* Quick Stats Grid - Micro Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
           <Card className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                <ClipboardList className="size-20 md:size-32" />
              </div>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6 relative z-10">Note de Conduite</p>
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-3xl md:text-5xl font-black text-primary tabular-nums">{analysis?.subjects[0]?.myAverage.toFixed(2) || "20.00"}</h3>
                <div className="size-10 md:size-14 bg-primary/5 text-primary rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm"><ClipboardList className="size-5 md:size-7" /></div>
              </div>
           </Card>

           <Card className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all border-l-[10px] md:border-l-[15px] border-amber-400 relative overflow-hidden h-full">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6 relative z-10">Position Classe</p>
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <h3 className="text-3xl md:text-5xl font-black text-foreground tabular-nums">{analysis?.classAvg.toFixed(2) || "0.00"}</h3>
                  <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase opacity-40">Moyenne Classe</p>
                </div>
                {analysis && analysis.myAvg >= analysis.classAvg ? (
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-4 py-1.5 rounded-full text-[9px] md:text-xs"><ArrowUpRight className="size-3 md:size-4 mr-1.5" /> AU-DESSUS</Badge>
                ) : (
                   <Badge className="bg-red-50 text-red-600 border-none font-black px-4 py-1.5 rounded-full text-[9px] md:text-xs"><ArrowDownRight className="size-3 md:size-4 mr-1.5" /> EN-DESSOUS</Badge>
                )}
              </div>
           </Card>

           <Card className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] bg-foreground text-white border-none shadow-2xl flex flex-col justify-between overflow-hidden relative h-full">
              <div className="relative z-10">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Certification</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-3xl font-black text-primary uppercase tracking-tight">Scellement Live</h3>
                  <div className="size-10 md:size-14 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-inner border border-white/10"><ShieldCheck className="size-5 md:size-7" /></div>
                </div>
              </div>
              <Zap className="absolute -bottom-10 -right-10 size-40 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
           </Card>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTab} className="space-y-8 md:space-y-12">
          <TabsList className="bg-white border-2 border-primary/5 rounded-[1.5rem] md:rounded-[2.5rem] h-14 md:h-20 p-1.5 flex w-full md:w-fit shadow-lg overflow-x-auto no-scrollbar scroll-smooth">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="flex-1 md:flex-none rounded-xl md:rounded-[2rem] font-black px-6 md:px-14 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all shrink-0">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
            <div className="grid gap-6 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {loadingMyGrades ? (
                <div className="col-span-full py-40 text-center animate-pulse flex flex-col items-center gap-6 opacity-30">
                  <Loader2 className="size-14 md:size-20 animate-spin text-primary" />
                  <p className="font-black text-xs md:text-sm uppercase tracking-[0.4em] text-muted-foreground">Appel de vos résultats...</p>
                </div>
              ) : !analysis || analysis.subjects.length === 0 ? (
                <Card className="col-span-full p-24 md:p-40 text-center border-4 border-dashed rounded-[3rem] md:rounded-[4rem] bg-white/50 border-muted/50 flex flex-col items-center justify-center space-y-8">
                  <div className="size-20 md:size-32 bg-muted rounded-full flex items-center justify-center opacity-30 shadow-inner">
                    <FileText className="size-10 md:size-16" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-4xl font-black text-foreground/40 uppercase tracking-tight">Carnet en attente</h3>
                    <p className="font-medium text-muted-foreground/60 max-w-sm mx-auto text-sm md:text-lg">Tes résultats apparaîtront dès le premier scellage officiel par tes professeurs.</p>
                  </div>
                </Card>
              ) : (
                analysis.subjects.map((subject: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[3.2rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] md:active:scale-100">
                    <div className={cn(
                      "h-3 w-full", 
                      subject.name.includes('CONDUITE') ? 'bg-amber-400' : 
                      (subject.myAverage >= 14 ? "bg-emerald-500" : subject.myAverage >= 10 ? "bg-primary" : "bg-destructive")
                    )} />
                    <CardContent className="p-7 md:p-10 space-y-6 md:space-y-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5 flex-1 min-w-0 mr-4">
                          <h4 className="text-lg md:text-2xl font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{subject.name}</h4>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[7px] md:text-[9px] font-black uppercase border-primary/10 text-primary/60 rounded-sm">Coefficient {subject.coef}</Badge>
                          </div>
                        </div>
                        <div className={cn(
                          "size-14 md:size-20 flex flex-col items-center justify-center rounded-2xl md:rounded-3xl shadow-inner border-2 transition-transform group-hover:scale-110", 
                          subject.myAverage >= 10 ? "bg-primary/5 border-primary/5 text-primary" : "bg-red-50 border-red-50 text-red-600"
                        )}>
                           <p className="text-[7px] md:text-[9px] font-black uppercase opacity-40">Moy</p>
                           <p className="text-xl md:text-3xl font-black tabular-nums">{subject.myAverage.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="h-32 md:h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subject.chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fontWeight: '900', fill: '#64748b' }} 
                              dy={10}
                            />
                            <YAxis domain={[0, 20]} axisLine={false} tickLine={false} hide />
                            <RechartsTooltip 
                              cursor={{ fill: 'transparent' }} 
                              contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                            />
                            <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={window?.innerWidth < 768 ? 30 : 45}>
                              {subject.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-start gap-4 p-5 md:p-7 bg-muted/10 rounded-[1.5rem] md:rounded-[2rem] border border-muted/30 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors shadow-inner">
                         <div className="size-8 md:size-11 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                           {subject.myAverage >= subject.classMax ? <Award className="size-4 md:size-6 text-emerald-500" /> : 
                            subject.myAverage >= 10 ? <ShieldCheck className="size-4 md:size-6 text-primary" /> : 
                            <TrendingDown className="size-4 md:size-6 text-red-500" />}
                         </div>
                         <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground italic leading-relaxed uppercase tracking-tight group-hover:text-foreground transition-colors">
                           {subject.name.includes('CONDUITE') 
                             ? "Ta discipline est le miroir de ton excellence académique." 
                             : (subject.myAverage >= subject.classMax ? "Excellence absolue ! Tu es major de ta classe." : "Continue tes efforts, la réussite est proche.")}
                         </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
