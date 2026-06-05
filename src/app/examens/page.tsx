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
  Award,
  BookMarked
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

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
            { label: "Réussite Globale", value: "0.0%", trend: "0%", color: "text-primary" },
            { label: "Moyenne Établissement", value: "0.00/20", trend: "0.0", color: "text-primary" },
            { label: "Élèves Excellents (>16)", value: "0", trend: "0", color: "text-amber-600" },
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

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
             <div className="size-20 bg-muted rounded-full flex items-center justify-center">
               <BookMarked className="size-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-black">Aucune session d'examen</h3>
             <p className="text-muted-foreground font-medium max-w-sm">Préparez vos compositions ou examens blancs en créant une nouvelle session.</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}