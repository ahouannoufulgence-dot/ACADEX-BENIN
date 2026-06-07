
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  BookOpen, 
  ShieldCheck,
  TrendingUp,
  Download,
  Calculator,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"

export default function StudentGradesPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(
      collection(db, "grades"), 
      where("studentId", "==", studentId),
      orderBy("registeredAt", "desc")
    )
  }, [db, studentId])

  const { data: grades, loading } = useCollection(gradesQuery)

  const weightedStats = useMemo(() => {
    if (!grades || grades.length === 0) return { avg: "0.00", totalCoef: 0, count: 0 }
    
    // Pour la moyenne générale, on fait la moyenne des notes pondérées
    let sumWeighted = 0
    let sumCoef = 0
    
    grades.forEach((g: any) => {
      sumWeighted += (g.value || 0) * (g.coefficient || 1)
      sumCoef += (g.coefficient || 1)
    })
    
    return {
      avg: (sumWeighted / sumCoef).toFixed(2),
      totalCoef: sumCoef,
      count: grades.length
    }
  }, [grades])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mes <span className="text-primary italic">Notes</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Cockpit de réussite synchronisé en temps réel.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white group">
            <Download className="mr-2 size-5 group-hover:translate-y-1 transition-transform" /> Relevé PDF
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
              <div className="p-8 border-b flex items-center justify-between bg-muted/10">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <BookOpen className="text-primary" /> Dernières Évaluations
                </h3>
                <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                  {weightedStats.count} NOTES REÇUES
                </Badge>
              </div>
              <div className="p-0 overflow-x-auto">
                {loading ? (
                  <div className="p-20 text-center font-black text-muted-foreground animate-pulse">Synchronisation des résultats...</div>
                ) : !grades || grades.length === 0 ? (
                  <div className="p-24 text-center space-y-6 opacity-30">
                    <FileText className="size-20 mx-auto" />
                    <p className="text-xl font-black uppercase tracking-widest">En attente de tes premières notes</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                      <tr>
                        <th className="px-10 py-6 text-left">Matière / Évaluation</th>
                        <th className="px-6 py-6 text-center">Coef</th>
                        <th className="px-6 py-6 text-center">Note / 20</th>
                        <th className="px-10 py-6 text-right bg-primary text-white">Impact Pondéré</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {grades.map((grade: any, i) => (
                        <tr key={i} className="hover:bg-muted/5 transition-colors group">
                          <td className="px-10 py-6">
                             <div className="flex flex-col">
                                <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{grade.subject}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{grade.title || grade.type}</span>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center font-black text-muted-foreground">
                            {grade.coefficient}
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className="text-2xl font-black text-foreground">{(grade.value || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-lg px-6 py-1.5 rounded-full">
                              {(grade.weightedValue || 0).toFixed(2)}
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
            <Card className="p-10 bg-primary text-white text-center space-y-4 rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <Zap className="absolute -top-10 -right-10 size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 relative z-10">Moyenne Générale Pondérée</p>
              <p className="text-8xl font-black relative z-10">{weightedStats.avg}</p>
              <div className="pt-6 flex flex-col items-center gap-3 relative z-10">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full">
                  <Calculator className="size-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase">Cumul Coefs : {weightedStats.totalCoef}</span>
                </div>
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
                 {Number(weightedStats.avg) > 0 
                   ? "Tes résultats sont en cours d'analyse par l'Assistant ACADEX. Continue tes efforts dans les matières à fort coefficient."
                   : "Tes premières notes serviront de base à l'Assistant ACADEX pour te proposer un plan de révision personnalisé."}
               </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
