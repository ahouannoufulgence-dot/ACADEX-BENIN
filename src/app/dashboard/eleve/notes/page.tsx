
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
  ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [activeTerm, setActiveTerm] = useState("T1")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(
      collection(db, "grades"), 
      where("studentId", "==", studentId)
    )
  }, [db, studentId])

  const { data: allGrades, loading } = useCollection(allGradesQuery)

  const subjectStats = useMemo(() => {
    if (!allGrades) return {}
    
    // Organiser par trimestre -> matière
    const terms: Record<string, any> = { T1: {}, T2: {}, T3: {} }
    
    allGrades.forEach((g: any) => {
      const termId = g.term || "T1"
      if (!terms[termId][g.subject]) {
        terms[termId][g.subject] = {
          name: g.subject,
          coef: g.coefficient || 1,
          int1: null, int2: null, int3: null,
          dev1: null, dev2: null,
          sumInt: 0, countInt: 0
        }
      }
      
      const sub = terms[termId][g.subject]
      if (g.type === "int1") sub.int1 = g.value
      if (g.type === "int2") sub.int2 = g.value
      if (g.type === "int3") sub.int3 = g.value
      if (g.type === "dev1") sub.dev1 = g.value
      if (g.type === "dev2") sub.dev2 = g.value
    })
    
    return terms
  }, [allGrades])

  const calculateTermAverage = (termId: string) => {
    const subjects = subjectStats[termId]
    if (!subjects || Object.keys(subjects).length === 0) return "0.00"
    
    let totalWeighted = 0
    let totalCoef = 0
    
    Object.values(subjects).forEach((s: any) => {
      const avgInt = ((s.int1 || 0) + (s.int2 || 0) + (s.int3 || 0)) / 3
      const avgSub = (avgInt + (s.dev1 || 0) + (s.dev2 || 0)) / 3
      totalWeighted += avgSub * s.coef
      totalCoef += s.coef
    })
    
    return totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon <span className="text-primary italic">Carnet de Notes</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi académique officiel : 3 Interros & 2 Devoirs.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white group">
            <Download className="mr-2 size-5 group-hover:translate-y-1 transition-transform" /> Télécharger Bulletin
          </Button>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTerm} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-sm">
            {["T1", "T2", "T3"].map((t, i) => (
              <TabsTrigger key={t} value={t} className="rounded-2xl font-black px-12 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
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
                      <BookOpen className="text-primary" /> Résultats Détaillés
                    </h3>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    {loading ? (
                      <div className="p-20 text-center font-black text-muted-foreground animate-pulse">Chargement de ton carnet...</div>
                    ) : !subjectStats[activeTerm] || Object.keys(subjectStats[activeTerm]).length === 0 ? (
                      <div className="p-24 text-center space-y-6 opacity-30">
                        <FileText className="size-20 mx-auto" />
                        <p className="text-xl font-black uppercase tracking-widest">Aucune note pour ce trimestre</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b">
                          <tr>
                            <th className="px-8 py-6 text-left">Matière</th>
                            <th className="px-4 py-6 text-center">Int 1</th>
                            <th className="px-4 py-6 text-center">Int 2</th>
                            <th className="px-4 py-6 text-center">Int 3</th>
                            <th className="px-4 py-6 text-center">Dev 1</th>
                            <th className="px-4 py-6 text-center">Dev 2</th>
                            <th className="px-8 py-6 text-right bg-primary text-white">Moyenne / 20</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/30">
                          {Object.values(subjectStats[activeTerm]).map((s: any, i) => {
                            const avgInt = ((s.int1 || 0) + (s.int2 || 0) + (s.int3 || 0)) / 3
                            const avgSub = (avgInt + (s.dev1 || 0) + (s.dev2 || 0)) / 3
                            return (
                              <tr key={i} className="hover:bg-muted/5 transition-colors">
                                <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                    <span className="font-black text-lg">{s.name}</span>
                                    <span className="text-[10px] font-bold text-primary uppercase">Coef : {s.coef}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center font-bold">{s.int1 ?? "---"}</td>
                                <td className="px-4 py-6 text-center font-bold">{s.int2 ?? "---"}</td>
                                <td className="px-4 py-6 text-center font-bold">{s.int3 ?? "---"}</td>
                                <td className="px-4 py-6 text-center font-bold text-primary">{s.dev1 ?? "---"}</td>
                                <td className="px-4 py-6 text-center font-bold text-primary">{s.dev2 ?? "---"}</td>
                                <td className="px-8 py-6 text-right">
                                  <Badge className="bg-primary/10 text-primary border-none font-black text-lg px-6 py-1.5 rounded-full">
                                    {avgSub.toFixed(2)}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="p-10 bg-primary text-white text-center space-y-4 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <Zap className="absolute -top-10 -right-10 size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 relative z-10">Moyenne du Trimestre</p>
                  <p className="text-8xl font-black relative z-10">{calculateTermAverage(activeTerm)}</p>
                  <div className="pt-6 flex flex-col items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Validation Officielle Acadex</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] border-l-[12px] border-amber-500 bg-white shadow-sm">
                   <h4 className="font-black text-xl mb-4 flex items-center gap-3">
                     <TrendingUp className="text-amber-500" /> Analyse IA
                   </h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                     {Number(calculateTermAverage(activeTerm)) > 0 
                       ? "Tes résultats sont en cours d'analyse par l'Assistant ACADEX. Continue tes efforts."
                       : "En attente de tes premières notes pour analyse."}
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
