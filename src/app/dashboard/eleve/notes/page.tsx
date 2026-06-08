
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
        { name: "Dernier", val: Number(s.classMin.toFixed(2)), fill: "#ef4444" },
        { name: "Moi", val: Number(s.myAverage.toFixed(2)), fill: "#14532d" },
        { name: "Premier", val: Number(s.classMax.toFixed(2)), fill: "#10b981" },
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
        { name: "Dernier", val: 12, fill: "#ef4444" },
        { name: "Moi", val: Number(conductGradeValue.toFixed(2)), fill: "#14532d" },
        { name: "Premier", val: 20, fill: "#10b981" },
      ]
    })

    return { myAvg, classAvg, subjects: subjectList }
  }, [myGrades, allGrades, myLifeEvents, activeTerm, studentClass, activeYear])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Acadex</span></h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Vos notes incluent la <b>Conduite</b> (Cahier de Vie).
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-primary text-white border-none px-8 py-3 rounded-2xl font-black text-2xl shadow-xl shadow-primary/20">
              MOYENNE : {analysis?.myAvg.toFixed(2) || "0.00"}
            </Badge>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Année Scolaire {activeYear}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Note de Conduite</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-primary">{analysis?.subjects[0]?.myAverage.toFixed(2) || "20.00"}</h3>
                <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><ClipboardList className="size-6" /></div>
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all border-l-8 border-amber-400">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Moyenne Classe</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-foreground">{analysis?.classAvg.toFixed(2) || "0.00"}</h3>
                {analysis && analysis.myAvg >= analysis.classAvg ? (
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-3 py-1"><ArrowUpRight className="size-3 mr-1" /> AU-DESSUS</Badge>
                ) : (
                   <Badge className="bg-red-50 text-red-600 border-none font-black px-3 py-1"><ArrowDownRight className="size-3 mr-1" /> EN-DESSOUS</Badge>
                )}
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-xl flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Certification</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-primary">SCELLEMENT LIVE</h3>
                  <div className="p-3 bg-white/10 rounded-2xl"><ShieldCheck className="size-6 text-primary" /></div>
                </div>
              </div>
              <Zap className="absolute -bottom-10 -right-10 size-40 text-white/5" />
           </Card>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-md">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-[1.5rem] font-black px-12 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {loadingMyGrades ? (
                <div className="col-span-full py-20 text-center animate-pulse font-black text-muted-foreground flex flex-col items-center gap-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  Génération du palmarès visuel...
                </div>
              ) : !analysis || analysis.subjects.length === 0 ? (
                <Card className="col-span-full p-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <FileText className="size-20 mx-auto mb-6" />
                  <h3 className="text-2xl font-black">Carnet en attente</h3>
                  <p className="font-medium text-muted-foreground">Tes résultats apparaîtront dès le premier scellage de notes par tes professeurs.</p>
                </Card>
              ) : (
                analysis.subjects.map((subject: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all">
                    <div className={cn("h-3 w-full", subject.name.includes('CONDUITE') ? 'bg-amber-400' : (subject.myAverage >= 14 ? "bg-emerald-500" : subject.myAverage >= 10 ? "bg-primary" : "bg-destructive"))} />
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight line-clamp-1">{subject.name}</h4>
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">Coef : {subject.coef}</Badge>
                        </div>
                        <div className={cn("size-16 flex flex-col items-center justify-center rounded-2xl shadow-inner border-2", subject.myAverage >= 10 ? "bg-primary/5 border-primary/10 text-primary" : "bg-red-50 border-red-100 text-red-600")}>
                           <p className="text-[10px] font-black uppercase opacity-40">Moy</p>
                           <p className="text-2xl font-black">{subject.myAverage.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="h-40 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subject.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }} />
                            <YAxis domain={[0, 20]} axisLine={false} tickLine={false} hide />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={40}>
                              {subject.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-muted/10 rounded-2xl border border-muted/20">
                         <div className="size-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                           {subject.myAverage >= subject.classMax ? <Award className="size-4 text-emerald-500" /> : subject.myAverage >= 10 ? <ShieldCheck className="size-4 text-primary" /> : <TrendingDown className="size-4 text-red-500" />}
                         </div>
                         <p className="text-[10px] font-bold text-muted-foreground italic leading-tight uppercase">
                           {subject.name.includes('CONDUITE') 
                             ? "Ta discipline est le miroir de ton excellence." 
                             : (subject.myAverage >= subject.classMax ? "Excellence ! Major de la classe." : "Continue tes efforts.")}
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
