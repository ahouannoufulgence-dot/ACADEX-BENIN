
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  School,
  Activity,
  CreditCard,
  ShieldCheck,
  TrendingDown,
  ChevronRight
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const stats = [
  { title: "Effectif Total", value: "1,248", change: "+12%", trend: "up", icon: Users },
  { title: "Frais Encaissés", value: "84.2M", change: "75% du total", trend: "up", icon: CreditCard },
  { title: "Incidents Discipline", value: "4", change: "-2 vs hier", trend: "down", icon: ShieldCheck },
  { title: "Taux de Réussite", value: "94.2%", change: "+2.1% global", trend: "up", icon: TrendingUp },
]

const performanceData = [
  { name: "6ème", value: 85, color: "#14532D" },
  { name: "5ème", value: 78, color: "#111827" },
  { name: "4ème", value: 92, color: "#14532D" },
  { name: "3ème", value: 65, color: "#B91C1C" },
  { name: "2nde", value: 88, color: "#14532D" },
  { name: "1ère", value: 95, color: "#14532D" },
  { name: "Tle", value: 91, color: "#14532D" },
]

const recentActivities = [
  { id: 1, user: "Mme. Amoussou", action: "Publication des notes 3ème", time: "10 min", type: "grade" },
  { id: 2, user: "Direction", action: "Convocation parent - Koffi D.", time: "45 min", type: "alert" },
  { id: 3, user: "Système", action: "Rapport mensuel généré", time: "2h", type: "info" },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Directeur</h1>
            <p className="text-muted-foreground mt-1">Pilotage stratégique de l'établissement d'excellence.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-full h-11">
              <Calendar className="mr-2 size-4" />
              Trimestre 1 - 2024
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-11 px-6">
              Nouveau Rapport IA
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="card-hover-effect border-none shadow-sm overflow-hidden group bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <stat.icon className="size-6" />
                  </div>
                  <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="rounded-full font-bold">
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="text-3xl font-extrabold mt-1 text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progression des Moyennes</CardTitle>
                <CardDescription>Évolution comparative par niveau</CardDescription>
              </div>
              <Activity className="size-5 text-primary" />
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={45}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Performance */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Alertes de Performance</CardTitle>
              <CardDescription>Élèves nécessitant un suivi immédiat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: "Matière : Mathématiques", level: "3ème", warning: "Baisse de 15%", color: "text-destructive" },
                { name: "Discipline : Terminale S1", level: "Global", warning: "8 retards cumulés", color: "text-amber-600" },
                { name: "Paiements : 6ème A", level: "Finance", warning: "12 relances en cours", color: "text-primary" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-all">
                  <div className={`p-2 rounded-lg ${item.color.replace('text', 'bg')}/10 ${item.color}`}>
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.level}</p>
                  </div>
                  <Badge variant="outline" className={`font-bold ${item.color}`}>{item.warning}</Badge>
                </div>
              ))}
              <Button className="w-full h-12 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white border-primary/20 transition-all font-bold">
                Voir toutes les alertes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Insight Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-primary text-white p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="size-32" />
            </div>
            <h3 className="text-xl font-bold mb-2">Insight IA Acadex</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              "L'analyse des données de cette semaine suggère une corrélation forte entre le taux d'absentéisme en Physique et la baisse des moyennes en 3ème. Une réunion de coordination est suggérée."
            </p>
            <Button variant="secondary" className="w-full bg-white text-primary font-bold rounded-xl h-11">
              Actions suggérées
            </Button>
          </Card>

          <Card className="col-span-2 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Derniers Encaissements</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-bold">Détails financiers</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Tidjani Amadou", amount: "120,000 FCFA", status: "Payé", date: "Il y a 2h" },
                  { name: "Sossa Marie", amount: "45,000 FCFA", status: "Partiel", date: "Il y a 5h" },
                  { name: "Koffi Koffi", amount: "210,000 FCFA", status: "Payé", date: "Hier" },
                ].map((pay, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-muted last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-muted rounded-full flex items-center justify-center font-bold text-primary text-xs">
                        {pay.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{pay.name}</p>
                        <p className="text-xs text-muted-foreground">{pay.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{pay.amount}</p>
                      <Badge className={pay.status === 'Payé' ? 'bg-primary' : 'bg-amber-500'}>{pay.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
