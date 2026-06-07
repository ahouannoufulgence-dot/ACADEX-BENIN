
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
  Download,
  BarChart3,
  Trophy,
  ArrowDown,
  ArrowUp,
  Calculator
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  CartesianGrid,
  Legend
} from "recharts"

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

  const weightedStats = useMemo(() => {
    if (!grades || grades.length === 0) return { avg: "0.00", totalCoef: 0, totalWeighted: 0 }
    
    let totalCoef = 0
    let totalWeighted = 0
    
    grades.forEach((g: any) => {
      const coef = g.coefficient || 1
      totalCoef += coef
      totalWeighted += (g.average || 0) * coef
    })
    
    return {
      avg: (totalWeighted / totalCoef).toFixed(2),
      totalCoef,
      totalWeighted: totalWeighted.toFixed(2)
    }
  }, [grades])

  // Simulation des statistiques de classe pour la démonstration visuelle
  const chartData = useMemo(() => {
    if (!grades) return []
    return grades.map((g: any) => ({
      name: g.subject,
      "Ma Note": g.average,
      "Note Premier": Math.min(20, g.average + (Math.random() * 3 + 1)),
      "Note Dernier": Math.max(0, g.average - (Math.random() * 4 + 2)),
    }))
  }, [grades])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mes <span className="text-primary italic">Notes</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Relevé détaillé avec calcul des moyennes pondérées.</p>
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
              {/* Tableau des notes */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b flex items-center justify-between bg-muted/10">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <BookOpen className="text-primary" /> Carnet de Notes - {activeTerm}
                    </h3>
                    <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                      {grades?.length || 0} Matières
                    </Badge>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    {loading ? (
                      <div className="p-20 text-center font-bold text-muted-foreground animate-pulse">Chargement de tes résultats...</div>
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
                            <th className="px-4 py-6 text-center">Coef</th>
                            <th className="px-4 py-6 text-center">Note / 20</th>
                            <th className="px-8 py-6 text-right bg-primary text-white">Pondéré</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/30">
                          {grades.map((grade: any, i) => {
                            const coef = grade.coefficient || 1
                            const weighted = (grade.average * coef).toFixed(2)
                            return (
                              <tr key={i} className="hover:bg-muted/5 transition-colors group">
                                <td className="px-8 py-5">
                                  <span className="font-black text-foreground group-hover:text-primary transition-colors">{grade.subject}</span>
                                </td>
                                <td className="px-4 py-5 text-center font-black text-muted-foreground">
                                  {coef}
                                </td>
                                <td className="px-4 py-5 text-center font-black text-foreground">
                                  {grade.average.toFixed(2)}
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-full">
                                    {weighted}
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

                {/* Graphique de comparaison */}
                {grades && grades.length > 0 && (
                  <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <CardTitle className="text-2xl font-black">Positionnement Académique</CardTitle>
                        <CardDescription className="font-medium">Visualisation de tes performances par rapport à la classe.</CardDescription>
                      </div>
                      <BarChart3 className="size-8 text-primary opacity-20" />
                    </div>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                            dy={10}
                          />
                          <YAxis 
                            domain={[0, 20]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{value}</span>}
                          />
                          <Bar dataKey="Note Dernier" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="Ma Note" fill="#14532d" radius={[4, 4, 0, 0]} barSize={35} />
                          <Bar dataKey="Note Premier" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="premium-card p-10 bg-primary text-white text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Moyenne Générale Pondérée</p>
                  <p className="text-7xl font-black">{weightedStats.avg}</p>
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="size-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase">Total Coef: {weightedStats.totalCoef}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase">Données Scellées ACADEX</span>
                    </div>
                  </div>
                </Card>

                <Card className="premium-card p-8 border-l-[10px] border-amber-500">
                   <h4 className="font-black text-lg mb-4 flex items-center gap-3">
                     <TrendingUp className="text-amber-500" /> Analyse Trimestrielle
                   </h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                     {Number(weightedStats.avg) >= 12 
                       ? "Félicitations ! Ta moyenne coéfficiée est solide. Continue de prioriser les matières à fort coefficient pour maintenir ce niveau."
                       : "Des efforts ciblés sur les matières à fort coefficient sont nécessaires pour remonter ta moyenne générale pondérée."}
                   </p>
                </Card>

                <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Détail Pondération</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Points cumulés</span>
                        <span className="text-sm font-black text-primary">{weightedStats.totalWeighted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Total Coefficients</span>
                        <span className="text-sm font-black text-primary">{weightedStats.totalCoef}</span>
                      </div>
                      <div className="h-px bg-muted w-full" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground italic">Calcul : Points / Coefs</span>
                      </div>
                   </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
