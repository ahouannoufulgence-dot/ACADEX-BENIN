
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
  Info,
  TrendingDown,
  ArrowRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function StudentProgressionPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("Élève")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<GenerateAcademicFeedbackOutput | null>(null)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setStudentName(localStorage.getItem('acadex_user_name') || "Élève")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: grades, loading } = useCollection(gradesQuery)

  const analysis = useMemo(() => {
    if (!grades || grades.length === 0) return { generalAvg: "0.00", topSubjects: [], calculatedSubjects: [] }
    
    const subjects: Record<string, any> = {}
    grades.forEach((g: any) => {
      const sub = g.subject
      if (!subjects[sub]) {
        subjects[sub] = { name: sub, i1: null, i2: null, i3: null, d1: null, d2: null, coef: Number(g.coefficient) || 1 }
      }
      const s = subjects[sub]
      const val = Number(g.value)
      if (isNaN(val)) return

      if (g.type === "int1") s.i1 = val
      if (g.type === "int2") s.i2 = val
      if (g.type === "int3") s.i3 = val
      if (g.type === "dev1") s.d1 = val
      if (g.type === "dev2") s.d2 = val
    })

    const calculatedSubjects = Object.values(subjects).map((s: any) => {
      const interros = [s.i1, s.i2, s.i3].filter(v => v !== null)
      const avgInt = interros.length > 0 ? interros.reduce((a:number, b:number) => a+b, 0) / interros.length : null
      
      const pillars = []
      if (avgInt !== null) pillars.push(avgInt)
      if (s.d1 !== null) pillars.push(s.d1)
      if (s.d2 !== null) pillars.push(s.d2)

      const subjectAvg = pillars.length > 0 ? (pillars.reduce((a:number, b:number) => a+b, 0) / pillars.length) : 0
      return {
        name: s.name,
        average: subjectAvg,
        weighted: subjectAvg * s.coef,
        coef: s.coef
      }
    })

    const totalWeighted = calculatedSubjects.reduce((acc, s) => acc + s.weighted, 0)
    const totalCoef = calculatedSubjects.reduce((acc, s) => acc + s.coef, 0)
    const generalAvg = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"

    const topSubjects = [...calculatedSubjects]
      .sort((a, b) => b.average - a.average)
      .slice(0, 2)

    return { generalAvg, topSubjects, calculatedSubjects }
  }, [grades])

  const handleAnalyze = async () => {
    if (!analysis.calculatedSubjects || analysis.calculatedSubjects.length === 0) {
      toast({ 
        title: "Notes manquantes", 
        description: "L'IA a besoin de tes notes scellées pour te coacher.", 
        variant: "destructive" 
      })
      return
    }

    setAnalyzing(true)
    try {
      const input = {
        studentName: studentName,
        grades: analysis.calculatedSubjects.map((s: any) => ({
          subject: s.name,
          grade: Number(s.average.toFixed(2)),
          maxGrade: 20
        })),
        evaluationContext: "Diagnostic de réussite ACADEX",
        teacherComments: "Analyse autonome par l'élève."
      }
      const data = await generateAcademicFeedback(input)
      setResult(data)
      toast({ title: "Analyse réussie", description: "Le coach IA a scellé ton rapport." })
    } catch (e) {
      toast({ title: "Échec du Diagnostic", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black tracking-tight text-foreground uppercase">Ma <span className="text-primary italic">Progression</span></h1>
            <p className="text-muted-foreground font-medium text-[10px] md:text-lg">Analyse certifiée de ton évolution scolaire.</p>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing || loading || !grades?.length}
            className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl md:rounded-[2rem] h-12 md:h-16 px-6 md:px-10 font-black text-xs md:text-lg group transition-all active:scale-95 w-full md:w-auto"
          >
            {analyzing ? <Loader2 className="mr-2 md:mr-3 size-4 md:size-6 animate-spin" /> : <Sparkles className="mr-2 md:mr-3 size-4 md:size-6" />}
            {analyzing ? "Coach IA..." : "Lancer Diagnostic IA"}
          </Button>
        </div>

        <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
          {/* Stats - Vertical on Mobile */}
          <div className="lg:col-span-4 space-y-4 md:space-y-8">
            <Card className="p-6 md:p-10 bg-foreground text-white rounded-[1.8rem] md:rounded-[3.5rem] overflow-hidden relative group">
              <div className="relative z-10 space-y-4 md:space-y-8">
                <div className="size-10 md:size-20 bg-primary rounded-xl md:rounded-3xl flex items-center justify-center shadow-lg">
                  <Trophy className="size-4 md:size-10" />
                </div>
                <div>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Moyenne Générale</p>
                  <p className="text-3xl md:text-6xl font-black tabular-nums">{loading ? "..." : analysis.generalAvg}</p>
                  <Badge className="bg-primary/20 text-primary border-none text-[8px] mt-2 font-black uppercase tracking-widest h-5">LIVE ACADEX</Badge>
                </div>
              </div>
              <TrendingUp className="absolute -bottom-10 -right-10 size-32 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            </Card>

            <Card className="p-6 md:p-10 border-l-[8px] md:border-l-[15px] border-primary bg-white rounded-[1.8rem] md:rounded-[3rem] shadow-sm">
               <h3 className="font-black text-sm md:text-2xl mb-5 md:mb-8 flex items-center gap-2 md:gap-4 uppercase tracking-tight"><Target className="text-primary size-3.5 md:size-8" /> Mes Atouts</h3>
               <div className="space-y-3">
                 {loading ? (
                   <div className="animate-pulse space-y-2">
                     <div className="h-10 bg-muted rounded-xl" />
                     <div className="h-10 bg-muted rounded-xl" />
                   </div>
                 ) : analysis.topSubjects.length === 0 ? (
                   <p className="text-[10px] md:text-sm font-medium text-muted-foreground italic text-center py-4">En attente de tes premiers points.</p>
                 ) : (
                   analysis.topSubjects.map((s, i) => (
                     <div key={i} className="flex items-center justify-between p-3 md:p-6 bg-muted/20 rounded-xl md:rounded-2xl border-2 border-transparent hover:border-primary/10 transition-all">
                        <span className="font-black text-xs md:text-xl text-foreground uppercase truncate pr-4">{s.name}</span>
                        <Badge className="bg-primary text-white h-7 md:h-10 px-3 md:px-5 rounded-lg md:rounded-xl font-black text-xs md:text-xl">{s.average.toFixed(1)}</Badge>
                     </div>
                   ))
                 )}
               </div>
            </Card>
          </div>

          {/* Analysis View */}
          <div className="lg:col-span-8">
             {!result ? (
               <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] p-10 md:p-24 text-center flex flex-col items-center justify-center h-full space-y-6 md:space-y-10 border-4 border-dashed border-muted/50">
                 <div className="size-20 md:size-40 bg-muted/40 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center shadow-inner group">
                    <Sparkles className="size-8 md:size-20 text-muted-foreground opacity-20 group-hover:scale-110 group-hover:text-primary group-hover:opacity-100 transition-all duration-700" />
                 </div>
                 <div className="space-y-2 md:space-y-4">
                   <h3 className="text-xl md:text-4xl font-black text-foreground uppercase tracking-tight">Le Coach IA ACADEX</h3>
                   <p className="text-muted-foreground font-medium max-w-sm mx-auto text-[10px] md:text-xl leading-relaxed">
                     L'IA analyse tes notes scellées pour tracer ton plan vers l'excellence.
                   </p>
                 </div>
                 <Button 
                   onClick={handleAnalyze} 
                   disabled={analyzing || loading || !grades?.length} 
                   className="rounded-xl md:rounded-[1.8rem] h-12 md:h-18 px-8 md:px-16 bg-primary font-black text-xs md:text-xl shadow-xl transition-all active:scale-95"
                 >
                   Débloquer mon diagnostic
                 </Button>
               </Card>
             ) : (
               <div className="space-y-6 md:space-y-10 animate-in zoom-in-95 duration-500">
                 <Card className="p-6 md:p-14 border-l-[10px] md:border-l-[18px] border-primary shadow-2xl bg-white rounded-[2rem] md:rounded-[4rem] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 md:mb-14 relative z-10">
                      <Badge className="bg-primary px-4 md:px-8 py-1 md:py-3 rounded-full font-black text-[8px] md:text-sm uppercase tracking-widest">RAPPORT IA SCÉLLÉ</Badge>
                      <span className="text-[7px] md:text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 md:px-5 py-1 md:py-2 rounded-full">{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    <div className="space-y-8 md:space-y-16 relative z-10">
                      <section className="space-y-4 md:space-y-8">
                        <h4 className="flex items-center gap-3 md:gap-5 font-black text-lg md:text-4xl text-foreground uppercase tracking-tight">
                          <CheckCircle2 className="size-5 md:size-12 text-primary" /> Observation
                        </h4>
                        <div className="p-6 md:p-12 bg-primary/5 rounded-[1.5rem] md:rounded-[3.5rem] border-2 border-primary/10 italic font-medium text-xs md:text-2xl leading-relaxed text-foreground/80 shadow-inner">
                          "{result.academicFeedback}"
                        </div>
                      </section>

                      <section className="space-y-4 md:space-y-8">
                         <h4 className="flex items-center gap-3 md:gap-5 font-black text-lg md:text-4xl text-foreground uppercase tracking-tight">
                           <Target className="size-5 md:size-12 text-primary" /> Plan d'Action
                         </h4>
                         <div className="grid gap-3 md:gap-6">
                            {result.recommendations.map((rec, i) => (
                              <div key={i} className="flex gap-4 md:gap-8 items-start p-5 md:p-8 bg-white border-2 border-muted/50 rounded-[1.2rem] md:rounded-[2.5rem] group hover:border-primary/30 transition-all hover:shadow-md">
                                <div className="size-8 md:size-16 bg-primary/10 text-primary rounded-lg md:rounded-[1.4rem] flex items-center justify-center font-black shrink-0 text-xs md:text-3xl group-hover:bg-primary group-hover:text-white transition-all">
                                  {i + 1}
                                </div>
                                <p className="font-bold text-foreground/90 text-[10px] md:text-xl leading-tight pt-1 md:pt-4">{rec}</p>
                              </div>
                            ))}
                         </div>
                      </section>
                    </div>
                    <Zap className="absolute -bottom-10 -right-10 size-32 md:size-64 text-primary/5 pointer-events-none" />
                 </Card>
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
