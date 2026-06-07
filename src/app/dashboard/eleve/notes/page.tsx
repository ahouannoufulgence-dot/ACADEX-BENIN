
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  BookOpen, 
  ShieldCheck,
  TrendingUp,
  Download,
  Zap,
  ChevronRight,
  Loader2,
  Trophy,
  Target,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, where } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [activeTerm, setActiveTerm] = useState("T1")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    const matricule = localStorage.getItem('acadex_user_id') || ""
    const parts = matricule.split('-')
    if (parts.length >= 2) setStudentClass(parts[1])
  }, [])

  // 1. Requête pour mes propres notes
  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  // 2. Requête pour les statistiques de ma classe (Confidentialité respectée)
  const classGradesQuery = useMemo(() => {
    if (!db || !studentClass) return null
    return query(collection(db, "grades"), where("classId", "==", studentClass))
  }, [db, studentClass])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)
  const { data: classGrades } = useCollection(classGradesQuery)

  // LOGIQUE DE CALCUL ET POSITIONNEMENT
  const subjectAnalyses = useMemo(() => {
    const subjects: Record<string, any> = {}
    
    if (!myGrades) return []

    // Filtrer par trimestre actif
    const termGrades = myGrades.filter((g: any) => g.term === activeTerm)
    const termClassGrades = (classGrades || []).filter((g: any) => g.term === activeTerm)

    termGrades.forEach((g: any) => {
      const sub = g.subject
      if (!subjects[sub]) {
        subjects[sub] = {
          name: sub,
          coef: g.coefficient || 1,
          i1: null, i2: null, i3: null,
          d1: null, d2: null,
          classMax: 0,
          classMin: 20
        }
      }
      
      const s = subjects[sub]
      if (g.type === "int1") s.i1 = Number(g.value)
      if (g.type === "int2") s.i2 = Number(g.value)
      if (g.type === "int3") s.i3 = Number(g.value)
      if (g.type === "dev1") s.d1 = Number(g.value)
      if (g.type === "dev2") s.d2 = Number(g.value)
    })

    // Calculer les benchmarks de classe pour chaque matière
    Object.keys(subjects).forEach(subName => {
      const subClassGrades = termClassGrades.filter((cg: any) => cg.subject === subName)
      if (subClassGrades.length > 0) {
        subjects[subName].classMax = Math.max(...subClassGrades.map((cg: any) => Number(cg.value)))
        subjects[subName].classMin = Math.min(...subClassGrades.map((cg: any) => Number(cg.value)))
      }

      // Calcul de ma moyenne matière (Formule 3+2)
      const s = subjects[subName]
      const avgInt = ((s.i1 || 0) + (s.i2 || 0) + (s.i3 || 0)) / 3
      s.myAverage = (avgInt + (s.d1 || 0) + (s.d2 || 0)) / 3
    })

    return Object.values(subjects)
  }, [myGrades, classGrades, activeTerm])

  const generalAverage = useMemo(() => {
    if (subjectAnalyses.length === 0) return "0.00"
    const totalWeighted = subjectAnalyses.reduce((acc, s: any) => acc + (s.myAverage * s.coef), 0)
    const totalCoef = subjectAnalyses.reduce((acc, s: any) => acc + s.coef, 0)
    return totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"
  }, [subjectAnalyses])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Sincère</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Analyse de tes performances en classe de {studentClass}.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-8 font-black bg-white shadow-sm hover:bg-muted transition-all">
            <Download className="mr-2 size-5" /> Télécharger Bulletin PDF
          </Button>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTerm} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-16 p-1.5 flex w-fit shadow-md">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-[1.5rem] font-black px-10 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-10 animate-in slide-in-from-bottom-4">
            {/* Header Réussite */}
            <div className="grid md:grid-cols-12 gap-8">
              <Card className="md:col-span-4 p-10 bg-primary text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <Zap className="absolute -top-10 -right-10 size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Moyenne Générale {activeTerm}</p>
                  <p className="text-8xl font-black tracking-tighter">{generalAverage}</p>
                  <div className="pt-4 flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Calcul Certifié ACADEX</span>
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-8 p-10 bg-white border-none shadow-sm rounded-[3rem] flex flex-col justify-center">
                 <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><Target className="text-primary" /> État de Progression</h3>
                 <p className="text-muted-foreground font-medium leading-relaxed italic text-lg">
                    {Number(generalAverage) >= 14 
                      ? "Excellent travail ! Tu es sur la voie de l'excellence. Continue de maintenir ce rythme soutenu."
                      : Number(generalAverage) >= 10 
                      ? "Tes résultats sont encourageants. En renforçant ton travail sur les devoirs, tu peux atteindre le sommet de la classe."
                      : "Certaines matières nécessitent une attention particulière. N'hésite pas à demander conseil à tes professeurs."}
                 </p>
              </Card>
            </div>

            {/* Grille de Matières */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loadingMyGrades ? (
                <div className="col-span-full py-20 text-center animate-pulse font-black text-muted-foreground">Synchronisation de tes notes...</div>
              ) : subjectAnalyses.length === 0 ? (
                <Card className="col-span-full p-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <FileText className="size-20 mx-auto mb-6" />
                  <h3 className="text-2xl font-black">Aucune note scellée</h3>
                  <p className="font-medium">Tes professeurs n'ont pas encore publié de notes pour ce trimestre.</p>
                </Card>
              ) : (
                subjectAnalyses.map((subject: any, i) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300 active:scale-95">
                    {/* Status Bar */}
                    <div className={cn(
                      "h-3 w-full",
                      subject.myAverage >= 14 ? "bg-emerald-500" : subject.myAverage >= 10 ? "bg-primary" : "bg-destructive"
                    )} />
                    
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{subject.name}</h4>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Coefficient : {subject.coef}</p>
                        </div>
                        <Badge className={cn(
                          "h-12 w-16 justify-center rounded-2xl text-xl font-black shadow-inner",
                          subject.myAverage >= 14 ? "bg-emerald-50 text-emerald-600" : subject.myAverage >= 10 ? "bg-primary/5 text-primary" : "bg-red-50 text-red-600"
                        )}>
                          {subject.myAverage.toFixed(1)}
                        </Badge>
                      </div>

                      {/* Notes Details */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase text-muted-foreground min-w-[70px]">Interros</span>
                           <div className="flex gap-2">
                              {[subject.i1, subject.i2, subject.i3].map((n, idx) => (
                                <div key={idx} className={cn(
                                  "size-9 rounded-xl flex items-center justify-center text-xs font-black border-2",
                                  n === null ? "border-dashed border-muted text-muted-foreground/30" : "bg-muted/30 border-transparent"
                                )}>
                                  {n ?? '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase text-muted-foreground min-w-[70px]">Devoirs</span>
                           <div className="flex gap-2">
                              {[subject.d1, subject.d2].map((n, idx) => (
                                <div key={idx} className={cn(
                                  "h-9 w-14 rounded-xl flex items-center justify-center text-xs font-black border-2",
                                  n === null ? "border-dashed border-muted text-muted-foreground/30" : "bg-primary/10 border-primary/20 text-primary"
                                )}>
                                  {n ?? '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>

                      {/* Class Benchmarks */}
                      <div className="pt-6 border-t border-muted/50 flex justify-between gap-4">
                        <div className="text-center flex-1 p-3 bg-muted/20 rounded-2xl">
                           <p className="text-[8px] font-black uppercase text-muted-foreground">Plus faible</p>
                           <p className="text-sm font-black">{subject.classMin}/20</p>
                        </div>
                        <div className="text-center flex-1 p-3 bg-emerald-50 rounded-2xl">
                           <p className="text-[8px] font-black uppercase text-emerald-600">Meilleure</p>
                           <p className="text-sm font-black text-emerald-700">{subject.classMax}/20</p>
                        </div>
                      </div>

                      {/* Mini Analysis */}
                      <div className="flex items-start gap-3 p-4 bg-muted/10 rounded-2xl border border-muted/20">
                         <TrendingUp className="size-4 text-primary mt-0.5 shrink-0" />
                         <p className="text-[10px] font-bold text-muted-foreground leading-tight italic">
                           {subject.myAverage >= subject.classMax 
                             ? "Tu détiens la meilleure performance de la classe !" 
                             : subject.myAverage >= 12 
                             ? "Tu es bien positionné, vise la meilleure note." 
                             : "Analyse tes erreurs en devoirs pour progresser."}
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
