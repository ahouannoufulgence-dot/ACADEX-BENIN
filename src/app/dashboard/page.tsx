
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Activity,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Zap,
  BookOpen,
  PieChart as PieChartIcon
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
  Pie,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const stats = [
  { title: "Effectif Total", value: "1,248", change: "+12%", trend: "up", icon: Users },
  { title: "Frais Encaissés", value: "84.2M", change: "75%", trend: "up", icon: CreditCard },
  { title: "Incidents Discipline", value: "4", change: "-2", trend: "down", icon: ShieldCheck },
  { title: "Taux de Réussite", value: "94.2%", change: "+2.1%", trend: "up", icon: TrendingUp },
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

const financialDistribution = [
  { name: "Scolarité Payée", value: 84250000, color: "#14532D" },
  { name: "Scolarité Restante", value: 15420000, color: "#B91C1C" },
]

const recentAlerts = [
  { id: 1, type: "Performance", message: "Baisse critique des moyennes en 3ème A", severity: "high", icon: AlertCircle },
  { id: 2, type: "Discipline", message: "8 retards cumulés en Terminale S1", severity: "medium", icon: ShieldCheck },
  { id: 3, type: "Finance", message: "Relance massive - Frais de cantine", severity: "low", icon: CreditCard },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Dashboard Directeur</h1>
            <p className="text-muted-foreground mt-2 font-medium">Pilotage stratégique de l'excellence académique.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-bold">
              <Calendar className="mr-2 size-4" />
              Trimestre 1 - 2024
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Zap className="mr-2 size-5 fill-white" />
              Rapport IA
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="card-hover-effect border-none shadow-sm rounded-3xl overflow-hidden group bg-white">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <stat.icon className="size-7" />
                  </div>
                  <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="rounded-full font-bold px-3 py-1">
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</h3>
                <div className="text-3xl font-black mt-1 text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="md:col-span-12 lg:col-span-4 border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Performance par Niveau</CardTitle>
                <CardDescription>Moyennes générales du 1er Trimestre</CardDescription>
              </div>
              <Activity className="size-6 text-primary" />
            </CardHeader>
            <CardContent className="h-[380px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Performance */}
          <Card className="md:col-span-12 lg:col-span-3 border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Alertes Critiques</CardTitle>
              <CardDescription>Détections automatiques de l'IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 p-5 rounded-3xl bg-muted/30 border border-transparent hover:border-border transition-all">
                  <div className={`p-3 rounded-2xl ${alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                    <alert.icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground">{alert.type}</p>
                    <p className="text-xs text-muted-foreground font-medium">{alert.message}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 text-center">Taux de recouvrement financier</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">Progression : 84%</span>
                  <span className="text-xs font-bold text-primary">Cible : 100%</span>
                </div>
                <Progress value={84} className="h-3 rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Finance Donut */}
          <Card className="border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Statut Financier</CardTitle>
              <PieChartIcon className="size-5 text-primary" />
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {financialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Activités Récentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-bold">Historique complet</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Mme. Amoussou", action: "Publication notes - Mathématiques 3ème", time: "12 min", color: "bg-primary" },
                  { name: "Sce. Comptabilité", action: "Encaissement Sossa Marc - 120,000 FCFA", time: "45 min", color: "bg-blue-500" },
                  { name: "Direction Académique", action: "Génération bulletin - Koffi Djimon", time: "2h", color: "bg-amber-500" },
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full ${act.color} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                        {act.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{act.name}</p>
                        <p className="text-xs text-muted-foreground">{act.action}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{act.time}</span>
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
