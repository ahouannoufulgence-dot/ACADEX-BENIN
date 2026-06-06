
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
  Target
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
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<GenerateAcademicFeedbackOutput | null>(null)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: grades } = useCollection(gradesQuery)

  const handleAnalyze = async () => {
    if (!grades || grades.length === 0) {
      toast({ title: "Données insuffisantes", description: "Enregistrez quelques notes avant l'analyse IA." })
      return
    }

    setAnalyzing(true)
    try {
      const input = {
        studentName: localStorage.getItem('acadex_user_name') || "Élève",
        grades: grades.map((g: any) => ({
          subject: g.subject,
          grade: Number(g.average),
          maxGrade: 20
        })),
        evaluationContext: "Maîtrise du trimestre actuel",
        teacherComments: "Élève demandant une analyse de progression personnelle."
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
            <p className="text-muted-foreground mt-2 font-medium">Visualise ton évolution et laisse l'IA booster tes résultats.</p>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-lg group"
          >
            {analyzing ? <Loader2 className="mr-3 size-6 animate-spin" /> : <Sparkles className="mr-3 size-6 group-hover:scale-125 transition-transform" />}
            {analyzing ? "Analyse en cours..." : "Analyser mes résultats"}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Stats de progression */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card p-8 bg-foreground text-white overflow-hidden relative group">
              <div className="relative z-10 space-y-6">
                <div className="size-16 bg-primary rounded-2xl flex items-center justify-center">
                  <Trophy className="size-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Moyenne Espérée</p>
                  <p className="text-4xl font-black">15.50</p>
                  <p className="text-xs font-medium text-primary mt-2">Objectif : Excellence Académique</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <div className="flex justify-between items-center text-xs font-bold">
                     <span className="text-white/60">Trimestre 1</span>
                     <span className="flex items-center gap-1"><ArrowUpRight className="size-3 text-emerald-400" /> +1.2 pts</span>
                   </div>
                </div>
              </div>
              <TrendingUp className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            </Card>

            <Card className="premium-card p-8 border-l-[10px] border-primary">
               <h3 className="font-black text-lg mb-4 flex items-center gap-3"><Target className="text-primary" /> Mes points forts</h3>
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <span className="font-bold">Mathématiques</span>
                    <Badge className="bg-primary">16/20</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <span className="font-bold">Anglais</span>
                    <Badge className="bg-primary">15/20</Badge>
                 </div>
               </div>
            </Card>
          </div>

          {/* Analyse IA ou Placeholder */}
          <div className="lg:col-span-8">
             {!result ? (
               <Card className="border-none shadow-sm bg-white rounded-[3rem] p-20 text-center flex flex-col items-center justify-center h-full space-y-6 border-4 border-dashed">
                 <div className="size-28 bg-muted rounded-[2.5rem] flex items-center justify-center opacity-30">
                    <Sparkles className="size-14" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black">Besoin d'un coach ?</h3>
                   <p className="text-muted-foreground font-medium max-w-sm">Le Cerveau ACADEX peut analyser tes notes pour te dire exactement quoi réviser.</p>
                 </div>
                 <Button onClick={handleAnalyze} disabled={analyzing} className="rounded-2xl h-14 px-10 bg-primary font-black">
                   Lancer le diagnostic IA
                 </Button>
               </Card>
             ) : (
               <div className="space-y-8 animate-in zoom-in-95 duration-500">
                 <Card className="premium-card p-10 border-l-[12px] border-primary">
                    <div className="flex justify-between items-start mb-10">
                      <Badge className="bg-primary px-5 py-2 rounded-full font-black">RAPPORT D'ANALYSE IA</Badge>
                    </div>
                    <div className="space-y-10">
                      <section className="space-y-4">
                        <h4 className="flex items-center gap-3 font-black text-xl text-foreground">
                          <CheckCircle2 className="size-7 text-primary" /> Observation Académique
                        </h4>
                        <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-primary/5 italic font-medium text-lg leading-relaxed text-foreground/80">
                          "{result.academicFeedback}"
                        </div>
                      </section>

                      <section className="space-y-4">
                         <h4 className="flex items-center gap-3 font-black text-xl text-foreground">
                           <Target className="size-7 text-primary" /> Plan d'Action Personnalisé
                         </h4>
                         <div className="grid gap-4">
                            {result.recommendations.map((rec, i) => (
                              <div key={i} className="flex gap-5 items-start p-6 bg-white border-2 border-muted/50 rounded-3xl group hover:border-primary/20 transition-all">
                                <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black shrink-0">
                                  {i + 1}
                                </div>
                                <p className="font-bold text-foreground/90 leading-tight pt-2">{rec}</p>
                              </div>
                            ))}
                         </div>
                      </section>
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
