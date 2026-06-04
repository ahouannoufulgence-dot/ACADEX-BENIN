"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  School,
  Activity
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

const stats = [
  { title: "Effectif Total", value: "1,248", change: "+12% ce mois", icon: Users, color: "text-foreground" },
  { title: "Enseignants", value: "86", change: "Actifs", icon: School, color: "text-foreground" },
  { title: "Absences du Jour", value: "14", change: "-4% vs hier", icon: AlertCircle, color: "text-destructive" },
  { title: "Taux de Réussite", value: "94.2%", change: "Objectif 95%", icon: TrendingUp, color: "text-primary" },
]

const performanceData = [
  { name: "6ème", value: 85 },
  { name: "5ème", value: 78 },
  { name: "4ème", value: 92 },
  { name: "3ème", value: 65 },
  { name: "2nde", value: 88 },
  { name: "1ère", value: 95 },
  { name: "Tle", value: 91 },
]

const attendanceData = [
  { name: "Lun", present: 1200, absent: 48 },
  { name: "Mar", present: 1210, absent: 38 },
  { name: "Mer", present: 1180, absent: 68 },
  { name: "Jeu", present: 1230, absent: 18 },
  { name: "Ven", present: 1195, absent: 53 },
]

const recentActivities = [
  { id: 1, user: "Mme. Amoussou", action: "a publié les notes de Mathématiques", time: "Il y a 10 min", type: "grade" },
  { id: 2, user: "Dir. Direction", action: "a envoyé une notification aux parents", time: "Il y a 45 min", type: "notif" },
  { id: 3, user: "Système", action: "Rapport de paiement mensuel généré", time: "Il y a 2h", type: "system" },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Vue d'ensemble</h1>
            <p className="text-muted-foreground mt-1">Bienvenue dans votre espace de pilotage ACADEX.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white hover:bg-muted border-2">
              <Calendar className="mr-2 size-4" />
              Semaine 24 - 2024
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              Générer un rapport
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="card-hover-effect border-none shadow-sm overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <stat.icon className="size-6" />
                  </div>
                  <span className={`text-xs font-bold ${stat.color === 'text-destructive' ? 'text-destructive' : 'text-primary'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="text-3xl font-bold mt-1 text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="lg:col-span-4 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Fréquentation Hebdomadaire</CardTitle>
                <CardDescription>Présence physique des élèves par jour</CardDescription>
              </div>
              <Activity className="size-5 text-primary" />
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="present" 
                    fill="#14532D" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                  <Bar 
                    dataKey="absent" 
                    fill="#B91C1C" 
                    radius={[4, 4, 0, 0]} 
                    barSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Progress */}
          <Card className="lg:col-span-3 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Performance par Niveau</CardTitle>
              <CardDescription>Taux de réussite trimestriel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {performanceData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className={item.value > 90 ? "text-primary font-bold" : "text-muted-foreground"}>{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Activités Récentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground hover:bg-primary">
                Tout voir
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="size-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {activity.user}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tasks / Agenda */}
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white">Agenda du Jour</CardTitle>
              <CardDescription className="text-white/60">Événements importants aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">Conseil de Classe - Terminale S1</h4>
                  <span className="text-xs bg-white text-primary px-2 py-0.5 rounded-full font-bold">14:30</span>
                </div>
                <p className="text-sm text-white/80">Salle de conférence - Aile Nord</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">Rencontre Parents/Profs</h4>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">16:00</span>
                </div>
                <p className="text-sm text-white/80">Espace numérique</p>
              </div>
              <Button variant="secondary" className="w-full mt-4 bg-white text-primary hover:bg-white/90 font-bold h-11">
                Accéder à l'agenda complet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}