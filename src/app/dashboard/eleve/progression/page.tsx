"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, Sparkles, Zap, Loader2, Trophy,
  Target, ArrowUpRight, ArrowDownRight, ChevronLeft,
  Star, ShieldCheck, ShieldAlert
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts"
import { cn } from "@/lib/utils"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"

const EVAL_STEPS = ["int1", "int2", "int3", "dev1", "dev2"]
const EVAL_LABELS: Record<string, string> = {
  int1: "Int. 1", int2: "Int. 2", int3: "Int. 3",
  dev1: "Dev. 1", dev2: "Dev. 2"
}

export default function StudentProgressionPage() {
  const [studentId, setStudentId] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [activeTerm, setActiveTerm] = useState("T1")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<GenerateAcademicFeedbackOutput | null>(null)
  const [mounted, setMounted] = useState(false)
  const [myGrades, setMyGrades] = useState<any[]>([])
  const [classGrades, setClassGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem("acadex_user_id") || ""
    const year = localStorage.getItem("acadex_active_year") || "2026-2027"
    setStudentId(id)
    setActiveYear(year)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!studentId) return
    const fetchData = async () => {
      setLoading(true)
      // Récupérer la classe de l'élève
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id, student_matricule")
        .eq("student_matricule", studentId)
        .single()
      
      const classId = studentData?.class_id || ""
      setStudentClass(classId)

      // Récupérer mes notes
      const { data: myData } = await supabase
        .from("grades")
        .select("*")
        .eq("student_matricule", studentId)
        .eq("academic_year", activeYear)
      setMyGrades(myData || [])

      // Récupérer les notes de la classe
      if (classId) {
        const { data: classData } = await supabase
          .from("grades")
          .select("*")
          .eq("class_id", classId)
          .eq("academic_year", activeYear)
        setClassGrades(classData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [studentId, activeYear])

  const analysis = useMemo(() => {
    const termMyGrades = myGrades.filter(g => g.term === activeTerm)
    const termClassGrades = classGrades.filter(g => g.term === activeTerm)
    if (termMyGrades.length === 0) return null

    const subjectsMap: Record<string, any> = {}
    termMyGrades.forEach(g => {
      if (!subjectsMap[g.subject]) {
        subjectsMap[g.subject] = {
          name: g.subject,
          coef: Number(g.coefficient) || 1,
          myNotes: {}, classMax: {}, classAvg: {}, classMin: {}
        }
      }
      subjectsMap[g.subject].myNotes[g.type] = Number(g.value)
    })

    Object.keys(subjectsMap).forEach(sub => {
      EVAL_STEPS.forEach(type => {
        const typeGrades = termClassGrades
          .filter(g => g.subject === sub && g.type === type)
          .map(g => Number(g.value))
        if (typeGrades.length > 0) {
          subjectsMap[sub].classMax[type] = Math.max(...typeGrades)
          subjectsMap[sub].classMin[type] = Math.min(...typeGrades)
          subjectsMap[sub].classAvg[type] = Number((typeGrades.reduce((a,b) => a+b,0)/typeGrades.length).toFixed(2))
        }
      })

      const interros = [subjectsMap[sub].myNotes.int1, subjectsMap[sub].myNotes.int2, subjectsMap[sub].myNotes.int3].filter(v => v !== undefined)
      const avgInt = interros.length ? interros.reduce((a,b) => a+b,0)/interros.length : null
      const blocks = [...(avgInt !== null ? [avgInt] : []), ...(subjectsMap[sub].myNotes.dev1 !== undefined ? [subjectsMap[sub].myNotes.dev1] : []), ...(subjectsMap[sub].myNotes.dev2 !== undefined ? [subjectsMap[sub].myNotes.dev2] : [])]
      subjectsMap[sub].average = blocks.length ? Number((blocks.reduce((a,b) => a+b,0)/blocks.length).toFixed(2)) : 0
      subjectsMap[sub].isProvisional = blocks.length < 3
    })

    const subjectList = Object.values(subjectsMap).sort((a,b) => b.average - a.average)

    // Rang dans la classe
    const studentMatricules = [...new Set(termClassGrades.map(g => g.student_matricule))]
    const studentAvgs = studentMatricules.map(mat => {
      const sGrades = termClassGrades.filter(g => g.student_matricule === mat)
      const total = sGrades.reduce((acc, g) => acc + Number(g.value), 0)
      return { mat, avg: sGrades.length ? total / sGrades.length : 0 }
    }).sort((a,b) => b.avg - a.avg)

    const myRank = studentAvgs.findIndex(s => s.mat === studentId) + 1
    const myGpa = subjectList.length ? subjectList.reduce((acc, s) => acc + s.average * s.coef, 0) / subjectList.reduce((acc, s) => acc + s.coef, 0) : 0

    return { subjects: subjectList, myRank, myGpa, totalClass: studentMatricules.length }
  }, [myGrades, classGrades, activeTerm, studentId])

  const subjectChartData = useMemo(() => {
    if (!selectedSubject || !analysis) return []
    const sub = analysis.subjects.find(s => s.name === selectedSubject)
    if (!sub) return []
    return EVAL_STEPS.map(type => ({
      name: EVAL_LABELS[type],
      "Ma Note": sub.myNotes[type],
      "Moy. Classe": sub.classAvg[type],
      "Major": sub.classMax[type],
    })).filter(d => d["Ma Note"] !== undefined || d["Moy. Classe"] !== undefined)
  }, [selectedSubject, analysis])

  const handleAiAudit = async () => {
    if (!analysis || !selectedSubject) return
    setAnalyzing(true)
    try {
      const sub = analysis.subjects.find(s => s.name === selectedSubject)
      const data = await generateAcademicFeedback({
        studentName: localStorage.getItem("acadex_user_name") || "Élève",
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
          <div className="flex items-center gap-3">
            {["T1","T2","T3"].map(t => (
              <button key={t} onClick={() => setActiveTerm(t)}
                className={cn("h-10 px-5 rounded-xl font-black text-xs uppercase transition-all border-2",
                  activeTerm === t ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30"
                )}>{t}</button>
            ))}
          </div>
        </div>

        {!selectedSubject ? (
          <div className="space-y-6 md:space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {[
                { label: "Moyenne Générale", value: analysis ? analysis.myGpa.toFixed(2) : "0.00", icon: Trophy, color: "text-primary", bg: "bg-emerald-50" },
                { label: "Position Classe", value: analysis ? `${analysis.myRank}e / ${analysis.totalClass}` : "---", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Matières Fortes", value: analysis ? analysis.subjects.filter(s => s.average >= 14).length : "0", icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Points de Vigilance", value: analysis ? analysis.subjects.filter(s => s.average < 10).length : "0", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
              ].map((kpi, i) => (
                <Card key={i} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-lg transition-all">
                  <div className={cn("p-2 md:p-4 rounded-lg md:rounded-2xl w-fit mb-4 md:mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm", kpi.bg, kpi.color)}>
                    <kpi.icon className="size-4 md:size-7" />
                  </div>
                  <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{kpi.label}</p>
                  <h3 className="text-lg md:text-4xl font-black text-foreground tabular-nums">{loading ? "..." : kpi.value}</h3>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {loading ? (
                [1,2,3].map(i => <Card key={i} className="h-24 md:h-40 rounded-[1.5rem] bg-muted/20 animate-pulse" />)
              ) : !analysis || analysis.subjects.length === 0 ? (
                <div className="col-span-3 p-20 text-center opacity-30">
                  <Zap className="size-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-black uppercase text-muted-foreground text-xs">Aucune note pour ce trimestre</p>
                </div>
              ) : analysis.subjects.map((sub, i) => (
                <button key={i} onClick={() => setSelectedSubject(sub.name)} className="text-left group outline-none">
                  <Card className={cn(
                    "p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] border-l-[8px] md:border-l-[12px]",
                    sub.average >= 10 ? "border-primary" : "border-red-500"
                  )}>
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <div>
                        <h4 className="text-xs md:text-xl font-black uppercase group-hover:text-primary transition-colors">{sub.name}</h4>
                        <p className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">COEF {sub.coef}</p>
                      </div>
                      <div className={cn("size-10 md:size-16 rounded-lg md:rounded-2xl flex flex-col items-center justify-center shadow-inner border-2", sub.average >= 10 ? "bg-emerald-50 border-emerald-100 text-primary" : "bg-red-50 border-red-100 text-red-600")}>
                        <span className="text-[6px] md:text-[9px] font-black uppercase opacity-40">Moy</span>
                        <span className="text-xs md:text-2xl font-black tabular-nums">{sub.average.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted/30 h-1.5 md:h-2 rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-1000", sub.average >= 10 ? "bg-primary" : "bg-red-500")} style={{ width: `${(sub.average/20)*100}%` }} />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-6 duration-500">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => { setSelectedSubject(null); setAiReport(null) }} className="rounded-xl h-10 md:h-12 bg-white shadow-sm border border-muted/50 px-3 md:px-5 font-black text-[10px] md:text-sm uppercase">
                <ChevronLeft className="mr-1 size-3 md:size-4" /> Retour
              </Button>
              <h2 className="text-xl md:text-4xl font-black uppercase">{selectedSubject}</h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
              <div className="lg:col-span-8">
                <Card className="p-4 md:p-12 rounded-[2rem] md:rounded-[4rem] bg-white border-none shadow-sm">
                  <div className="h-[220px] md:h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={subjectChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: "900"}} dy={10} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: "700"}} />
                        <Tooltip contentStyle={{ borderRadius: "1rem", border: "none", fontSize: "10px" }} />
                        <Area type="monotone" dataKey="Ma Note" stroke="#14532d" strokeWidth={4} fill="#14532d20" />
                        <Area type="monotone" dataKey="Moy. Classe" stroke="#94a3b8" strokeWidth={2} fill="#94a3b820" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 md:p-12 bg-foreground text-white rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-none">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <Sparkles className="size-4 md:size-6 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-lg md:text-2xl font-black uppercase">Audit IA</h3>
                    </div>
                    <div className="p-5 md:p-8 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 italic text-[9px] md:text-sm font-medium leading-relaxed text-white/80 min-h-[100px] flex items-center justify-center text-center">
                      {aiReport ? `"${aiReport.academicFeedback}"` : `"Analyse de ta progression en ${selectedSubject}..."`}
                    </div>
                    <Button onClick={handleAiAudit} disabled={analyzing} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] md:text-sm transition-all active:scale-95">
                      {analyzing ? <Loader2 className="animate-spin size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
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
