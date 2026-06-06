
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
  Activity,
  Calculator,
  BookOpen,
  Clock
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  Pie,
  PieChart,
  CartesianGrid
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection } from "@/firebase"
import { collection } from "firebase/firestore"
import { useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"

export default function StatisticsPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("generale")

  // Données réelles Firestore - Strictement réactives
  const { data: students, loading: loadingStudents } = useCollection(collection(db, "students"))
  const { data: teachers, loading: loadingTeachers } = useCollection(collection(db, "teachers"))
  const { data: payments, loading: loadingPayments } = useCollection(collection(db, "payments"))
  const { data: grades } = useCollection(collection(db, "grades"))

  // CALCUL DES INDICATEURS GLOBAUX RÉELS
  const kpis = useMemo(() => {
    const totalStudents = Array.isArray(students) ? students.length : 0
    const totalTeachers = Array.isArray(teachers) ? teachers.length : 0
    const totalRevenue = Array.isArray(payments) ? payments.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) : 0
    const avgSchool = Array.isArray(grades) && grades.length > 0 
      ? (grades.reduce((acc, g: any) => acc + (g.average || 0), 0) / grades.length).toFixed(2)
      : "0.00"
    
    return { totalStudents, totalTeachers, totalRevenue, avgSchool }
  }, [students, teachers, payments, grades])

  // RÉPARTITION PAR GENRE
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
          ['Total Recouvrement Trésorerie', `${kpis.totalRevenue.toLocaleString()} FCFA`],
        ],
        headStyles: { fillColor: [20, 83, 45] }
      })

      doc.save(`ACADEX_STATISTIQUES_${new Date().toLocaleDateString()}.pdf`)
      toast({ title: "Rapport exporté" })
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
            <p className="text-muted-foreground font-medium">Analyse multidimensionnelle en temps réel basée sur vos données réelles.</p>
          </div>
          <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-2xl h-14 px-10 font-black text-lg relative z-10">
            <FileDown className="mr-2 size-6" /> Export PDF
          </Button>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        {/* INDICATEURS RÉELS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Effectif Global", value: kpis.totalStudents, icon: Users, color: "text-blue-600" },
            { label: "Moyenne École", value: kpis.avgSchool, icon: GraduationCap, color: "text-primary" },
            { label: "Présence moyenne", value: "0%", icon: UserCheck, color: "text-emerald-600" },
            { label: "Trésorerie", value: kpis.totalRevenue.toLocaleString() + " FCFA", icon: CreditCard, color: "text-amber-600" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <kpi.icon className="size-7" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-foreground">{kpi.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-fit shadow-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="generale" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest">Vue Générale</TabsTrigger>
            <TabsTrigger value="pedagogie" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest">Pédagogie</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest">Finances</TabsTrigger>
            <TabsTrigger value="ia" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest flex gap-2">
              <Sparkles className="size-4" /> Prédictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generale" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10 min-h-[400px]">
                <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                  <Activity className="size-16 mb-4 text-muted-foreground" />
                  <p className="font-bold text-center">Aucune donnée disponible pour générer les graphiques d'activité.</p>
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center">
                  <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                    <PieChartIcon className="text-primary" /> Mixité & Genre
                  </h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {kpis.totalStudents > 0 ? (
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
                    ) : (
                      <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Attente de profils...</p>
                    )}
                  </div>
                  <div className="pt-6 border-t w-full space-y-2">
                    <p className="text-lg font-black text-primary">{kpis.totalStudents} inscrits réels</p>
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
                <h3 className="text-4xl font-black mb-6">Analyse IA en attente</h3>
                <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed italic">
                  "Le Cerveau ACADEX a besoin de données vivantes pour projeter des tendances fiables."
                </p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
