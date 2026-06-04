
"use client"

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
  Calendar,
  ArrowUpRight,
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
  PieChart,
  Pie,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const stats = [
  { title: "Élèves", value: "1,248", change: "+12", trend: "up", icon: Users, color: "text-primary" },
  { title: "Enseignants", value: "48", change: "Actifs", trend: "up", icon: ShieldCheck, color: "text-primary" },
  { title: "Réussite", value: "94.2%", change: "+2.1%", trend: "up", icon: TrendingUp, color: "text-primary" },
  { title: "Absences", value: "12", change: "Aujourd'hui", trend: "down", icon: Clock, color: "text-destructive" },
]

const performanceData = [
  { name: "6ème", value: 14.5, color: "#14532D" },
  { name: "5ème", value: 13.8, color: "#111827" },
  { name: "4ème", value: 15.2, color: "#14532D" },
  { name: "3ème", value: 11.5, color: "#B91C1C" },
  { name: "2nde", value: 14.2, color: "#14532D" },
  { name: "1ère", value: 15.8, color: "#14532D" },
  { name: "Tle", value: 16.1, color: "#14532D" },
]

const academicStatus = [
  { name: "Succès (>10)", value: 85, color: "#14532D" },
  { name: "Échec (<10)", value: 15, color: "#B91C1C" },
]

const directorAlerts = [
  { id: 1, type: "Finance", message: "27 paiements restent impayés pour le T1.", severity: "high", icon: CreditCard },
  { id: 2, type: "Pédagogie", message: "3 enseignants n'ont pas encore saisi les notes de Devoir.", severity: "medium", icon: Zap },
  { id: 3, type: "Discipline", message: "5 élèves ont dépassé le seuil d'absences autorisé.", severity: "low", icon: AlertCircle },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Cockpit Directeur</h1>
            <p className="text-muted-foreground mt-2 font-medium">L'état de votre établissement en un coup d'œil.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-bold bg-white">
              Année 2025-2026
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold text-lg">
              <Zap className="mr-2 size-5 fill-white" />
              Rapport IA
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
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

        {/* Assistant & Performance */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Assistant Cards */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="size-5 text-primary fill-primary" />
              <h2 className="text-xl font-black">Assistant Intelligent</h2>
            </div>
            {directorAlerts.map((alert) => (
              <Card key={alert.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
                <div className={`h-1.5 w-full ${alert.severity === 'high' ? 'bg-destructive' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-primary'}`} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                      <alert.icon className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{alert.type}</p>
                      <p className="text-sm font-bold leading-relaxed">{alert.message}</p>
                      <Button variant="link" className="p-0 h-auto text-xs font-black text-primary">Agir maintenant →</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Charts */}
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
                      <Tooltip />
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

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Performance par Niveau</CardTitle>
                  <CardDescription>Moyennes générales du trimestre</CardDescription>
                </div>
                <Activity className="size-6 text-primary" />
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 20]} />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
