"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Loader2,
  Trophy,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Star,
  Info,
  History,
  ShieldCheck,
  ShieldAlert
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts"
import { cn } from "@/lib/utils"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"

const EVAL_STEPS = ["int1", "int2", "int3", "dev1", "dev2"]
const EVAL_LABELS: Record<string, string> = {
  int1: "Int. 1", int2: "Int. 2", int3: "Int. 3",
  dev1: "Dev. 1", dev2: "Dev. 2"
}

export default function StudentProgressionPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [activeYear, setActiveYear] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<GenerateAcademicFeedbackOutput | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    const parts = (localStorage.getItem('acadex_user_id') || "").split('-')
    if (parts.length >= 2) setStudentClass(parts[1])
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setMounted(true)
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId || !activeYear) return null
    return query(collection(db, "grades"), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  const { data: allGrades, loading } = useCollection(gradesQuery)

  const analysis = useMemo(() => {
    if (!allGrades || !studentId) return null

    const myGrades = allGrades.filter(g => g.studentId === studentId)
    const classGrades = allGrades.filter(g => g.classId === studentClass)

    const subjectsMap: Record<string, any> = {}
    
    myGrades.forEach(g => {
      if (!subjectsMap[g.subject]) {
        subjectsMap[g.subject] = { name: g.subject, myNotes: {}, classMax: {}, classAvg: {}, classMin: {}, coef: g.coefficient || 1 }
      }
      subjectsMap[g.subject].myNotes[g.type] = Number(g.value)
    })

    Object.keys(subjectsMap).forEach(sub => {
      EVAL_STEPS.forEach(type => {
        const typeGrades = classGrades.filter(g => g.subject === sub && g.type === type).map(g => Number(g.value))
        if (typeGrades.length > 0) {
          subjectsMap[sub].classMax[type] = Math.max(...typeGrades)
          subjectsMap[sub].classMin[type] = Math.min(...typeGrades)
          subjectsMap[sub].classAvg[type] = Number((typeGrades.reduce((a, b) => a + b, 0) / typeGrades.length).toFixed(2))
        }
      })

      const notes = Object.values(subjectsMap[sub].myNotes).map(Number)
      subjectsMap[sub].average = notes.length > 0 ? Number((notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2)) : 0
    })

    const subjectList = Object.values(subjectsMap).sort((a, b) => b.average - a.average)
    
    const studentAverages = Array.from(new Set(classGrades.map(g => g.studentId))).map(sid => {
      const sGrades = classGrades.filter(g => g.studentId === sid).map(g => Number(g.value))
      return { id: sid, avg: sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0 }
    }).sort((a, b) => b.avg - a.avg)

    const myRank = studentAverages.findIndex(s => s.id === studentId) + 1
    const myGpa = studentAverages.find(s => s.id === studentId)?.avg || 0

    return { subjects: subjectList, myRank, myGpa, totalClass: studentAverages.length }
  }, [allGrades, studentId, studentClass])

  const subjectChartData = useMemo(() => {
    if (!selectedSubject || !analysis) return []
    const sub = analysis.subjects.find(s => s.name === selectedSubject)
    if (!sub) return []

    return EVAL_STEPS.map(type => ({
      name: EVAL_LABELS[type],
      "Ma Note": sub.myNotes[type],
      "Major": sub.classMax[type],
      "Moy. Classe": sub.classAvg[type],
      "Dernier": sub.classMin[type]
    })).filter(d => d["Ma Note"] !== undefined || d["Moy. Classe"] !== undefined)
  }, [selectedSubject, analysis])

  const handleAiAudit = async () => {
    if (!analysis || !selectedSubject) return
    setAnalyzing(true)
    try {
      const sub = analysis.subjects.find(s => s.name === selectedSubject)
      const data = await generateAcademicFeedback({
        studentName: localStorage.getItem('acadex_user_name') || "Élève",
        grades: [{ subject: sub.name, grade: sub.average, maxGrade: 20 }],
        evaluationContext: `Analyse de progression détaillée en ${sub.name}`,
        teacherComments: "Audit automatique demandé par l'élève."
      })
      setAiReport(data)
      toast({ title: "Analyse scellée" })
    } catch (e) {
      toast({ title: "Erreur IA", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-5 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Ma <span className="text-primary italic">Progression</span></h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <TrendingUp className="size-3 md:size-4 text-primary" />
              <span>Analyse de trajectoire • {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-primary text-white h-10 md:h-14 px-5 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-2 md:gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/20 w-fit">
            <ShieldCheck className="size-3.5 md:size-5" /> CERTIFIÉ ACADEX
          </Badge>
        </div>

        {!selectedSubject ? (
          <div className="space-y-6 md:space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
               {[
                 { label: "Moyenne Générale", value: analysis?.myGpa.toFixed(2) || "0.00", icon: Trophy, color: "text-primary", bg: "bg-emerald-50", trend: "+0.4", up: true },
                 { label: "Position Classe", value: analysis ? `${analysis.myRank}e` : "---", icon: Star, color: "text-amber-500", bg: "bg-amber-50", trend: "Stable", up: null },
                 { label: "Matières Fortes", value: analysis?.subjects.filter(s => s.average >= 14).length || "0", icon: Target, color: "text-blue-600", bg: "bg-blue-50", trend: "Top 3", up: true },
                 { label: "Points de Vigilance", value: analysis?.subjects.filter(s => s.average < 10).length || "0", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50", trend: "-2", up: false },
               ].map((kpi, i) => (
                 <Card key={i} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-lg transition-all relative overflow-hidden">
                    <div className={cn("absolute -top-4 -right-4 size-14 md:size-24 rounded-full opacity-[0.05]", kpi.bg)} />
                    <div className="flex items-center justify-between mb-3 md:mb-8 relative z-10">
                       <div className={cn("p-2 md:p-4 rounded-lg md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", kpi.bg, kpi.color)}>
                         <kpi.icon className="size-4 md:size-7" />
                       </div>
                       {kpi.up !== null && (
                         <Badge className={cn("rounded-full font-black text-[7px] md:text-[10px] px-2", kpi.up ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                           {kpi.up ? <ArrowUpRight className="size-2 md:size-3 mr-0.5" /> : <ArrowDownRight className="size-2 md:size-3 mr-0.5" />}
                           {kpi.trend}
                         </Badge>
                       )}
                    </div>
                    <div className="relative z-10">
                       <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{kpi.label}</p>
                       <h3 className="text-lg md:text-4xl font-black text-foreground tabular-nums">{loading ? "..." : kpi.value}</h3>
                    </div>
                 </Card>
               ))}
            </div>

            <div className="grid gap-4 md:gap-6">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-muted-foreground">Progression par Discipline</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {loading ? (
                    [1,2,3].map(i => <Card key={i} className="h-24 md:h-40 rounded-[1.5rem] md:rounded-[2.5rem] bg-muted/20 animate-pulse" />)
                  ) : analysis?.subjects.map((sub, i) => (
                    <button key={i} onClick={() => setSelectedSubject(sub.name)} className="text-left group outline-none">
                       <Card className={cn(
                         "p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] border-l-[8px] md:border-l-[12px] relative overflow-hidden",
                         sub.average >= 10 ? "border-primary" : "border-red-500"
                       )}>
                          <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
                             <div className="space-y-0.5">
                                <h4 className="text-xs md:text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">{sub.name}</h4>
                                <p className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">COEF {sub.coef}</p>
                             </div>
                             <div className={cn("size-10 md:size-16 rounded-lg md:rounded-2xl flex flex-col items-center justify-center shadow-inner border-2", sub.average >= 10 ? "bg-emerald-50 border-emerald-100 text-primary" : "bg-red-50 border-red-100 text-red-600")}>
                                <span className="text-[6px] md:text-[9px] font-black uppercase opacity-40">Moy</span>
                                <span className="text-xs md:text-2xl font-black tabular-nums">{sub.average.toFixed(1)}</span>
                             </div>
                          </div>
                          <div className="space-y-2 relative z-10">
                             <div className="w-full bg-muted/30 h-1.5 md:h-2 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-1000", sub.average >= 10 ? "bg-primary" : "bg-red-500")} style={{ width: `${(sub.average / 20) * 100}%` }} />
                             </div>
                          </div>
                       </Card>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-6 duration-500">
             <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => { setSelectedSubject(null); setAiReport(null); }} className="rounded-xl h-10 md:h-12 bg-white shadow-sm border border-muted/50 px-3 md:px-5 font-black text-[10px] md:text-sm uppercase tracking-widest transition-all hover:bg-primary hover:text-white">
                   <ChevronLeft className="mr-1 size-3 md:size-4" /> Retour
                </Button>
                <h2 className="text-xl md:text-4xl font-black uppercase tracking-tight">{selectedSubject}</h2>
             </div>

             <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                <div className="lg:col-span-8">
                   <Card className="p-4 md:p-12 rounded-[2rem] md:rounded-[4rem] bg-white border-none shadow-sm">
                      <div className="h-[220px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={subjectChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '900'}} dy={10} />
                            <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '700'}} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="Ma Note" stroke="#14532d" strokeWidth={4} fill="#14532d20" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                   <Card className="p-6 md:p-12 bg-foreground text-white rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                      <div className="relative z-10 space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner"><Sparkles className="size-4 md:size-6 text-primary animate-pulse" /></div>
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Audit IA</h3>
                         </div>
                         <div className="p-5 md:p-10 bg-white/5 rounded-xl md:rounded-[2rem] border border-white/10 italic text-[9px] md:text-base font-medium leading-relaxed text-white/80 min-h-[120px] flex items-center justify-center text-center">
                           {aiReport ? `"${aiReport.academicFeedback}"` : `"Je peux analyser tes notes en ${selectedSubject} pour te donner des conseils."`}
                         </div>
                         <Button onClick={handleAiAudit} disabled={analyzing} className="w-full h-12 md:h-18 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] md:text-lg transition-all active:scale-95 shadow-xl shadow-primary/20">
                           {analyzing ? <Loader2 className="animate-spin size-4 md:size-6" /> : <Zap className="size-4 md:size-6 mr-2" />}
                           DÉBLOQUER AUDIT IA
                         </Button>
                      </div>
                   </Card>
                </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
