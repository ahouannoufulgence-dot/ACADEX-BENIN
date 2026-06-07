
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  ShieldCheck,
  TrendingUp,
  Download,
  Zap,
  Loader2,
  Trophy,
  Target,
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
    const matricule = localStorage.getItem('acadex_user_id') || ""
    setStudentId(matricule)
    const parts = matricule.split('-')
    if (parts.length >= 2) setStudentClass(parts[1])
  }, [])

  // RÉCEPTION DES NOTES LIÉES PAR MATRICULE
  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)

  // LOGIQUE DE CALCUL "3+2" ET ANALYSE IA
  const subjectAnalyses = useMemo(() => {
    const subjects: Record<string, any> = {}
    if (!myGrades) return []

    const termGrades = myGrades.filter((g: any) => g.term === activeTerm)

    termGrades.forEach((g: any) => {
      const sub = g.subject
      if (!subjects[sub]) {
        subjects[sub] = {
          name: sub,
          coef: Number(g.coefficient) || 1,
          i1: null, i2: null, i3: null,
          d1: null, d2: null,
        }
      }
      const s = subjects[sub]
      if (g.type === "int1") s.i1 = Number(g.value)
      if (g.type === "int2") s.i2 = Number(g.value)
      if (g.type === "int3") s.i3 = Number(g.value)
      if (g.type === "dev1") s.d1 = Number(g.value)
      if (g.type === "dev2") s.d2 = Number(g.value)
    })

    return Object.values(subjects).map((s: any) => {
      const avgInt = ((s.i1 || 0) + (s.i2 || 0) + (s.i3 || 0)) / 3
      s.myAverage = (avgInt + (s.d1 || 0) + (s.d2 || 0)) / 3
      s.weighted = s.myAverage * s.coef
      return s
    })
  }, [myGrades, activeTerm])

  const generalAverage = useMemo(() => {
    if (subjectAnalyses.length === 0) return "0.00"
    const totalWeighted = subjectAnalyses.reduce((acc, s: any) => acc + s.weighted, 0)
    const totalCoef = subjectAnalyses.reduce((acc, s: any) => acc + s.coef, 0)
    return totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"
  }, [subjectAnalyses])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Mon Carnet <span className="text-primary italic">Acadex</span></h1>
            <p className="text-muted-foreground font-medium">Analyse temps réel de tes performances en {studentClass}.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg">
            MOYENNE : {generalAverage}
          </Badge>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTerm} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-16 p-1.5 flex w-fit shadow-md">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-[1.5rem] font-black px-10 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loadingMyGrades ? (
                <div className="col-span-full py-20 text-center animate-pulse font-black text-muted-foreground">Synchronisation avec tes professeurs...</div>
              ) : subjectAnalyses.length === 0 ? (
                <Card className="col-span-full p-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <FileText className="size-20 mx-auto mb-6" />
                  <h3 className="text-2xl font-black">Aucune note scellée</h3>
                  <p className="font-medium">Tes résultats apparaîtront dès que tes professeurs auront publié les notes.</p>
                </Card>
              ) : (
                subjectAnalyses.map((subject: any, i) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all">
                    <div className={cn("h-3 w-full", subject.myAverage >= 14 ? "bg-emerald-500" : subject.myAverage >= 10 ? "bg-primary" : "bg-destructive")} />
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{subject.name}</h4>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Coefficient : {subject.coef}</p>
                        </div>
                        <Badge className={cn("h-12 w-16 justify-center rounded-2xl text-xl font-black", subject.myAverage >= 10 ? "bg-primary/5 text-primary" : "bg-red-50 text-red-600")}>
                          {subject.myAverage.toFixed(1)}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase text-muted-foreground min-w-[70px]">Interros</span>
                           <div className="flex gap-2">
                              {[subject.i1, subject.i2, subject.i3].map((n, idx) => (
                                <div key={idx} className={cn("size-9 rounded-xl flex items-center justify-center text-xs font-black border-2", n === null ? "border-dashed border-muted text-muted-foreground/30" : "bg-muted/30 border-transparent")}>
                                  {n ?? '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase text-muted-foreground min-w-[70px]">Devoirs</span>
                           <div className="flex gap-2">
                              {[subject.d1, subject.d2].map((n, idx) => (
                                <div key={idx} className={cn("h-9 w-14 rounded-xl flex items-center justify-center text-xs font-black border-2", n === null ? "border-dashed border-muted text-muted-foreground/30" : "bg-primary/10 border-primary/20 text-primary")}>
                                  {n ?? '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-muted/10 rounded-2xl border border-muted/20">
                         <TrendingUp className="size-4 text-primary mt-0.5 shrink-0" />
                         <p className="text-[10px] font-bold text-muted-foreground italic leading-tight">
                           {subject.myAverage >= 15 ? "Excellent travail dans cette matière !" : subject.myAverage >= 10 ? "Performance stable, continue tes efforts." : "Matière fragile, demande conseil à ton professeur."}
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
