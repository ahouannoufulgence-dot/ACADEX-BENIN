
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
  Calculator,
  Zap,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [activeTerm, setActiveTerm] = useState("T1")

  useEffect(() => {
    // Le studentId dans le localStorage est le MATRICULE
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: allGrades, loading } = useCollection(gradesQuery)

  // LOGIQUE DE CALCUL COMPLEXE "3 INTERROS + 2 DEVOIRS"
  const statsByTerm = useMemo(() => {
    const terms: Record<string, Record<string, any>> = { T1: {}, T2: {}, T3: {} }
    
    if (!allGrades) return terms
    
    allGrades.forEach((g: any) => {
      const termId = g.term || "T1"
      const subName = g.subject
      
      if (!terms[termId][subName]) {
        terms[termId][subName] = {
          name: subName,
          coef: g.coefficient || 1,
          int1: null, int2: null, int3: null,
          dev1: null, dev2: null
        }
      }
      
      const sub = terms[termId][subName]
      if (g.type === "int1") sub.int1 = Number(g.value)
      if (g.type === "int2") sub.int2 = Number(g.value)
      if (g.type === "int3") sub.int3 = Number(g.value)
      if (g.type === "dev1") sub.dev1 = Number(g.value)
      if (g.type === "dev2") sub.dev2 = Number(g.value)
    })
    
    return terms
  }, [allGrades])

  const calculateAverages = (termId: string) => {
    const subjects = statsByTerm[termId]
    if (!subjects || Object.keys(subjects).length === 0) return { general: "0.00", list: [] }
    
    let totalWeighted = 0
    let totalCoef = 0
    const list: any[] = []
    
    Object.values(subjects).forEach((s: any) => {
      // FORMULE OFFICIELLE ACADEX : ((I1+I2+I3)/3 + D1 + D2) / 3
      const avgInt = ((s.int1 || 0) + (s.int2 || 0) + (s.int3 || 0)) / 3
      const avgSub = (avgInt + (s.dev1 || 0) + (s.dev2 || 0)) / 3
      
      const weighted = avgSub * s.coef
      totalWeighted += weighted
      totalCoef += s.coef
      
      list.push({ ...s, avgSub, weighted })
    })
    
    const general = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"
    return { general, list }
  }

  const currentTermData = useMemo(() => calculateAverages(activeTerm), [statsByTerm, activeTerm])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon Carnet <span className="text-primary italic">Pondéré</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Liaison instantanée : 3 Interros + 2 Devoirs.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white shadow-sm">
            <Download className="mr-2 size-5" /> Télécharger Bulletin
          </Button>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTerm} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-md">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-2xl font-black px-12 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Trimestre {i+1}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b bg-muted/10 flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <BookOpen className="text-primary" /> Relevé Synchrone
                    </h3>
                    <Badge variant="outline" className="font-black border-primary/20 text-primary uppercase">CERTIFIÉ ACADEX</Badge>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    {loading ? (
                      <div className="p-20 text-center font-black text-muted-foreground animate-pulse">
                        <Loader2 className="size-8 animate-spin mx-auto mb-4" />
                        Chargement de tes notes...
                      </div>
                    ) : currentTermData.list.length === 0 ? (
                      <div className="p-24 text-center space-y-6 opacity-30">
                        <FileText className="size-20 mx-auto" />
                        <p className="text-xl font-black uppercase tracking-widest">En attente de notes scellées</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b">
                          <tr>
                            <th className="px-8 py-6 text-left">Matière / Coef</th>
                            <th className="px-4 py-6 text-center">Interros (x3)</th>
                            <th className="px-4 py-6 text-center">Devoirs (x2)</th>
                            <th className="px-8 py-6 text-right bg-primary text-white">Moyenne Pondérée</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/30">
                          {currentTermData.list.map((s: any, i) => (
                            <tr key={i} className="hover:bg-muted/5 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="font-black text-lg">{s.name}</span>
                                  <Badge className="w-fit bg-primary/10 text-primary border-none text-[9px] font-black">COEF : {s.coef}</Badge>
                                </div>
                              </td>
                              <td className="px-4 py-6 text-center">
                                <div className="flex gap-1 justify-center">
                                  {[s.int1, s.int2, s.int3].map((v, idx) => (
                                    <span key={idx} className={`size-8 rounded-lg flex items-center justify-center text-[10px] font-black ${v === null ? 'bg-muted text-muted-foreground' : 'bg-primary/5 text-primary border border-primary/10'}`}>
                                      {v ?? '-'}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-6 text-center">
                                <div className="flex gap-1 justify-center">
                                  {[s.dev1, s.dev2].map((v, idx) => (
                                    <span key={idx} className={`size-8 rounded-lg flex items-center justify-center text-[10px] font-black ${v === null ? 'bg-muted text-muted-foreground' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                      {v ?? '-'}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-2xl font-black text-primary">{s.avgSub.toFixed(2)}</span>
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Impact : {s.weighted.toFixed(2)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="p-10 bg-primary text-white text-center space-y-4 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <Zap className="absolute -top-10 -right-10 size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 relative z-10">Moyenne Générale {activeTerm}</p>
                  <p className="text-8xl font-black relative z-10 tracking-tighter">{currentTermData.general}</p>
                  <div className="pt-6 flex flex-col items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-400 shadow-glow" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Calcul certifié ACADEX</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] border-l-[12px] border-amber-500 bg-white shadow-sm">
                   <h4 className="font-black text-xl mb-4 flex items-center gap-3">
                     <TrendingUp className="text-amber-500" /> État de Réussite
                   </h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                     {Number(currentTermData.general) > 0 
                       ? "Votre moyenne est calculée en temps réel. Elle intègre les coefficients définis par votre professeur."
                       : "En attente des premières notes publiées par vos professeurs."}
                   </p>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
