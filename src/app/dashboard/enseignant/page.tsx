"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  Clock, 
  PenTool, 
  UserCheck, 
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TeacherDashboard() {
  const stats = [
    { title: "Mes Classes", value: "0", change: "Attribuées", icon: Users },
    { title: "Notes à Saisir", value: "0", change: "Alertes", icon: PenTool },
    { title: "Prochain Cours", value: "--:--", change: "Horaire", icon: Clock },
    { title: "Mon Pointage", value: "Non fait", change: "Statut", icon: UserCheck },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground">Espace <span className="text-primary italic">Enseignant</span></h1>
            <p className="text-muted-foreground font-medium">Gérez vos cours et vos notes en toute simplicité.</p>
          </div>
          <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
            <Link href="/notes">
              <PenTool className="mr-2 size-5" /> Saisir les Notes
            </Link>
          </Button>
        </div>

        <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-24 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl">
              <Calendar className="size-12 text-primary" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-3xl font-black italic">"Prêt pour votre journée ?"</h3>
              <p className="text-white/60 font-medium">Consultez votre emploi du temps et validez votre présence.</p>
            </div>
            <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
              <Link href="/agenda">Voir l'Emploi du temps</Link>
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-7 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-muted rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <stat.icon className="size-7" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-foreground">{stat.value}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           <Link href="/eleves" className="p-10 bg-white rounded-[3rem] shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 group">
              <div className="size-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="size-8" /></div>
              <h3 className="text-2xl font-black">Gérer mes classes</h3>
              <p className="text-muted-foreground font-medium">Liste des élèves, absences et comportements.</p>
           </Link>
           <Link href="/assistant" className="p-10 bg-white rounded-[3rem] shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 group border-2 border-dashed border-primary/20">
              <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles className="size-8" /></div>
              <h3 className="text-2xl font-black text-primary">Assistant ACADEX</h3>
              <p className="text-muted-foreground font-medium">Obtenez une aide pédagogique assistée par l'IA.</p>
           </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
