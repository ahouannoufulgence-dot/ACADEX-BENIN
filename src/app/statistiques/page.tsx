
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle,
  FileDown,
  ChevronRight,
  UserCheck,
  UserX,
  PieChart as PieChartIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calculator,
  BookOpen,
  Shapes,
  Clock,
  Printer
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  Legend
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"

export default function StatisticsPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("generale")

  // Données réelles Firestore
  const { data: students } = useCollection(collection(db, "students"))
  const { data: teachers } = useCollection(collection(db, "teachers"))
  const { data: payments } = useCollection(collection(db, "payments"))
  const { data: grades } = useCollection(collection(db, "grades"))

  // 1. CALCUL DES KPIs GLOBAUX (REMIS À ZÉRO SI VIDE)
  const kpis = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const avgSchool = grades?.length 
      ? (grades.reduce((acc, g: any) => acc + (g.average || 0), 0) / grades.length).toFixed(2)
      : "0.00"
    
    // Taux de présence réel (initialisé à 0%)
    const presenceRate = totalStudents > 0 ? "0.0%" : "0.0%"

    return { totalStudents, totalTeachers, totalRevenue, avgSchool, presenceRate }
  }, [students, teachers, payments, grades])

  // 2. RÉPARTITION ÉLÈVES PAR CLASSE
  const classDistribution = useMemo(() => {
    if (!students || students.length === 0) return []
    const groups: Record<string, number> = {}
    students.forEach((s: any) => {
      groups[s.classId] = (groups[s.classId] || 0) + 1
    })
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [students])

  // 3. PERFORMANCE PAR DISCIPLINE
  const subjectPerformance = useMemo(() => {
    if (!grades || grades.length === 0) return []
    const groups: Record<string, { sum: number, count: number }> = {}
    grades.forEach((g: any) => {
      if (!groups[g.subject]) groups[g.subject] = { sum: 0, count: 0 }
      groups[g.subject].sum += g.average || 0
      groups[g.subject].count += 1
    })
    return Object.entries(groups)
      .map(([name, data]) => ({ name, moyenne: Number((data.sum / data.count).toFixed(2)) }))
      .sort((a, b) => b.moyenne - a.moyenne)
  }, [grades])

  // 4. RÉPARTITION PAR GENRE
  const genderStats = useMemo(() => {
    if (!students || students.length === 0) return [{ name: 'Garçons', value: 0 }, { name: 'Filles', value: 0 }]
    const m = students.filter((s: any) => s.gender === 'Masculin').length
    const f = students.filter((s: any) => s.gender === 'Féminin').length
    return [
      { name: 'Garçons', value: m },
      { name: 'Filles', value: f },
    ]
  }, [students])

  const COLORS = ['#14532d', '#fbbf24', '#ef4444', '#3b82f6', '#8b5cf6']

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text("ACADEX - RAPPORT STATISTIQUE", 105, 20, { align: "center" })
      
      autoTable(doc, {
        startY: 50,
        head: [['Indicateur Périodique', 'Valeur Réelle']],
        body: [
          ['Effectif Global Élèves', kpis.totalStudents],
          ['Corps Enseignant Actif', kpis.totalTeachers],
          ['Moyenne Générale École', `${kpis.avgSchool} / 20`],
          ['Taux de Présence Moyen', kpis.presenceRate],
          ['Total Recouvrement Trésorerie', `${kpis.totalRevenue.toLocaleString()} FCFA`],
        ],
        headStyles: { fillColor: [20, 83, 45] }
      })

      doc.save(`ACADEX_STATISTIQUES_${new Date().toLocaleDateString()}.pdf`)
      toast({ title: "Rapport généré" })
    } catch (e) {
      toast({ title: "Erreur Export", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in duration-700">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-5xl font-black text-foreground tracking-tight">Intelligence <span className="text-primary italic">Établissement</span></h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Analyse multidimensionnelle en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-2xl h-14 px-10 font-black text-lg">
              <FileDown className="mr-2 size-6" /> Export Rapport PDF
            </Button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Effectif Global", value: kpis.totalStudents, icon: Users, color: "text-blue-600", trend: "0%" },
            { label: "Moyenne École", value: kpis.avgSchool, icon: GraduationCap, color: "text-primary", trend: "0.00" },
            { label: "Présence Élèves", value: kpis.presenceRate, icon: UserCheck, color: "text-emerald-600", trend: "0%" },
            { label: "Trésorerie", value: kpis.totalRevenue.toLocaleString(), icon: CreditCard, color: "text-amber-600", trend: "0%" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <kpi.icon className="size-7" />
                  </div>
                  <Badge variant="outline" className="border-none bg-muted/50 text-[10px] font-black">{kpi.trend}</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-foreground">{kpi.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-fit shadow-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="generale" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Vue Générale</TabsTrigger>
            <TabsTrigger value="pedagogie" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Pédagogie</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Finances</TabsTrigger>
            <TabsTrigger value="ia" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest flex gap-2 data-[state=active]:bg-foreground data-[state=active]:text-white">
              <Sparkles className="size-4" /> Prédictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generale" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10 min-h-[400px]">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <CardTitle className="text-2xl font-black">Performance par Discipline</CardTitle>
                    <CardDescription className="font-medium">Calcul des moyennes à l'échelle de l'école.</CardDescription>
                  </div>
                  <Calculator className="size-10 text-primary opacity-20" />
                </div>
                <div className="h-[400px] w-full">
                  {subjectPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 20]} />
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none' }} />
                        <Bar dataKey="moyenne" radius={[12, 12, 0, 0]} barSize={50}>
                          {subjectPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.moyenne >= 10 ? '#14532d' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                      <BookOpen className="size-16 mb-4" />
                      <p className="font-bold">Aucune note enregistrée.</p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center">
                  <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                    <PieChartIcon className="text-primary" /> Mixité & Genre
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderStats}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={10}
                          dataKey="value"
                        >
                          {genderStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="pt-6 border-t w-full space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Données initialisées</p>
                    <p className="text-lg font-black text-primary">{students?.length || 0} inscrits</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ia" className="animate-in zoom-in-95 duration-500">
             <Card className="border-none shadow-2xl bg-foreground text-white p-20 rounded-[4rem] text-center">
                <div className="size-24 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10">
                   <Sparkles className="size-12 text-primary animate-pulse" />
                </div>
                <h3 className="text-4xl font-black mb-6">Prédictions en attente</h3>
                <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed italic">
                  "Le Cerveau ACADEX a besoin d'au moins un trimestre complet de données réelles pour projeter des tendances de réussite fiables."
                </p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
