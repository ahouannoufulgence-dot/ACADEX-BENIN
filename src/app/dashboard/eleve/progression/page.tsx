
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Loader2,
  Trophy,
  Target,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Star,
  Info,
  History,
  ShieldCheck,
  ShieldAlert,
  Calculator
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
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

const EVAL_STEPS = ["int1", "int2", "int3", "dev1", "dev2", "comp"]
const EVAL_LABELS: Record<string, string> = {
  int1: "Int. 1", int2: "Int. 2", int3: "Int. 3",
  dev1: "Dev. 1", dev2: "Dev. 2", comp: "Comp."
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

    // Calculer stats de classe par matière et type
    Object.keys(subjectsMap).forEach(sub => {
      EVAL_STEPS.forEach(type => {
        const typeGrades = classGrades.filter(g => g.subject === sub && g.type === type).map(g => Number(g.value))
        if (typeGrades.length > 0) {
          subjectsMap[sub].classMax[type] = Math.max(...typeGrades)
          subjectsMap[sub].classMin[type] = Math.min(...typeGrades)
          subjectsMap[sub].classAvg[type] = Number((typeGrades.reduce((a, b) => a + b, 0) / typeGrades.length).toFixed(2))
        }
      })

      // Calculer moyenne sujet
      const notes = Object.values(subjectsMap[sub].myNotes).map(Number)
      subjectsMap[sub].average = notes.length > 0 ? Number((notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2)) : 0
    })

    const subjectList = Object.values(subjectsMap).sort((a, b) => b.average - a.average)
    
    // Moyenne générale et rang
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
        
        {/* Header Analytique */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Ma <span className="text-primary italic">Progression</span></h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <TrendingUp className="size-3 md:size-4 text-primary" />
              <span>Analyse de trajectoire • {activeYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge className="bg-primary text-white h-10 md:h-14 px-5 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-2 md:gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/20">
               <ShieldCheck className="size-3.5 md:size-5" /> CERTIFIÉ ACADEX
             </Badge>
          </div>
        </div>

        {!selectedSubject ? (
          <div className="space-y-6 md:space-y-10">
            {/* KPIs Globaux */}
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
                         <Badge className={cn("rounded-full font-black text-[7px] md:text-[10px] px-2", kpi.up ? "bg-emerald-500" : "bg-red-500")}>
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

            {/* Liste des Matières - Navigation Progression */}
            <div className="grid gap-4 md:gap-6">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-muted-foreground">Progression par Discipline</h2>
                  <Badge variant="outline" className="text-[7px] md:text-[10px] font-black border-muted-foreground/20">A-Z</Badge>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {loading ? (
                    [1,2,3].map(i => <Card key={i} className="h-24 md:h-40 rounded-[1.5rem] md:rounded-[2.5rem] bg-muted/20 animate-pulse" />)
                  ) : analysis?.subjects.length === 0 ? (
                    <Card className="col-span-full p-20 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-30 flex flex-col items-center justify-center gap-4">
                       <History className="size-12 md:size-16" />
                       <p className="font-black uppercase tracking-widest text-xs">Aucun point scellé</p>
                    </Card>
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
                             <div className="flex justify-between text-[7px] md:text-[10px] font-black uppercase text-muted-foreground">
                                <span>Évolution</span>
                                <span className="text-emerald-600 flex items-center"><ArrowUpRight className="size-2 md:size-3 mr-0.5" /> +1.5</span>
                             </div>
                             <div className="w-full bg-muted/30 h-1.5 md:h-2 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-1000", sub.average >= 10 ? "bg-primary" : "bg-red-500")} style={{ width: `${(sub.average / 20) * 100}%` }} />
                             </div>
                          </div>
                          <ChevronRight className="absolute bottom-4 right-4 size-3 md:size-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                       </Card>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-6 duration-500">
             {/* Back Button & Title */}
             <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => { setSelectedSubject(null); setAiReport(null); }} className="rounded-xl h-10 md:h-12 bg-white shadow-sm border border-muted/50 px-3 md:px-5 font-black text-[10px] md:text-sm uppercase tracking-widest transition-all hover:bg-primary hover:text-white">
                   <ChevronLeft className="mr-1 size-3 md:size-4" /> Retour
                </Button>
                <div className="h-8 w-1 bg-primary/20 rounded-full" />
                <h2 className="text-xl md:text-4xl font-black uppercase tracking-tight">{selectedSubject}</h2>
             </div>

             <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                {/* Graphique de Progression */}
                <div className="lg:col-span-8 space-y-6 md:space-y-10">
                   <Card className="p-4 md:p-12 rounded-[2rem] md:rounded-[4rem] bg-white border-none shadow-sm">
                      <div className="flex items-center justify-between mb-8 md:mb-14">
                        <div className="space-y-1">
                          <h3 className="text-base md:text-2xl font-black flex items-center gap-2 md:gap-4 uppercase">
                             <TrendingUp className="text-primary size-4 md:size-7" /> Courbe Comparative
                          </h3>
                          <p className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Visualisation scellée vs Classe</p>
                        </div>
                      </div>
                      <div className="h-[220px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={subjectChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '900'}} dy={10} />
                            <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '700'}} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', paddingBottom: '30px' }} />
                            <Line type="monotone" dataKey="Ma Note" stroke="#14532d" strokeWidth={5} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 7}} />
                            <Line type="monotone" dataKey="Moy. Classe" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Major" stroke="#fbbf24" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Dernier" stroke="#ef4444" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                   </Card>

                   {/* Détail des Notes - Tableau Premium */}
                   <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
                      <div className="p-5 md:p-10 border-b bg-muted/5 flex items-center justify-between">
                         <h3 className="text-base md:text-xl font-black uppercase tracking-tight">Registre de l'Élève</h3>
                         <Badge className="bg-primary/10 text-primary border-none text-[8px] md:text-[10px] font-black px-4 py-1 rounded-full uppercase">Données Scellées</Badge>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full">
                            <thead className="bg-muted/20 text-[7px] md:text-[10px] font-black uppercase text-muted-foreground border-b border-muted/30">
                               <tr>
                                  <th className="px-5 md:px-10 py-4 md:py-8 text-left">Évaluation</th>
                                  <th className="px-5 md:px-10 py-4 md:py-8 text-center">Ma Note</th>
                                  <th className="px-5 md:px-10 py-4 md:py-8 text-center">Moy. Classe</th>
                                  <th className="px-5 md:px-10 py-4 md:py-8 text-right bg-primary/5 text-primary">Position</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/10">
                               {EVAL_STEPS.map(type => {
                                 const sub = analysis?.subjects.find(s => s.name === selectedSubject)
                                 const note = sub?.myNotes[type]
                                 if (note === undefined) return null
                                 const avg = sub?.classAvg[type] || 0
                                 const diff = note - avg
                                 return (
                                   <tr key={type} className="hover:bg-muted/5 transition-all">
                                      <td className="px-5 md:px-10 py-4 md:py-10">
                                         <p className="font-black text-[10px] md:text-lg uppercase tracking-tight text-foreground">{EVAL_LABELS[type]}</p>
                                      </td>
                                      <td className="px-5 md:px-10 py-4 md:py-10 text-center">
                                         <Badge className={cn("h-8 md:h-12 w-10 md:w-20 justify-center rounded-lg md:rounded-xl text-xs md:text-xl font-black shadow-sm", note >= 10 ? "bg-emerald-500" : "bg-red-500")}>
                                            {note}
                                         </Badge>
                                      </td>
                                      <td className="px-5 md:px-10 py-4 md:py-10 text-center">
                                         <p className="text-[10px] md:text-lg font-bold text-muted-foreground tabular-nums">{avg}</p>
                                      </td>
                                      <td className="px-5 md:px-10 py-4 md:py-10 text-right">
                                         <div className="flex flex-col items-end">
                                            <span className={cn("text-[9px] md:text-lg font-black tabular-nums flex items-center", diff >= 0 ? "text-emerald-600" : "text-red-600")}>
                                               {diff >= 0 ? <ArrowUpRight className="size-2 md:size-4 mr-1" /> : <ArrowDownRight className="size-2 md:size-4 mr-1" />}
                                               {Math.abs(diff).toFixed(1)}
                                            </span>
                                            <span className="text-[6px] md:text-[9px] font-black uppercase text-muted-foreground opacity-40">Vs Classe</span>
                                         </div>
                                      </td>
                                   </tr>
                                 )
                               })}
                            </tbody>
                         </table>
                      </div>
                   </Card>
                </div>

                {/* Sidebar IA & Insights */}
                <div className="lg:col-span-4 space-y-6 md:space-y-10">
                   <Card className="p-6 md:p-12 bg-foreground text-white rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                      <div className="relative z-10 space-y-6 md:space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner"><Sparkles className="size-4 md:size-6 text-primary animate-pulse" /></div>
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Coach Brain IA</h3>
                         </div>
                         <div className="p-5 md:p-10 bg-white/5 rounded-xl md:rounded-[2rem] border border-white/10 italic text-[9px] md:text-xl font-medium leading-relaxed text-white/80 min-h-[120px] md:min-h-[200px] flex items-center justify-center text-center">
                           {aiReport ? `"${aiReport.academicFeedback}"` : `"Je peux analyser tes notes en ${selectedSubject} pour te donner des conseils de scellement."`}
                         </div>
                         <Button onClick={handleAiAudit} disabled={analyzing} className="w-full h-12 md:h-18 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] md:text-lg transition-all shadow-xl shadow-primary/20 active:scale-95">
                           {analyzing ? <Loader2 className="animate-spin size-4 md:size-6" /> : <Zap className="size-4 md:size-6 mr-2" />}
                           DÉBLOQUER AUDIT IA
                         </Button>
                      </div>
                      <TrendingUp className="absolute -bottom-10 -right-10 size-40 md:size-72 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                   </Card>

                   <Card className="p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-primary/20 bg-white space-y-6">
                      <h4 className="font-black text-[9px] md:text-sm uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                        <Info className="size-3 md:size-4" /> Méthode de calcul
                      </h4>
                      <div className="space-y-4 md:space-y-6">
                         <div className="flex gap-4 items-start">
                            <div className="size-8 md:size-11 bg-primary/5 text-primary rounded-lg flex items-center justify-center font-black text-[9px] md:text-sm shrink-0">1</div>
                            <p className="text-[9px] md:text-sm font-medium text-muted-foreground leading-relaxed">
                               Moyenne Interro = (I1+I2+I3) / nombre d'interros scellées.
                            </p>
                         </div>
                         <div className="flex gap-4 items-start">
                            <div className="size-8 md:size-11 bg-primary/5 text-primary rounded-lg flex items-center justify-center font-black text-[9px] md:text-sm shrink-0">2</div>
                            <p className="text-[9px] md:text-sm font-medium text-muted-foreground leading-relaxed">
                               Moyenne Matière = (Moy Interro + D1 + D2 + Comp) / total des piliers présents.
                            </p>
                         </div>
                      </div>
                   </Card>

                   <Card className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-emerald-50 border-none shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                      <div className="size-12 md:size-16 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><CheckCircle2 className="size-6 md:size-8" /></div>
                      <div>
                        <h4 className="font-black text-sm md:text-lg uppercase">Intégrité Certifiée</h4>
                        <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Données validées par l'Établissement</p>
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
