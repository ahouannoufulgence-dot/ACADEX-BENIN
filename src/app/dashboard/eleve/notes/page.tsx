
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
  Clock,
  FileDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function StudentGradesPage() {
  const [studentId, setStudentId] = useState("")
  const [studentInternalId, setStudentInternalId] = useState("")
  const [activeTerm, setActiveTab] = useState("T1")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [myGrades, setMyGrades] = useState<any[]>([])
  const [myLifeEvents, setMyLifeEvents] = useState<any[]>([])
  const [mySanctions, setMySanctions] = useState<any[]>([])
    const [loadingMyGrades, setLoadingMyGrades] = useState(true)

  useEffect(() => {
    const matricule = localStorage.getItem('acadex_user_id') || ""
    setStudentId(matricule)
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    
    const findInternalId = async () => {
      const { data } = await supabase.from('students').select('id').eq('matricule', matricule).single()
      if (data) setStudentInternalId(data.id)
    }
    findInternalId()
  }, [])

  useEffect(() => {
    if (!studentId) return
    const fetchData = async () => {
      setLoadingMyGrades(true)
      const [gRes, eRes] = await Promise.all([
        supabase.from('grades').select('*').eq('student_matricule', studentId).eq('academic_year', activeYear),
        supabase.from('student_life').select('*').eq('student_id', studentId).eq('academic_year', activeYear),
        supabase.from('sanctions').select('*').eq('student_matricule', studentId).eq('academic_year', activeYear),
        supabase.from('sanctions').select('*').eq('student_matricule', studentId).eq('academic_year', activeYear)
      ])
      setMyGrades(gRes.data || [])
      setMyLifeEvents(eRes.data || [])
      const sanRes = await supabase.from('sanctions').select('*').eq('student_matricule', studentId).eq('academic_year', activeYear)
      setMySanctions(sanRes.data || [])
      const { data: sanData } = await supabase.from('sanctions').select('*').eq('student_matricule', studentId).eq('academic_year', activeYear)
      setMySanctions(sanData || [])
      setLoadingMyGrades(false)
    }
    fetchData()
  }, [studentId, activeYear])

  const analysis = useMemo(() => {
    if (!myGrades) return null
    
    const termGrades = myGrades.filter((g: any) => g.term === activeTerm)

    const totalPointsRetires = mySanctions.reduce((acc: number, s: any) => acc + (Number(s.points_retires) || 0), 0)
    const conductValue = Math.max(0, Math.min(20, 20 - totalPointsRetires))

    const subjects: Record<string, any> = {}
    termGrades.forEach((g: any) => {
      if (!subjects[g.subject]) {
        subjects[g.subject] = { 
          name: g.subject, 
          coef: Number(g.coefficient) || 1, 
          details: { int1: null, int2: null, int3: null, dev1: null, dev2: null } 
        }
      }
      subjects[g.subject].details[g.type] = Number(g.value)
    })

    let totalWeighted = 0
    let totalCoef = 0

    const subjectList = Object.values(subjects).map((s: any) => {
      const interros = [s.details.int1, s.details.int2, s.details.int3].filter(v => v !== null)
      const avgInt = interros.length > 0 ? interros.reduce((a:number, b:number) => a+b, 0) / interros.length : null
      
      const pillars = []
      if (avgInt !== null) pillars.push(avgInt)
      if (s.details.dev1 !== null) pillars.push(s.details.dev1)
      if (s.details.dev2 !== null) pillars.push(s.details.dev2)
      
      const avgSub = pillars.length > 0 ? (pillars.reduce((a:number, b:number) => a+b, 0) / pillars.length) : 0
      
      s.myAverage = Number(avgSub.toFixed(2))
      s.isProvisional = pillars.length < 3
      
      totalWeighted += s.myAverage * s.coef
      totalCoef += s.coef
      return s
    })

    totalWeighted += conductValue * 1
    totalCoef += 1
    const generalAvg = totalCoef > 0 ? (totalWeighted / totalCoef) : 0

    return { generalAvg, subjects: subjectList, conductValue }
  }, [myGrades, myLifeEvents, mySanctions, activeTerm])

  return (
    <DashboardLayout>
      <div className="space-y-5 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Mon Carnet <span className="text-primary italic">Live</span></h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-black px-3 rounded-full uppercase text-[8px] md:text-sm bg-primary/5 h-6 md:h-8">
                {activeYear}
              </Badge>
              <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[8px] md:text-[10px]">
                <Clock className="size-2.5 md:size-3 text-amber-500" /> Calcul Progressif Activé
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {studentInternalId && analysis && analysis.subjects.length > 0 && (
               <Button asChild variant="outline" className="h-12 md:h-20 px-6 md:px-10 rounded-2xl md:rounded-[2.5rem] border-2 border-primary/20 font-black text-[10px] md:text-sm bg-white hover:bg-primary/5 transition-all shadow-sm">
                  <Link href={`/bulletin/${studentInternalId}`}>
                    <FileDown className="mr-2 size-4 md:size-5" /> Télécharger Bulletin
                  </Link>
               </Button>
             )}
             <div className="bg-primary text-white p-5 md:p-10 rounded-[1.8rem] md:rounded-[3.5rem] shadow-xl flex items-center justify-between md:justify-start gap-6 md:gap-12 transition-all hover:scale-[1.02]">
                <div className="space-y-0.5">
                    <p className="text-[7px] md:text-[10px] font-black uppercase text-white/40 tracking-widest">Moyenne Provisoire</p>
                    <h2 className="text-3xl md:text-6xl font-black tabular-nums">{analysis?.generalAvg.toFixed(2) || "0.00"}</h2>
                </div>
                <div className="size-9 md:size-20 bg-white/10 rounded-xl md:rounded-3xl flex items-center justify-center shadow-inner shrink-0"><TrendingUp className="size-4 md:size-10" /></div>
             </div>
          </div>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTab} className="space-y-6 md:space-y-12">
          <TabsList className="bg-white border-2 border-primary/5 rounded-[1.2rem] md:rounded-[2.5rem] h-11 md:h-20 p-1 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="flex-1 md:flex-none rounded-lg md:rounded-[2rem] font-black px-4 md:px-14 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all shrink-0">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-5 md:space-y-10 animate-in slide-in-from-bottom-6 duration-700">
             {loadingMyGrades ? (
                <div className="py-20 md:py-40 text-center animate-pulse opacity-20"><Loader2 className="animate-spin text-primary size-8 md:size-12 mx-auto" /></div>
             ) : (!analysis || analysis.subjects.length === 0) ? (
                <Card className="p-12 md:p-40 text-center border-4 border-dashed rounded-[2rem] md:rounded-[3rem] bg-white/50 opacity-40 space-y-4">
                   <Zap className="size-8 md:size-16 mx-auto text-muted-foreground" />
                   <h3 className="text-lg md:text-2xl font-black uppercase">En attente de scellage</h3>
                   <p className="text-muted-foreground font-medium text-[10px] md:text-base">Dès que vos professeurs scelleront vos premières notes, votre moyenne s'affichera ici.</p>
                </Card>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
                  {analysis.subjects.map((sub: any, idx: number) => (
                    <Card key={idx} className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className={cn("h-2 md:h-3 w-full", sub.myAverage >= 10 ? "bg-primary" : "bg-destructive")} />
                        <CardContent className="p-5 md:p-10 space-y-6 md:space-y-8">
                          <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-sm md:text-2xl font-black text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">{sub.name}</h4>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[7px] md:text-[10px] font-black uppercase border-primary/10 text-primary/60 px-1.5">COEF {sub.coef}</Badge>
                                  <Badge className={cn("text-[6px] md:text-[7px] font-black uppercase rounded-sm h-3.5 md:h-4 px-1", sub.isProvisional ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                                    {sub.isProvisional ? "En cours" : "Complet"}
                                  </Badge>
                                </div>
                              </div>
                              <div className={cn("size-12 md:size-20 rounded-xl md:rounded-3xl flex flex-col items-center justify-center shadow-inner border-2 transition-transform group-hover:scale-110 shrink-0", sub.myAverage >= 10 ? "bg-primary/5 border-primary/5 text-primary" : "bg-red-50 border-red-50 text-red-600")}>
                                <p className="text-[7px] md:text-[10px] font-black uppercase opacity-40">{sub.isProvisional ? 'Prov' : 'Moy'}</p>
                                <p className="text-sm md:text-3xl font-black tabular-nums">{sub.myAverage.toFixed(1)}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 md:gap-4">
                              {[
                                { label: "I 1", val: sub.details.int1 },
                                { label: "I 2", val: sub.details.int2 },
                                { label: "I 3", val: sub.details.int3 },
                                { label: "D 1", val: sub.details.dev1 },
                                { label: "D 2", val: sub.details.dev2 }
                              ].map((it, i) => (
                                <div key={i} className="p-2 md:p-4 rounded-lg md:rounded-2xl border bg-muted/10 border-transparent hover:border-primary/10 flex flex-col items-center justify-center gap-0.5 transition-all">
                                  <span className="text-[6px] md:text-[9px] font-black uppercase text-muted-foreground">{it.label}</span>
                                  <span className="font-black text-[10px] md:text-xl tabular-nums">{it.val !== null ? it.val : "---"}</span>
                                </div>
                              ))}
                          </div>

                          <div className="pt-4 md:pt-6 border-t border-muted/30 flex justify-between items-center">
                              <p className="text-[7px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Impact Pondéré</p>
                              <p className="text-sm md:text-2xl font-black text-primary tabular-nums">{(sub.myAverage * sub.coef).toFixed(1)}</p>
                          </div>
                        </CardContent>
                    </Card>
                  ))}
                </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
