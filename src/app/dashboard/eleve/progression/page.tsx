
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  CheckCircle2, 
  Loader2,
  Trophy,
  Target,
  Info
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

  // CALCULS RÉELS BASÉS SUR LES NOTES SCELLÉES
  const analysis = useMemo(() => {
    if (!grades || grades.length === 0) return { generalAvg: "0.00", topSubjects: [] }
    
    const subjects: Record<string, any> = {}
    grades.forEach((g: any) => {
      const sub = g.subject
      if (!subjects[sub]) {
        subjects[sub] = { name: sub, i1: 0, i2: 0, i3: 0, d1: 0, d2: 0, coef: Number(g.coefficient) || 1 }
      }
      const s = subjects[sub]
      const val = Number(g.value) || 0
      if (g.type === "int1") s.i1 = val
      if (g.type === "int2") s.i2 = val
      if (g.type === "int3") s.i3 = val
      if (g.type === "dev1") s.d1 = val
      if (g.type === "dev2") s.d2 = val
    })

    const calculatedSubjects = Object.values(subjects).map((s: any) => {
      const avgInt = (s.i1 + s.i2 + s.i3) / 3
      const subjectAvg = (avgInt + s.d1 + s.d2) / 3
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
        title: "Données insuffisantes", 
        description: "Attendez que vos professeurs scellent vos premières notes.", 
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
        evaluationContext: "Analyse de progression mi-trimestre",
        teacherComments: "L'élève sollicite un diagnostic de performance basé sur ses notes réelles."
      }
      const data = await generateAcademicFeedback(input)
      setResult(data)
      toast({ title: "Analyse terminée avec succès" })
    } catch (e) {
      toast({ title: "Erreur IA", description: "Le cerveau ACADEX est momentanément indisponible.", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Ma <span className="text-primary italic">Progression</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Visualisez votre évolution réelle certifiée par vos professeurs.</p>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing || loading || !grades?.length}
            className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-lg group"
          >
            {analyzing ? <Loader2 className="mr-3 size-6 animate-spin" /> : <Sparkles className="mr-3 size-6 group-hover:scale-125 transition-transform" />}
            {analyzing ? "Calcul en cours..." : "Lancer le Diagnostic IA"}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Stats de progression */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card p-8 bg-foreground text-white overflow-hidden relative group">
              <div className="relative z-10 space-y-6">
                <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="size-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Moyenne Actuelle</p>
                  <p className="text-5xl font-black">{loading ? "..." : analysis.generalAvg}</p>
                  <p className="text-xs font-medium text-primary mt-2">Objectif : Excellence Académique</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                   <span>Performance Certifiée</span>
                   <Badge className="bg-primary/20 text-primary border-none">LIVE</Badge>
                </div>
              </div>
              <TrendingUp className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            </Card>

            <Card className="premium-card p-8 border-l-[10px] border-primary">
               <h3 className="font-black text-lg mb-6 flex items-center gap-3"><Target className="text-primary" /> Mes points forts</h3>
               <div className="space-y-4">
                 {loading ? (
                   <div className="animate-pulse space-y-3">
                     <div className="h-14 bg-muted rounded-2xl" />
                     <div className="h-14 bg-muted rounded-2xl" />
                   </div>
                 ) : analysis.topSubjects.length === 0 ? (
                   <p className="text-sm font-medium text-muted-foreground italic">En attente de vos premières notes.</p>
                 ) : (
                   analysis.topSubjects.map((s, i) => (
                     <div key={i} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                        <span className="font-black text-foreground">{s.name}</span>
                        <Badge className="bg-primary text-white h-8 px-4 rounded-xl font-black">{s.average.toFixed(2)}</Badge>
                     </div>
                   ))
                 )}
               </div>
            </Card>
            
            <Card className="p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-start gap-4">
              <Info className="size-6 text-amber-600 shrink-0" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">
                Les statistiques de progression sont calculées instantanément dès qu'une note est scellée par un professeur dans votre classe.
              </p>
            </Card>
          </div>

          {/* Analyse IA ou Placeholder */}
          <div className="lg:col-span-8">
             {!result ? (
               <Card className="border-none shadow-sm bg-white rounded-[3rem] p-20 text-center flex flex-col items-center justify-center h-full space-y-8 border-4 border-dashed">
                 <div className="size-32 bg-muted rounded-[2.5rem] flex items-center justify-center opacity-30 shadow-inner">
                    <Sparkles className="size-16" />
                 </div>
                 <div className="space-y-3">
                   <h3 className="text-3xl font-black text-foreground">Le Coach ACADEX</h3>
                   <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                     L'IA analyse vos notes réelles pour identifier vos lacunes et vous proposer un plan de révision sur-mesure.
                   </p>
                 </div>
                 <Button 
                   onClick={handleAnalyze} 
                   disabled={analyzing || loading || !grades?.length} 
                   className="rounded-2xl h-16 px-12 bg-primary font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                 >
                   {loading ? "Chargement des notes..." : "Débloquer mon diagnostic personnel"}
                 </Button>
                 {!grades?.length && !loading && (
                   <p className="text-[10px] font-black uppercase text-destructive tracking-widest">Aucune note scellée détectée pour le moment.</p>
                 )}
               </Card>
             ) : (
               <div className="space-y-8 animate-in zoom-in-95 duration-500">
                 <Card className="premium-card p-10 border-l-[12px] border-primary shadow-xl">
                    <div className="flex justify-between items-start mb-10">
                      <Badge className="bg-primary px-6 py-2 rounded-full font-black text-sm">RAPPORT D'ANALYSE IA</Badge>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Généré le {new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-12">
                      <section className="space-y-6">
                        <h4 className="flex items-center gap-3 font-black text-2xl text-foreground">
                          <CheckCircle2 className="size-8 text-primary" /> Observation Pédagogique
                        </h4>
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 italic font-medium text-xl leading-relaxed text-foreground/80 shadow-inner">
                          "{result.academicFeedback}"
                        </div>
                      </section>

                      <section className="space-y-6">
                         <h4 className="flex items-center gap-3 font-black text-2xl text-foreground">
                           <Target className="size-8 text-primary" /> Stratégie de Réussite
                         </h4>
                         <div className="grid gap-4">
                            {result.recommendations.map((rec, i) => (
                              <div key={i} className="flex gap-6 items-start p-6 bg-white border-2 border-muted/50 rounded-3xl group hover:border-primary/30 transition-all hover:shadow-md">
                                <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0 text-xl group-hover:bg-primary group-hover:text-white transition-all">
                                  {i + 1}
                                </div>
                                <p className="font-bold text-foreground/90 text-lg leading-tight pt-2">{rec}</p>
                              </div>
                            ))}
                         </div>
                      </section>

                      <div className="pt-8 border-t border-dashed flex justify-between items-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Certification Intelligence Pédagogique ACADEX</p>
                        <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 rounded-xl">Partager aux parents</Button>
                      </div>
                    </div>
                 </Card>
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
