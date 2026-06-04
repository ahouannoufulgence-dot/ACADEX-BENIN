
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
  Sparkles
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
import { jsPDF } from "jspdf"
import { toast } from "@/hooks/use-toast"

const academicPerformance = [
  { level: "6ème", moyenne: 12.5, success: 88 },
  { level: "5ème", moyenne: 11.8, success: 82 },
  { level: "4ème", moyenne: 13.2, success: 91 },
  { level: "3ème", moyenne: 10.9, success: 75 },
  { level: "2nde", moyenne: 14.1, success: 94 },
  { level: "1ère", moyenne: 12.8, success: 85 },
  { level: "Tle", moyenne: 15.2, success: 98 },
]

const financialCollection = [
  { tranche: "Inscription", rate: 100, color: "#14532D" },
  { tranche: "Tranche 1", rate: 84, color: "#166534" },
  { tranche: "Tranche 2", rate: 45, color: "#15803d" },
  { tranche: "Examen", rate: 12, color: "#B91C1C" },
]

const genderDistribution = [
  { name: "Filles", value: 642, color: "#14532D" },
  { name: "Garçons", value: 606, color: "#111827" },
]

const seriesDistribution = [
  { series: "Série A", count: 245 },
  { series: "Série C", count: 82 },
  { series: "Série D", count: 320 },
  { series: "G2/G3", count: 115 },
]

export default function StatisticsPage() {
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("ACADEX - ANALYSE STATISTIQUE GLOBALE", 105, 20, { align: "center" })

      doc.setTextColor(0,0,0)
      doc.setFontSize(14)
      doc.text("Performance Académique par Niveau", 20, 45)
      academicPerformance.forEach((p, i) => {
        doc.setFontSize(10)
        doc.text(`${p.level} : Moyenne ${p.moyenne}/20 - Taux Réussite ${p.success}%`, 25, 55 + (i * 8))
      })

      doc.save("ACADEX_Statistiques.pdf")
      toast({ title: "Succès", description: "Le rapport statistique a été généré." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'exportation PDF.", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Intelligence Établissement</h1>
            <p className="text-muted-foreground mt-2 font-medium">Analyse multidimensionnelle des performances Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6 bg-white">
              Année 2025-2026
            </Button>
            <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <FileDown className="mr-2 size-5" />
              Exporter Rapport Complet
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Effectif Global", value: "1,248", sub: "Élèves", icon: Users, trend: "+12%" },
            { label: "Moyenne École", value: "13.24", sub: "/20", icon: GraduationCap, trend: "+0.4" },
            { label: "Taux de Réussite", value: "86.4%", sub: "Objectif 90%", icon: CheckCircle2, trend: "+2.1%" },
            { label: "Recouvrement", value: "84.2M", sub: "FCFA", icon: CreditCard, trend: "+14%" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                    <kpi.icon className="size-6" />
                  </div>
                  <Badge className="bg-primary/5 text-primary border-none font-black text-[10px]">{kpi.trend}</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{kpi.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{kpi.value}</span>
                  <span className="text-xs font-bold text-muted-foreground">{kpi.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="academique" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="academique" className="rounded-2xl font-bold px-8 flex gap-2">
              <GraduationCap className="size-4" /> Académique
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-bold px-8 flex gap-2">
              <CreditCard className="size-4" /> Finance
            </TabsTrigger>
            <TabsTrigger value="effectifs" className="rounded-2xl font-bold px-8 flex gap-2">
              <Users className="size-4" /> Effectifs
            </TabsTrigger>
            <TabsTrigger value="vie-scolaire" className="rounded-2xl font-bold px-8 flex gap-2">
              <Calendar className="size-4" /> Vie Scolaire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academique" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Performance par Niveau</CardTitle>
                  <CardDescription>Comparaison des moyennes générales du 1er Trimestre.</CardDescription>
                </CardHeader>
                <div className="h-[400px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={academicPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="moyenne" radius={[8, 8, 0, 0]}>
                        {academicPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.moyenne >= 12 ? '#14532D' : entry.moyenne >= 10 ? '#15803d' : '#B91C1C'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-none shadow-xl bg-foreground text-white p-12 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-24 bg-primary/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
              <Sparkles className="size-12 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-3xl font-black">Analyse Prédictive ACADEX</h3>
              <p className="text-lg text-white/70 font-medium leading-relaxed">
                "Sur la base des tendances actuelles, nous projetons un taux de réussite de 92% pour le BEPC si le soutien en Mathématiques est maintenu."
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-16 px-12 text-lg shadow-xl shadow-primary/20">
                Rapport Détaillé IA
              </Button>
            </div>
          </div>
          <BarChart3 className="absolute -bottom-16 -right-16 size-80 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>
      </div>
    </DashboardLayout>
  )
}
