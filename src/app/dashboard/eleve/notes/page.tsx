
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
  ClipboardList,
  Calculator,
  CheckCircle2,
  Calendar,
  Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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

  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  const myLifeEventsQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "student_life"), where("studentId", "==", studentId), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)
  const { data: myLifeEvents } = useCollection(myLifeEventsQuery)

  const analysis = useMemo(() => {
    if (!myGrades) return null
    
    const termGrades = myGrades.filter((g: any) => g.term === activeTerm)

    let conductValue = 20
    if (myLifeEvents) {
      myLifeEvents.forEach((e: any) => { if (e.pointsImpact) conductValue += Number(e.pointsImpact) })
    }
    conductValue = Math.max(0, Math.min(20, conductValue))

    const subjects: Record<string, any> = {}
    termGrades.forEach((g: any) => {
      if (!subjects[g.subject]) {
        subjects[g.subject] = { 
          name: g.subject, 
          coef: Number(g.coefficient) || 1, 
          details: { int1: null, int2: null, int3: null, dev1: null, dev2: null, comp: null } 
        }
      }
      subjects[g.subject].details[g.type] = Number(g.value)
    })

    let totalWeighted = 0
    let totalCoef = 0

    const subjectList = Object.values(subjects).map((s: any) => {
      // CALCUL PROGRESSIF INTELLIGENT
      const interros = [s.details.int1, s.details.int2, s.details.int3].filter(v => v !== null)
      const avgInt = interros.length > 0 ? interros.reduce((a:number, b:number) => a+b, 0) / interros.length : null
      
      const dev1 = s.details.dev1 !== null ? s.details.dev1 : null
      const dev2 = s.details.dev2 !== null ? s.details.dev2 : null
      const comp = s.details.comp !== null ? s.details.comp : null
      
      // Collecte des "piliers" disponibles pour la moyenne
      const pillars = []
      if (avgInt !== null) pillars.push(avgInt)
      if (dev1 !== null) pillars.push(dev1)
      if (dev2 !== null) pillars.push(dev2)
      if (comp !== null) pillars.push(comp)
      
      const avgSub = pillars.length > 0 ? (pillars.reduce((a:number, b:number) => a+b, 0) / pillars.length) : 0
      
      s.myAverage = Number(avgSub.toFixed(2))
      s.isProvisional = pillars.length < 4 // On considère provisoire s'il manque au moins une note majeure
      s.count = pillars.length
      
      totalWeighted += s.myAverage * s.coef
      totalCoef += s.coef
      return s
    })

    totalWeighted += conductValue * 1
    totalCoef += 1
    const generalAvg = totalCoef > 0 ? (totalWeighted / totalCoef) : 0

    return { generalAvg, subjects: subjectList, conductValue }
  }, [myGrades, myLifeEvents, activeTerm])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Live</span></h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 rounded-full uppercase text-[9px] md:text-sm bg-primary/5 h-8">
                {activeYear}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px]">
                <Clock className="size-3 text-amber-500" /> Calcul Progressif Activé
              </div>
            </div>
          </div>
          <div className="bg-primary text-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl shadow-primary/20 flex items-center gap-6 md:gap-12 transition-all hover:scale-105">
             <div className="text-center">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Moyenne Provisoire</p>
                <h2 className="text-3xl md:text-6xl font-black tabular-nums">{analysis?.generalAvg.toFixed(2) || "0.00"}</h2>
             </div>
             <div className="size-12 md:size-20 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-inner"><TrendingUp className="size-6 md:size-10" /></div>
          </div>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTab} className="space-y-8 md:space-y-12">
          <TabsList className="bg-white border-2 border-primary/5 rounded-[1.5rem] md:rounded-[2.5rem] h-14 md:h-20 p-1.5 flex w-full md:w-fit shadow-lg overflow-x-auto no-scrollbar scroll-smooth">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="flex-1 md:flex-none rounded-xl md:rounded-[2rem] font-black px-6 md:px-14 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all shrink-0">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-6 duration-700">
             {loadingMyGrades ? (
                <div className="py-40 text-center animate-pulse opacity-20"><Loader2 className="animate-spin text-primary size-12 mx-auto" /></div>
             ) : (!analysis || analysis.subjects.length === 0) ? (
                <Card className="p-20 md:p-40 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-40">
                   <Zap className="size-16 mx-auto mb-6 text-muted-foreground" />
                   <h3 className="text-2xl font-black uppercase">En attente de scellage</h3>
                   <p className="text-muted-foreground font-medium">Dès que vos professeurs scelleront vos premières interrogations, votre moyenne s'affichera ici.</p>
                </Card>
             ) : (
                <div className="grid gap-6 md:gap-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                      {analysis.subjects.map((sub: any, idx: number) => (
                        <Card key={idx} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
                           <div className={cn("h-3 w-full", sub.myAverage >= 10 ? "bg-primary" : "bg-destructive")} />
                           <CardContent className="p-7 md:p-10 space-y-8">
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <h4 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">{sub.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[8px] md:text-[10px] font-black uppercase border-primary/10 text-primary/60">COEF {sub.coef}</Badge>
                                      <Badge className={cn("text-[7px] font-black uppercase rounded-sm h-4 px-1.5", sub.isProvisional ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                                        {sub.isProvisional ? "Évaluation en cours" : "Complet"}
                                      </Badge>
                                    </div>
                                 </div>
                                 <div className={cn("size-14 md:size-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center shadow-inner border-2 transition-transform group-hover:scale-110", sub.myAverage >= 10 ? "bg-primary/5 border-primary/5 text-primary" : "bg-red-50 border-red-50 text-red-600")}>
                                    <p className="text-[8px] md:text-[10px] font-black uppercase opacity-40">{sub.isProvisional ? 'Prov' : 'Moy'}</p>
                                    <p className="text-xl md:text-3xl font-black tabular-nums">{sub.myAverage.toFixed(1)}</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 md:gap-4">
                                 {[
                                   { label: "Int 1", val: sub.details.int1 },
                                   { label: "Int 2", val: sub.details.int2 },
                                   { label: "Int 3", val: sub.details.int3 },
                                   { label: "Dev 1", val: sub.details.dev1 },
                                   { label: "Dev 2", val: sub.details.dev2 },
                                   { label: "Comp", val: sub.details.comp, premium: true },
                                 ].map((it, i) => (
                                   <div key={i} className={cn("p-2 md:p-4 rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", it.premium ? "bg-primary text-white border-primary shadow-lg" : "bg-muted/10 border-transparent hover:border-primary/10")}>
                                      <span className={cn("text-[7px] md:text-[9px] font-black uppercase", it.premium ? "text-white/60" : "text-muted-foreground")}>{it.label}</span>
                                      <span className="font-black text-xs md:text-xl tabular-nums">{it.val !== null ? it.val : "---"}</span>
                                   </div>
                                 ))}
                              </div>

                              <div className="pt-6 border-t border-muted/30 flex justify-between items-center">
                                 <p className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Pondération Scellée</p>
                                 <p className="text-base md:text-2xl font-black text-primary tabular-nums">{(sub.myAverage * sub.coef).toFixed(1)}</p>
                              </div>
                           </CardContent>
                        </Card>
                      ))}
                   </div>
                </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
