
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

export default function StatisticsPage() {
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("ACADEX - ANALYSE STATISTIQUE GLOBALE", 105, 20, { align: "center" })
      doc.save("ACADEX_Statistiques_Initiales.pdf")
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
              Année 2024-2025
            </Button>
            <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <FileDown className="mr-2 size-5" />
              Exporter Rapport Complet
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Effectif Global", value: "0", sub: "Élèves", icon: Users, trend: "0%" },
            { label: "Moyenne École", value: "0.00", sub: "/20", icon: GraduationCap, trend: "0.0" },
            { label: "Taux de Réussite", value: "0.0%", sub: "Objectif 90%", icon: CheckCircle2, trend: "0.0%" },
            { label: "Recouvrement", value: "0", sub: "FCFA", icon: CreditCard, trend: "0%" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
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
          </TabsList>

          <TabsContent value="academique" className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="size-20 bg-muted rounded-full flex items-center justify-center">
                  <BarChart3 className="size-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black">Aucune donnée statistique</h3>
                <p className="text-muted-foreground font-medium max-w-sm">Les graphiques de performance apparaîtront dès que les premières notes et émargements seront enregistrés.</p>
              </div>
            </Card>
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
                "Le Cerveau ACADEX attend une accumulation de données pour générer des prédictions fiables sur les taux de réussite par classe."
              </p>
            </div>
          </div>
          <BarChart3 className="absolute -bottom-16 -right-16 size-80 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>
      </div>
    </DashboardLayout>
  )
}
