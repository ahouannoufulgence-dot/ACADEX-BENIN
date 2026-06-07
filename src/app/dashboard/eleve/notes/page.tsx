
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
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
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
    if (parts.length >= 2) setStudentClass(parts[1].replace(/([0-9]+[A-Z]+).*/, '$1')) // Extraction du niveau/promotion (ex: 3EME)
  }, [])

  // 1. MES NOTES RÉELLES
  const myGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  // 2. NOTES DE TOUTE LA PROMOTION (Pour calcul moyenne promotion)
  // On considère que la promotion est extraite de la classe (ex: "3EME" pour "3EME A")
  const promotionPrefix = useMemo(() => {
    if (!studentClass) return ""
    return studentClass.match(/^[0-9]+[A-Z]+/)?.[0] || studentClass
  }, [studentClass])

  const allGradesQuery = useMemo(() => {
    if (!db) return null
    return query(collection(db, "grades"))
  }, [db])

  const { data: myGrades, loading: loadingMyGrades } = useCollection(myGradesQuery)
  const { data: allGrades } = useCollection(allGradesQuery)

  // LOGIQUE DE CALCUL MULTI-NIVEAUX
  const analysis = useMemo(() => {
    if (!myGrades || !allGrades) return null
    
    // Filtrage par trimestre
    const myTermGrades = myGrades.filter((g: any) => g.term === activeTerm)
    const allTermGrades = allGrades.filter((g: any) => g.term === activeTerm)

    // Helper pour calculer une moyenne pondérée ACADEX
    const calcAvg = (gradeList: any[]) => {
      const subs: Record<string, any> = {}
      gradeList.forEach((g: any) => {
        const sub = g.subject
        if (!subs[sub]) subs[sub] = { i1:0, i2:0, i3:0, d1:0, d2:0, c: Number(g.coefficient) || 1, countI:0, countD:0 }
        if (g.type === "int1") { subs[sub].i1 = Number(g.value); subs[sub].countI++ }
        if (g.type === "int2") { subs[sub].i2 = Number(g.value); subs[sub].countI++ }
        if (g.type === "int3") { subs[sub].i3 = Number(g.value); subs[sub].countI++ }
        if (g.type === "dev1") { subs[sub].d1 = Number(g.value); subs[sub].countD++ }
        if (g.type === "dev2") { subs[sub].d2 = Number(g.value); subs[sub].countD++ }
      })
      
      let totalW = 0, totalC = 0
      Object.values(subs).forEach((s: any) => {
        const avgInt = (s.i1 + s.i2 + s.i3) / 3
        const avgSub = (avgInt + s.d1 + s.d2) / 3
        totalW += avgSub * s.c
        totalC += s.c
      })
      return totalC > 0 ? (totalW / totalC) : 0
    }

    // Moyenne Perso
    const myAvg = calcAvg(myTermGrades)

    // Moyenne Classe (On filtre les notes de la classe de l'élève)
    const classGrades = allTermGrades.filter((g: any) => g.classId === localStorage.getItem('acadex_user_id')?.split('-')[1])
    const classAvg = calcAvg(classGrades)

    // Moyenne Promotion (On filtre les notes par préfixe de niveau)
    const promoGrades = allTermGrades.filter((g: any) => g.classId?.startsWith(promotionPrefix))
    const promoAvg = calcAvg(promoGrades)

    // Analyse par matière pour les cartes
    const subjects: Record<string, any> = {}
    myTermGrades.forEach((g: any) => {
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

    const subjectList = Object.values(subjects).map((s: any) => {
      const avgInt = ((s.i1 || 0) + (s.i2 || 0) + (s.i3 || 0)) / 3
      s.myAverage = (avgInt + (s.d1 || 0) + (s.d2 || 0)) / 3
      return s
    })

    return { myAvg, classAvg, promoAvg, subjects: subjectList }
  }, [myGrades, allGrades, activeTerm, promotionPrefix])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Acadex</span></h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Vos moyennes sont comparées à l'ensemble du niveau {promotionPrefix}.
            </p>
          </div>
          <Badge className="bg-primary text-white border-none px-8 py-3 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
            MA MOYENNE : {analysis?.myAvg.toFixed(2) || "0.00"}
          </Badge>
        </div>

        {/* CARTES DE COMPARAISON PROMOTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Ma Moyenne</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-foreground">{analysis?.myAvg.toFixed(2) || "0.00"}</h3>
                <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Trophy className="size-6" /></div>
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all border-l-8 border-amber-400">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Moyenne Classe</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-foreground">{analysis?.classAvg.toFixed(2) || "0.00"}</h3>
                {analysis && analysis.myAvg >= analysis.classAvg ? (
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-3 py-1"><ArrowUpRight className="size-3 mr-1" /> AU-DESSUS</Badge>
                ) : (
                   <Badge className="bg-red-50 text-red-600 border-none font-black px-3 py-1"><ArrowDownRight className="size-3 mr-1" /> EN-DESSOUS</Badge>
                )}
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-xl flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Moyenne Promotion {promotionPrefix}</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-primary">{analysis?.promoAvg.toFixed(2) || "0.00"}</h3>
                <div className="p-3 bg-white/10 rounded-2xl"><Zap className="size-6 text-primary fill-primary" /></div>
              </div>
              <p className="text-[9px] font-bold text-white/60 mt-4 uppercase tracking-tighter italic">"Vous êtes comparé à toutes les classes du niveau {promotionPrefix}"</p>
           </Card>
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
                  Calcul des moyennes promotionnelles...
                </div>
              ) : !analysis || analysis.subjects.length === 0 ? (
                <Card className="col-span-full p-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <FileText className="size-20 mx-auto mb-6" />
                  <h3 className="text-2xl font-black">Aucun point scellé</h3>
                  <p className="font-medium text-muted-foreground">Tes résultats apparaîtront dès que tes professeurs auront publié les notes du {activeTerm}.</p>
                </Card>
              ) : (
                analysis.subjects.map((subject: any, i: number) => (
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
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Performance Réelle</p>
                           <div className="flex gap-2">
                              {[subject.i1, subject.i2, subject.i3].map((n, idx) => (
                                <div key={idx} className={cn("flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all", n === null ? "border-dashed border-muted text-muted-foreground/20" : "bg-muted/30 border-transparent text-foreground")}>
                                  {n !== null ? n.toFixed(1) : '-'}
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-muted/10 rounded-2xl border border-muted/20">
                         <div className="size-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                           {subject.myAverage >= analysis.promoAvg ? <TrendingUp className="size-4 text-emerald-500" /> : <TrendingDown className="size-4 text-red-500" />}
                         </div>
                         <p className="text-[11px] font-bold text-muted-foreground italic leading-tight">
                           {subject.myAverage >= analysis.promoAvg 
                             ? "Ta performance dans cette matière est au-dessus de la moyenne du niveau." 
                             : "Attention, tu es en dessous du niveau global de la promotion dans cette matière."}
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
                <ShieldCheck className="text-primary size-7" />
              </div>
              <div>
                <p className="font-black text-foreground uppercase tracking-widest text-xs">Note de Sincérité Promotionnelle</p>
                <p className="text-sm font-medium text-muted-foreground max-w-xl">
                  Les moyennes de classe et de promotion sont calculées à partir de toutes les notes scellées du niveau {promotionPrefix}.
                </p>
              </div>
           </div>
           <Button className="rounded-2xl font-black bg-foreground text-white px-10 h-14 shadow-xl">Imprimer mon carnet</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
