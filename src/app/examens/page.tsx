
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  History, 
  Search, 
  Plus, 
  Filter, 
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Zap,
  Award
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

const examSessions = [
  { id: "1", title: "Composition - Trimestre 1", status: "Terminé", successRate: 94.2, average: 14.25, pupils: 1248, date: "Mars 2024" },
  { id: "2", title: "Examens Blancs - BEPC/BAC", status: "En Cours", successRate: 78.5, average: 11.80, pupils: 450, date: "Avril 2024" },
  { id: "3", title: "Devoirs Surveillés N°2", status: "Programmés", successRate: 0, average: 0, pupils: 1248, date: "Mai 2024" },
]

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Centre d'Examens</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestion des évaluations nationales et internes.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              Statistiques Globales
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Nouvelle Session
            </Button>
          </div>
        </div>

        {/* Exam KPIs */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: "Réussite Globale", value: "94.2%", trend: "+2.1%", color: "text-primary" },
            { label: "Moyenne Établissement", value: "14.25/20", trend: "+0.4", color: "text-primary" },
            { label: "Élèves Excellents (>16)", value: "158", trend: "+12", color: "text-amber-600" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group">
              <CardContent className="p-8">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <p className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</p>
                  <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black bg-primary/5">
                    {kpi.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground">Sessions Actives & Passées</h2>
            <div className="relative group w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Chercher une session..." className="pl-12 h-11 bg-white border-none shadow-sm rounded-2xl font-bold" />
            </div>
          </div>

          <div className="grid gap-6">
            {examSessions.map((session) => (
              <Card key={session.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="size-16 bg-muted rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <BookOpen className="size-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-foreground">{session.title}</h3>
                          <Badge className={`font-black rounded-full ${session.status === 'Terminé' ? 'bg-primary' : session.status === 'En Cours' ? 'bg-amber-500 animate-pulse' : 'bg-foreground'}`}>
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">{session.pupils} Élèves • Session {session.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 lg:max-w-xl">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Taux Réussite</p>
                        <p className="text-2xl font-black text-foreground">{session.successRate}%</p>
                        <Progress value={session.successRate} className="h-1.5 mt-2" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Moyenne</p>
                        <p className="text-2xl font-black text-primary">{session.average > 0 ? `${session.average}/20` : 'N/A'}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Mention Bien+</p>
                        <p className="text-2xl font-black text-amber-600">{session.average > 0 ? '42%' : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="ghost" className="rounded-2xl font-black h-12 hover:bg-primary/5 hover:text-primary">Résultats</Button>
                      <Button className="bg-foreground text-white rounded-2xl font-black h-12 px-6 group-hover:bg-primary transition-all">Analyse IA</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Exam Insight Card */}
        <Card className="border-none shadow-xl bg-white p-10 rounded-[3rem] relative overflow-hidden border-l-[12px] border-primary">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="size-24 bg-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 shadow-lg">
              <Award className="size-12" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-black text-foreground">Analyse Comparative IA</h3>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                "Le taux de réussite global est en progression de 4% par rapport à l'année précédente. Les sections scientifiques tirent la moyenne vers le haut avec une performance historique en Mathématiques."
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-primary font-black">
                  <TrendingUp className="size-5" />
                  Performance Record
                </div>
                <div className="h-4 w-px bg-muted" />
                <div className="text-sm font-bold text-muted-foreground">Analysé le 24 Mai 2024</div>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-14 px-10 text-lg shadow-xl shadow-primary/20">
              Voir le Rapport Complet
            </Button>
          </div>
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
            <Zap className="size-64 fill-primary" />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
