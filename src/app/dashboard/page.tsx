
'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  CreditCard,
  ShieldCheck,
  Zap,
  PieChart as PieChartIcon,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  Lock,
  Sparkles,
  FileDown
} from "lucide-react"
import { 
  ResponsiveContainer, 
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { jsPDF } from "jspdf"
import { toast } from "@/hooks/use-toast"

const stats = [
  { title: "Élèves", value: "1,248", change: "+12", trend: "up", icon: Users, color: "text-primary" },
  { title: "Enseignants", value: "48", change: "Actifs", trend: "up", icon: ShieldCheck, color: "text-primary" },
  { title: "Réussite", value: "94.2%", change: "+2.1%", trend: "up", icon: TrendingUp, color: "text-primary" },
  { title: "Absences", value: "12", change: "Aujourd'hui", trend: "down", icon: Clock, color: "text-destructive" },
]

const academicStatus = [
  { name: "Succès (>10)", value: 85, color: "#14532D" },
  { name: "Échec (<10)", value: 15, color: "#B91C1C" },
]

const securityAlerts = [
  { id: 1, type: "Sécurité", message: "3 tentatives de connexion échouées sur le compte DIR-002.", severity: "high", icon: ShieldAlert },
  { id: 2, type: "Audit", message: "Modification de note validée pour 12 élèves (Tle D1).", severity: "medium", icon: Eye },
  { id: 3, type: "Session", message: "Une connexion suspecte détectée depuis Porto-Novo.", severity: "low", icon: Lock },
]

export default function DashboardPage() {
  const [userName, setUserName] = useState("Koffi Mensah")

  useEffect(() => {
    const savedName = localStorage.getItem('acadex_user_name')
    if (savedName) setUserName(savedName)
  }, [])

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text("ACADEX - RAPPORT DE PILOTAGE", 105, 20, { align: "center" })
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(`Directeur : ${userName}`, 20, 45)
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 190, 45, { align: "right" })
      
      doc.setFontSize(14)
      doc.text("Statistiques Globales", 20, 60)
      stats.forEach((stat, index) => {
        doc.setFontSize(10)
        doc.text(`${stat.title} : ${stat.value} (${stat.change})`, 25, 75 + (index * 10))
      })

      doc.save(`ACADEX_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`)
      toast({ title: "Succès", description: "Le rapport dashboard a été généré." })
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de générer le PDF.", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-2">
              <Sparkles className="size-4 fill-primary" />
              Pilotage Excellence Acadex
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Bonjour Monsieur <span className="text-primary italic">{userName}</span>
            </h1>
            <p className="text-muted-foreground font-medium">Voici l'état actuel de votre établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 px-6 font-bold bg-white">
              <FileDown className="mr-2 size-5" />
              Rapport PDF
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Zap className="mr-2 size-5 fill-white" />
              Rapport IA
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm rounded-3xl group bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-7" />
                  </div>
                  <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="rounded-full font-bold px-3 py-1">
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</h3>
                <div className="text-3xl font-black mt-1 text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="size-5 text-primary fill-primary/20" />
              <h2 className="text-xl font-black">Centre de Vigilance</h2>
            </div>
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className={`h-1.5 w-full ${alert.severity === 'high' ? 'bg-destructive' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-primary'}`} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                      <alert.icon className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{alert.type}</p>
                        {alert.severity === 'high' && <Badge className="bg-destructive text-[8px] h-4">CRITIQUE</Badge>}
                      </div>
                      <p className="text-sm font-bold leading-relaxed">{alert.message}</p>
                      <Button variant="link" className="p-0 h-auto text-xs font-black text-primary hover:no-underline">Enquêter →</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Réussite Globale</CardTitle>
                  <CardDescription>Moyennes &gt; 10/20</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={academicStatus}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {academicStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Recouvrement</CardTitle>
                  <CardDescription>Frais de scolarité</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center items-center h-[250px] space-y-6">
                  <div className="relative size-40 flex items-center justify-center">
                    <svg className="size-full -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#14532D" strokeWidth="12" strokeDasharray="440" strokeDashoffset="66" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black">84%</span>
                      <span className="text-[10px] font-bold text-muted-foreground">RECOUVRÉ</span>
                    </div>
                  </div>
                  <Button className="w-full rounded-2xl bg-foreground font-bold">Lancer Relances SMS</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
