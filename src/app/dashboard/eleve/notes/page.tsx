
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  BookOpen, 
  ShieldCheck,
  TrendingUp,
  Download
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [activeTerm, setActiveTerm] = useState("1er Trimestre")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(
      collection(db, "grades"), 
      where("studentId", "==", studentId),
      where("term", "==", activeTerm)
    )
  }, [db, studentId, activeTerm])

  const { data: grades, loading } = useCollection(gradesQuery)

  const overallAvg = useMemo(() => {
    if (!grades || grades.length === 0) return "0.00"
    const sum = grades.reduce((acc, g: any) => acc + (g.average || 0), 0)
    return (sum / grades.length).toFixed(2)
  }, [grades])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mes <span className="text-primary italic">Notes</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Relevé détaillé de tes évaluations trimestrielles.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
            <Download className="mr-2 size-5" /> Télécharger Bulletin
          </Button>
        </div>

        <Tabs value={activeTerm} onValueChange={setActiveTerm} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-2xl h-14 p-1 flex w-fit">
            {["1er Trimestre", "2ème Trimestre", "3ème Trimestre"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-xl font-bold px-8">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTerm} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b flex items-center justify-between bg-muted/10">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <BookOpen className="text-primary" /> Carnet de Notes - {activeTerm}
                    </h3>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    {loading ? (
                      <div className="p-20 text-center font-bold text-muted-foreground animate-pulse">Chargement des notes...</div>
                    ) : !grades || grades.length === 0 ? (
                      <div className="p-20 text-center space-y-4">
                        <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30">
                          <FileText className="size-10" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Aucune note pour ce trimestre</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                          <tr>
                            <th className="px-8 py-6 text-left">Discipline</th>
                            <th className="px-4 py-6">Int 1</th>
                            <th className="px-4 py-6">Int 2</th>
                            <th className="px-4 py-6">Dev 1</th>
                            <th className="px-4 py-6">Dev 2</th>
                            <th className="px-8 py-6 text-right bg-primary text-white">Moyenne</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/30">
                          {grades.map((grade: any, i) => (
                            <tr key={i} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-8 py-5">
                                <span className="font-black text-foreground group-hover:text-primary transition-colors">{grade.subject}</span>
                              </td>
                              <td className="px-4 py-5 text-center font-bold">{grade.int1 || '-'}</td>
                              <td className="px-4 py-5 text-center font-bold">{grade.int2 || '-'}</td>
                              <td className="px-4 py-5 text-center font-bold">{grade.dev1 || '-'}</td>
                              <td className="px-4 py-5 text-center font-bold">{grade.dev2 || '-'}</td>
                              <td className="px-8 py-5 text-right">
                                <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-full">
                                  {grade.average}
                                </Badge>
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
                <Card className="premium-card p-10 bg-primary text-white text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Moyenne Trimestrielle</p>
                  <p className="text-6xl font-black">{overallAvg}</p>
                  <div className="pt-4 flex items-center justify-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase">Données Scellées par ACADEX</span>
                  </div>
                </Card>

                <Card className="premium-card p-8 border-l-[10px] border-amber-500">
                   <h4 className="font-black text-lg mb-4 flex items-center gap-3">
                     <TrendingUp className="text-amber-500" /> Analyse Trimestre
                   </h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                     {Number(overallAvg) >= 12 
                       ? "Félicitations ! Tes résultats sont encourageants. Continue ainsi pour maintenir ce niveau d'excellence."
                       : "Des efforts sont nécessaires pour remonter ta moyenne. Consulte l'assistant IA pour un plan de révision."}
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
