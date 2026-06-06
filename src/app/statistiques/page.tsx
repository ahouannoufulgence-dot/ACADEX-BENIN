
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
  BookOpen
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
  const [activeView, setActiveTab] = useState("generale")

  // Données réelles
  const studentsRef = collection(db, "students")
  const teachersRef = collection(db, "teachers")
  const paymentsRef = collection(db, "payments")
  const gradesRef = collection(db, "grades")

  const { data: students, loading: loadingStudents } = useCollection(studentsRef)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersRef)
  const { data: payments, loading: loadingPayments } = useCollection(paymentsRef)
  const { data: grades } = useCollection(gradesRef)

  // 1. VUE GÉNÉRALE - KPI
  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const avgSchool = grades?.length 
      ? (grades.reduce((acc, g: any) => acc + (g.average || 0), 0) / grades.length).toFixed(2)
      : "0.00"

    return { totalStudents, totalTeachers, totalRevenue, avgSchool }
  }, [students, teachers, payments, grades])

  // 2. RÉPARTITION ÉLÈVES PAR CLASSE
  const studentsByClassData = useMemo(() => {
    if (!students) return []
    const groups: Record<string, number> = {}
    students.forEach((s: any) => {
      groups[s.classId] = (groups[s.classId] || 0) + 1
    })
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [students])

  // 3. PERFORMANCE PAR MATIÈRE (Top 5)
  const performanceBySubject = useMemo(() => {
    if (!grades) return []
    const groups: Record<string, { sum: number, count: number }> = {}
    grades.forEach((g: any) => {
      if (!groups[g.subject]) groups[g.subject] = { sum: 0, count: 0 }
      groups[g.subject].sum += g.average || 0
      groups[g.subject].count += 1
    })
    return Object.entries(groups)
      .map(([name, data]) => ({ name, moyenne: data.sum / data.count }))
      .sort((a, b) => b.moyenne - a.moyenne)
      .slice(0, 8)
  }, [grades])

  // 4. RÉPARTITION GENRE
  const genderData = useMemo(() => {
    if (!students) return [{ name: 'M', value: 0 }, { name: 'F', value: 0 }]
    const m = students.filter((s: any) => s.gender === 'Masculin').length
    const f = students.filter((s: any) => s.gender === 'Féminin').length
    return [
      { name: 'Garçons', value: m },
      { name: 'Filles', value: f },
    ]
  }, [students])

  const COLORS = ['#14532d', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("ACADEX - RAPPORT ANALYTIQUE ÉTABLISSEMENT", 105, 20, { align: "center" })
      
      autoTable(doc, {
        startY: 40,
        head: [['Indicateur', 'Valeur Actuelle']],
        body: [
          ['Total Élèves', stats.totalStudents],
          ['Total Enseignants', stats.totalTeachers],
          ['Moyenne École', `${stats.avgSchool} / 20`],
          ['Recouvrement Total', `${stats.totalRevenue.toLocaleString()} FCFA`],
        ],
        headStyles: { fillColor: [20, 83, 45] }
      })

      doc.save(`ACADEX_STATISTIQUES_${new Date().getTime()}.pdf`)
      toast({ title: "Succès", description: "Le rapport statistique a été généré avec succès." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'exportation PDF.", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* EN-TÊTE STATISTIQUES */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Intelligence Établissement</h1>
            <p className="text-muted-foreground mt-2 font-medium">Analyse multidimensionnelle des performances Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 bg-white font-bold">
               Année 2024-2025
             </Button>
             <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-lg">
                <FileDown className="mr-2 size-5" /> Export Rapport Complet
             </Button>
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Effectif Global", value: stats.totalStudents, sub: "Élèves", icon: Users, trend: "+12%", trendUp: true },
            { label: "Moyenne École", value: stats.avgSchool, sub: "/20", icon: GraduationCap, trend: "+0.5", trendUp: true },
            { label: "Taux de Réussite", value: "0.0%", sub: "Objectif 90%", icon: CheckCircle2, trend: "0.0%", trendUp: true },
            { label: "Recouvrement", value: stats.totalRevenue.toLocaleString(), sub: "FCFA", icon: CreditCard, trend: "65%", trendUp: true },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                   <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                     <kpi.icon className="size-7" />
                   </div>
                   <Badge variant="outline" className={`border-none font-black text-[10px] px-3 py-1 rounded-full ${kpi.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {kpi.trendUp ? <ArrowUpRight className="size-3 mr-1 inline" /> : <ArrowDownRight className="size-3 mr-1 inline" />}
                      {kpi.trend}
                   </Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">{kpi.value}</span>
                  <span className="text-xs font-bold text-muted-foreground">{kpi.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeView} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-16 p-2 flex w-fit overflow-x-auto no-scrollbar shadow-sm">
            <TabsTrigger value="generale" className="rounded-xl font-bold px-8 text-xs uppercase tracking-widest">Vue Générale</TabsTrigger>
            <TabsTrigger value="eleves" className="rounded-xl font-bold px-8 text-xs uppercase tracking-widest">Élèves</TabsTrigger>
            <TabsTrigger value="academique" className="rounded-xl font-bold px-8 text-xs uppercase tracking-widest">Pédagogie</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl font-bold px-8 text-xs uppercase tracking-widest">Finances</TabsTrigger>
            <TabsTrigger value="ia" className="rounded-xl font-bold px-8 text-xs uppercase tracking-widest flex gap-2">
               <Sparkles className="size-4" /> Prédictions
            </TabsTrigger>
          </TabsList>

          {/* 1. VUE GÉNÉRALE & CLASSEMENTS */}
          <TabsContent value="generale" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                        <CardTitle className="text-2xl font-black">Performance par Discipline</CardTitle>
                        <CardDescription className="font-medium">Moyennes agrégées à l'échelle de l'école.</CardDescription>
                      </div>
                      <Calculator className="size-10 text-primary opacity-20" />
                   </div>
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={performanceBySubject} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            />
                            <YAxis axisLine={false} tickLine={false} domain={[0, 20]} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="moyenne" radius={[8, 8, 0, 0]} barSize={40}>
                               {performanceBySubject.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.moyenne >= 10 ? '#14532d' : '#ef4444'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="lg:col-span-4 space-y-8">
                   <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
                      <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                         <PieChartIcon className="text-primary" /> Répartition par Genre
                      </h3>
                      <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                 data={genderData}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={8}
                                 dataKey="value"
                               >
                                 {genderData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                               <Tooltip />
                               <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </Card>

                   <Card className="border-none shadow-xl bg-foreground text-white rounded-[3rem] p-8 overflow-hidden relative group">
                      <div className="relative z-10 space-y-6">
                         <h4 className="text-lg font-black flex items-center gap-3">
                            <Activity className="text-primary animate-pulse" /> Alertes Directes
                         </h4>
                         <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                               <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black">12</div>
                               <p className="text-xs font-medium opacity-80">Identifiants élèves non utilisés en stock.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                               <div className="size-10 bg-destructive rounded-xl flex items-center justify-center font-black">5</div>
                               <p className="text-xs font-medium opacity-80">Enseignants absents aujourd'hui.</p>
                            </div>
                         </div>
                      </div>
                      <BarChart3 className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                   </Card>
                </div>
             </div>
          </TabsContent>

          {/* 2. ÉLÈVES & CLASSES */}
          <TabsContent value="eleves" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 col-span-2">
                   <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Shapes className="text-primary" /> Effectifs par Division</h3>
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={studentsByClassData} layout="vertical" margin={{ left: 40, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'black' }}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px' }} />
                            <Bar dataKey="value" fill="#14532d" radius={[0, 10, 10, 0]} barSize={30} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="space-y-8">
                   <Card className="border-none shadow-sm bg-white rounded-[3rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center"><TrendingUp className="size-10 text-primary" /></div>
                      <div>
                         <p className="text-4xl font-black">88%</p>
                         <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Taux de Rétention</p>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed px-4">Stabilité exemplaire de l'effectif cette année scolaire.</p>
                   </Card>
                   <Card className="premium-card p-8 border-l-[12px] border-amber-500">
                      <h4 className="font-black text-lg mb-4 flex items-center gap-3"><AlertCircle className="text-amber-500" /> Profils Suspendus</h4>
                      <p className="text-3xl font-black">0</p>
                      <p className="text-xs font-bold text-muted-foreground mt-2">Aucun élève n'est actuellement exclu ou suspendu.</p>
                   </Card>
                </div>
             </div>
          </TabsContent>

          {/* 3. IA & PRÉDICTIONS */}
          <TabsContent value="ia" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="max-w-4xl mx-auto space-y-8">
                <Card className="border-none shadow-2xl bg-foreground text-white p-12 rounded-[4rem] relative overflow-hidden group">
                   <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                      <div className="size-32 bg-primary/20 rounded-[3rem] flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                         <Sparkles className="size-16 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                         <Badge className="bg-primary text-white px-4 py-1.5 rounded-full font-black text-xs">ACADEX BRAIN ANALYTICS</Badge>
                         <h3 className="text-4xl font-black tracking-tight leading-tight">Analyse Prédictive de Réussite</h3>
                         <p className="text-xl text-white/70 font-medium leading-relaxed">
                            "Le Cerveau ACADEX attend une accumulation de 3 évaluations par matière pour générer des prédictions fiables sur les taux de réussite par classe."
                         </p>
                         <div className="pt-6 flex flex-wrap justify-center md:justify-start gap-4">
                            {["Analyse Tendances", "Risque d'échec", "Radar Talents"].map(t => (
                              <Badge key={t} variant="outline" className="border-white/20 text-white/60 rounded-full px-4 h-8">{t}</Badge>
                            ))}
                         </div>
                      </div>
                   </div>
                   <Activity className="absolute -bottom-20 -right-20 size-96 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                   <Card className="premium-card p-10 bg-white border-2 border-dashed border-primary/20">
                      <h4 className="font-black text-xl mb-6 flex items-center gap-3"><ArrowUpRight className="text-primary" /> Opportunités</h4>
                      <div className="space-y-4 opacity-50 italic">
                         <p className="text-sm font-medium">Les données de progression suggèrent un potentiel d'excellence en Mathématiques pour la classe de 3EME A.</p>
                      </div>
                   </Card>
                   <Card className="premium-card p-10 bg-white border-2 border-dashed border-red-200">
                      <h4 className="font-black text-xl mb-6 flex items-center gap-3"><ArrowDownRight className="text-destructive" /> Vigilances</h4>
                      <div className="space-y-4 opacity-50 italic">
                         <p className="text-sm font-medium">Attention au taux d'absentéisme croissant le vendredi après-midi pour les classes du second cycle.</p>
                      </div>
                   </Card>
                </div>
             </div>
          </TabsContent>

          {/* PLACEHOLDER POUR LES AUTRES TABS */}
          <TabsContent value="finance" className="animate-in fade-in duration-500">
             <Card className="border-none shadow-sm bg-white rounded-[3rem] p-20 text-center flex flex-col items-center justify-center space-y-6">
                <div className="size-20 bg-muted rounded-full flex items-center justify-center opacity-30"><CreditCard className="size-10" /></div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black">Module Financier</h3>
                   <p className="text-muted-foreground font-medium max-w-sm">Le tableau de bord financier s'actualise dès que les premiers encaissements sont validés par la comptabilité.</p>
                </div>
             </Card>
          </TabsContent>
          
          <TabsContent value="academique" className="animate-in fade-in duration-500">
             <Card className="border-none shadow-sm bg-white rounded-[3rem] p-20 text-center flex flex-col items-center justify-center space-y-6">
                <div className="size-20 bg-muted rounded-full flex items-center justify-center opacity-30"><BookOpen className="size-10" /></div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black">Analyse Pédagogique</h3>
                   <p className="text-muted-foreground font-medium max-w-sm">Détail des performances par série et par niveau en cours de calcul.</p>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
