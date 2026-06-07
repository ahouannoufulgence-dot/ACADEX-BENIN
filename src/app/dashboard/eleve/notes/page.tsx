
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
  Target,
  Info,
  CheckCircle2,
  TrendingDown
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

  useEffect(() => {
    const matricule = localStorage.getItem('acadex_user_id') || ""
    setStudentId(matricule)
    const parts = matricule.split('-')
    if (parts.length >= 2) setStudentClass(parts[1])
  }, [])

  // RÉCEPTION DES NOTES LIÉES PAR MATRICULE (Synchronisation Spontanée)
  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  // RÉCEPTION DES STATS DE CLASSE (Confidentialité respectée : seulement les valeurs)
  const classGradesQuery = useMemo(() => {
    if (!db || !studentClass) return null
    return query(collection(db, "grades"), where("classId", "==", studentClass))
  }, [db, studentClass])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)
  const { data: classGrades } = useCollection(classGradesQuery)

  // LOGIQUE DE CALCUL "3 INTERROS + 2 DEVOIRS" ET POSITIONNEMENT
  const subjectAnalyses = useMemo(() => {
    if (!myGrades) return []
    
    const subjects: Record<string, any> = {}
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
      // Formule Acadex : ((I1+I2+I3)/3 + D1 + D2) / 3
      const avgInt = ((s.i1 || 0) + (s.i2 || 0) + (s.i3 || 0)) / 3
      s.myAverage = (avgInt + (s.d1 || 0) + (s.d2 || 0)) / 3
      s.weighted = s.myAverage * s.coef

      // Calcul des extrêmes de la classe pour cette matière (Confidentialité Totale)
      if (classGrades) {
        const otherGrades = classGrades.filter((g: any) => g.subject === s.name && g.term === activeTerm)
        // Note: On ne regarde pas les moyennes finales des autres mais les meilleures notes d'évaluations individuelles pour situer
        const values = otherGrades.map((g: any) => Number(g.value)).filter(v => !isNaN(v))
        s.classHigh = values.length > 0 ? Math.max(...values) : 0
        s.classLow = values.length > 0 ? Math.min(...values) : 0
      }

      return s
    })
  }, [myGrades, classGrades, activeTerm])

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
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Acadex</span></h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Synchronisation spontanée avec vos professeurs.
            </p>
          </div>
          <Badge className="bg-primary text-white border-none px-8 py-3 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
            MOYENNE GÉNÉRALE : {generalAverage}
          </Badge>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-md">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-[1.5rem] font-black px-12 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {loadingMyGrades ? (
                <div className="col-span-full py-20 text-center animate-pulse font-black text-muted-foreground flex flex-col items-center gap-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  Mise à jour du carnet...
                </div>
              ) : subjectAnalyses.length === 0 ? (
                <Card className="col-span-full p-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <FileText className="size-20 mx-auto mb-6" />
                  <h3 className="text-2xl font-black">Aucun point scellé</h3>
                  <p className="font-medium text-muted-foreground">Tes résultats apparaîtront dès que tes professeurs auront publié les notes du {activeTerm}.</p>
                </Card>
              ) : (
                subjectAnalyses.map((subject: any, i) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all">
                    <div className={cn("h-3 w-full", subject.myAverage >= 14 ? "bg-emerald-500" : subject.myAverage >= 10 ? "bg-primary" : "bg-destructive")} />
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{subject.name}</h4>
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">Coefficient : {subject.coef}</Badge>
                        </div>
                        <div className={cn("size-16 flex flex-col items-center justify-center rounded-2xl shadow-inner border-2", subject.myAverage >= 10 ? "bg-primary/5 border-primary/10 text-primary" : "bg-red-50 border-red-100 text-red-600")}>
                           <p className="text-xs font-black uppercase opacity-40">Moy</p>
                           <p className="text-2xl font-black">{subject.myAverage.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Interrogations (3)</p>
                           <div className="flex gap-2">
                              {[subject.i1, subject.i2, subject.i3].map((n, idx) => (
                                <div key={idx} className={cn("flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all", n === null ? "border-dashed border-muted text-muted-foreground/20" : "bg-muted/30 border-transparent text-foreground")}>
                                  {n !== null ? n.toFixed(1) : '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                         <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Devoirs (2)</p>
                           <div className="flex gap-2">
                              {[subject.d1, subject.d2].map((n, idx) => (
                                <div key={idx} className={cn("flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all", n === null ? "border-dashed border-muted text-muted-foreground/20" : "bg-primary/5 border-primary/20 text-primary")}>
                                  {n !== null ? n.toFixed(1) : '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-dashed flex justify-between items-center text-center">
                         <div>
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Max Classe</p>
                            <p className="text-lg font-black text-primary">{subject.classHigh || '---'}</p>
                         </div>
                         <div className="h-8 w-px bg-muted mx-4" />
                         <div>
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Min Classe</p>
                            <p className="text-lg font-black text-muted-foreground">{subject.classLow || '---'}</p>
                         </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-muted/10 rounded-2xl border border-muted/20">
                         <div className="size-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                           {subject.myAverage >= 12 ? <TrendingUp className="size-4 text-emerald-500" /> : <TrendingDown className="size-4 text-red-500" />}
                         </div>
                         <p className="text-[11px] font-bold text-muted-foreground italic leading-tight">
                           {subject.myAverage >= 15 ? "Tu es dans le top de la classe. Maintiens ce niveau d'excellence." : subject.myAverage >= 10 ? "Résultats satisfaisants. Travail régulier à maintenir pour progresser." : "Zone de fragilité détectée. Rapproche-toi de ton professeur pour des conseils."}
                         </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-8 bg-muted/20 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-muted-foreground/10">
           <div className="flex items-center gap-4">
              <div className="size-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <Info className="text-primary size-7" />
              </div>
              <div>
                <p className="font-black text-foreground uppercase tracking-widest text-xs">Note de Sincérité Acadex</p>
                <p className="text-sm font-medium text-muted-foreground max-w-xl">
                  Les meilleures et plus faibles notes sont affichées anonymement pour préserver la confidentialité tout en te permettant de te situer.
                </p>
              </div>
           </div>
           <Button className="rounded-2xl font-black bg-foreground text-white px-10 h-14 shadow-xl">Signaler une erreur</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
